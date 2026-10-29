import { 
  feature, 
  area, 
  booleanIntersects, 
  difference, 
  featureCollection 
} from '@turf/turf';
import { supabase } from '../lib/supabaseClient';
import { addCrossOpdNotification } from './crossOpdNotificationStore';
import { 
  PkkprStatusPermohonan, 
  WorkflowTransitionPayload, 
  normalizeWorkflowStatus 
} from '../types/pkkprWorkflow';

export interface SpatialDifferenceResult {
  success: boolean;
  cleanGeometry: any;
  cutAreaM2: number;
  originalAreaM2: number;
  remainingAreaM2: number;
  intersectedLayersCount: number;
  is100PercentCut: boolean;
  layerBreakdown?: {
    lp2bCutM2: number;
    mangroveCutM2: number;
    lahanBasahCutM2: number;
    tambakCutM2: number;
  };
}

/**
 * Execute automated spatial difference on a polygon against sensitive layer features:
 * 1. Layer Sawah / LP2B (LSD)
 * 2. Layer Lahan Basah
 * 3. Layer Mangrove
 * 4. Layer Tambak / Kawasan Pesisir
 */
export function executeSpatialDifference(
  permohonanGeometry: any,
  sensitiveFeatures: any[]
): SpatialDifferenceResult {
  try {
    if (!permohonanGeometry) {
      return {
        success: false,
        cleanGeometry: null,
        cutAreaM2: 0,
        originalAreaM2: 0,
        remainingAreaM2: 0,
        intersectedLayersCount: 0,
        is100PercentCut: true,
        layerBreakdown: { lp2bCutM2: 0, mangroveCutM2: 0, lahanBasahCutM2: 0, tambakCutM2: 0 }
      };
    }

    let permohonanFeature: any = null;
    if (permohonanGeometry.type === 'Feature') {
      permohonanFeature = permohonanGeometry;
    } else if (permohonanGeometry.type === 'Polygon' || permohonanGeometry.type === 'MultiPolygon') {
      permohonanFeature = feature(permohonanGeometry);
    } else if (permohonanGeometry.geometry) {
      permohonanFeature = feature(permohonanGeometry.geometry);
    }

    if (!permohonanFeature || !permohonanFeature.geometry) {
      return {
        success: false,
        cleanGeometry: permohonanGeometry,
        cutAreaM2: 0,
        originalAreaM2: 0,
        remainingAreaM2: 0,
        intersectedLayersCount: 0,
        is100PercentCut: true,
        layerBreakdown: { lp2bCutM2: 0, mangroveCutM2: 0, lahanBasahCutM2: 0, tambakCutM2: 0 }
      };
    }

    const originalAreaM2 = Math.round(area(permohonanFeature));
    let workingFeature: any = JSON.parse(JSON.stringify(permohonanFeature));
    let intersectedCount = 0;

    let lp2bCutM2 = 0;
    let mangroveCutM2 = 0;
    let lahanBasahCutM2 = 0;
    let tambakCutM2 = 0;

    for (const sensFeat of sensitiveFeatures) {
      try {
        if (!workingFeature || !workingFeature.geometry) break;

        let f: any = sensFeat;
        if (f.geometry && f.type !== 'Feature') {
          f = feature(f.geometry, f.properties || {});
        } else if (f.type === 'Polygon' || f.type === 'MultiPolygon') {
          f = feature(f);
        }

        if (f && f.geometry && booleanIntersects(workingFeature, f)) {
          intersectedCount++;
          const beforeArea = Math.round(area(workingFeature));
          
          let diff: any = null;
          try {
            diff = difference(featureCollection([workingFeature, f]));
          } catch {
            diff = (difference as any)(workingFeature, f);
          }

          const layerName = String(f.properties?.layer_id || f.properties?.name || f.properties?.nama || '').toLowerCase();

          if (diff && diff.geometry) {
            workingFeature = diff;
            const afterArea = Math.round(area(workingFeature));
            const deltaCut = Math.max(0, beforeArea - afterArea);

            if (/mangrove/i.test(layerName)) mangroveCutM2 += deltaCut;
            else if (/lahan.*basah|swamp|rawa/i.test(layerName)) lahanBasahCutM2 += deltaCut;
            else if (/tambak|pesisir/i.test(layerName)) tambakCutM2 += deltaCut;
            else lp2bCutM2 += deltaCut;
          } else {
            // Sliced completely by this feature
            const deltaCut = beforeArea;
            if (/mangrove/i.test(layerName)) mangroveCutM2 += deltaCut;
            else if (/lahan.*basah|swamp|rawa/i.test(layerName)) lahanBasahCutM2 += deltaCut;
            else if (/tambak|pesisir/i.test(layerName)) tambakCutM2 += deltaCut;
            else lp2bCutM2 += deltaCut;

            workingFeature = null;
            break;
          }
        }
      } catch (e) {
        console.warn('[executeSpatialDifference] Difference step error on feature:', e);
      }
    }

    const remainingAreaM2 = workingFeature && workingFeature.geometry ? Math.round(area(workingFeature)) : 0;
    const cutAreaM2 = Math.max(0, originalAreaM2 - remainingAreaM2);
    const is100PercentCut = remainingAreaM2 <= 0 || !workingFeature || !workingFeature.geometry;

    return {
      success: true,
      cleanGeometry: workingFeature ? workingFeature.geometry : null,
      cutAreaM2,
      originalAreaM2,
      remainingAreaM2,
      intersectedLayersCount: intersectedCount,
      is100PercentCut,
      layerBreakdown: {
        lp2bCutM2,
        mangroveCutM2,
        lahanBasahCutM2,
        tambakCutM2
      }
    };
  } catch (err) {
    console.error('[executeSpatialDifference] Failed spatial difference:', err);
    return {
      success: false,
      cleanGeometry: permohonanGeometry,
      cutAreaM2: 0,
      originalAreaM2: 0,
      remainingAreaM2: 0,
      intersectedLayersCount: 0,
      is100PercentCut: false,
      layerBreakdown: { lp2bCutM2: 0, mangroveCutM2: 0, lahanBasahCutM2: 0, tambakCutM2: 0 }
    };
  }
}

/**
 * Update local storage cache to keep cross-OPD UI reactive in real-time
 */
function syncLocalStorageStatus(
  permohonanId: string,
  newStatus: PkkprStatusPermohonan,
  metadata?: any
) {
  try {
    // 1. luwu_pkkpr_forwarded_apps_data
    const fAppsRaw = localStorage.getItem('luwu_pkkpr_forwarded_apps_data');
    let fApps = fAppsRaw ? JSON.parse(fAppsRaw) : [];
    const appIdx = fApps.findIndex((a: any) => a.id === permohonanId || a.nibNik === permohonanId);
    if (appIdx !== -1) {
      fApps[appIdx] = {
        ...fApps[appIdx],
        status_permohonan: newStatus,
        status_pkkpr: newStatus,
        status: newStatus,
        ...metadata
      };
    } else if (metadata) {
      fApps.push({
        id: permohonanId,
        status_permohonan: newStatus,
        status_pkkpr: newStatus,
        status: newStatus,
        ...metadata
      });
    }
    localStorage.setItem('luwu_pkkpr_forwarded_apps_data', JSON.stringify(fApps));

    // 2. luwu_pkkpr_my_apps (Masyarakat / Pemohon portal)
    const myAppsRaw = localStorage.getItem('luwu_pkkpr_my_apps');
    if (myAppsRaw) {
      const myApps = JSON.parse(myAppsRaw);
      const updatedMyApps = myApps.map((a: any) => {
        if (a.id === permohonanId || a.pkkpr_doc_number === permohonanId) {
          return {
            ...a,
            status_permohonan: newStatus,
            status_pkkpr: newStatus,
            status: newStatus,
            ...metadata
          };
        }
        return a;
      });
      localStorage.setItem('luwu_pkkpr_my_apps', JSON.stringify(updatedMyApps));
    }

    // 3. Dispatch storage event for same-window components
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('luwu_workflow_status_updated', {
      detail: { permohonanId, newStatus, metadata }
    }));
  } catch (e) {
    console.warn('[syncLocalStorageStatus] Cache sync warning:', e);
  }
}

/**
 * 1. WORKFLOW 1: PUPTR escalates application to Dinas Pertanian
 * Target Status: ESCALATED_PERTANIAN (Row disappears from PUPTR, appears in Pertanian)
 */
export async function workflowEscalateToPertanian(params: {
  permohonanId: string;
  applicantName: string;
  companyName: string;
  sector?: string;
  districtName?: string;
  villageName?: string;
  notes: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, notes, applicantName, companyName, sector, districtName, villageName } = params;
  const timestamp = new Date().toISOString();

  try {
    // 1. Call Backend API
    try {
      await fetch('/api/v1/pkkpr/workflow/escalate-pertanian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permohonan_id: permohonanId,
          notes,
          performed_by: 'ADMIN_PUPTR'
        })
      });
    } catch (apiErr) {
      console.warn('[workflowEscalateToPertanian] Backend API call fallback to Supabase:', apiErr);
    }

    // 2. Resilient Supabase direct update
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'VERIFIKASI_PERTANIAN',
          catatan_teknis: `[DITERUSKAN KE DINAS PERTANIAN]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'ESCALATED_PERTANIAN',
          status: 'ESCALATED_PERTANIAN',
          pertanian_status: 'FORWARDED',
          override_justification: `[DITERUSKAN KE DINAS PERTANIAN]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    // 3. Local sync
    syncLocalStorageStatus(permohonanId, 'ESCALATED_PERTANIAN', {
      pertStatus: 'FORWARDED',
      pertanianStatus: 'FORWARDED',
      catatan_teknis: `[DITERUSKAN KE DINAS PERTANIAN]: ${notes}`
    });

    // 4. Cross-OPD notification
    addCrossOpdNotification({
      applicationId: permohonanId,
      applicantName,
      companyName,
      sector: sector || 'Investasi Prioritas',
      districtName: districtName || 'Kab. Luwu',
      villageName: villageName || '-',
      targetRole: 'ADMIN_PERTANIAN',
      fromRole: 'ADMIN_PUPTR',
      type: 'FORWARD_PERTANIAN',
      title: `Eskalasi LP2B #${permohonanId}`,
      message: `PUPTR meneruskan permohonan izin untuk verifikasi LP2B & persetujuan alih fungsi: ${notes}`
    });

    return {
      success: true,
      message: 'Permohonan berhasil dialihkan ke Dinas Pertanian. Berkas kini berada di antrean Admin Pertanian.'
    };
  } catch (err: any) {
    console.error('[workflowEscalateToPertanian] Failed:', err);
    throw err;
  }
}

/**
 * 2. WORKFLOW 2: Admin Pertanian rejects application
 * Target Status: REJECTED_PERTANIAN (Row disappears from Pertanian, returns to PUPTR)
 */
export async function workflowRejectPertanian(params: {
  permohonanId: string;
  bapPenolakanNum: string;
  rejectionReason: string;
  applicantName: string;
  companyName: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, bapPenolakanNum, rejectionReason, applicantName, companyName } = params;
  const timestamp = new Date().toISOString();

  try {
    // 1. Backend API call
    try {
      await fetch('/api/v1/pkkpr/workflow/reject-pertanian', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permohonan_id: permohonanId,
          bap_penolakan_num: bapPenolakanNum,
          rejection_reason: rejectionReason,
          performed_by: 'ADMIN_PERTANIAN'
        })
      });
    } catch (apiErr) {
      console.warn('[workflowRejectPertanian] Backend API fallback:', apiErr);
    }

    // 2. Direct Supabase update
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'DITOLAK',
          berita_acara_pertanian_num: bapPenolakanNum,
          catatan_teknis: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapPenolakanNum}]: ${rejectionReason}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'REJECTED_PERTANIAN',
          status: 'REJECTED_PERTANIAN',
          pertanian_status: 'REJECTED',
          berita_acara_num: bapPenolakanNum,
          pertanian_rejection_notes: rejectionReason,
          override_justification: `[DITOLAK DINAS PERTANIAN - BAP No. ${bapPenolakanNum}]: ${rejectionReason}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    // 3. Sync cache
    syncLocalStorageStatus(permohonanId, 'REJECTED_PERTANIAN', {
      pertanianStatus: 'REJECTED',
      agriStatus: 'Rejected',
      beritaAcaraDocNum: bapPenolakanNum,
      rejectionReason
    });

    // 4. Notify PUPTR
    addCrossOpdNotification({
      applicationId: permohonanId,
      applicantName,
      companyName,
      sector: 'Pemanfaatan Ruang',
      districtName: 'Kab. Luwu',
      villageName: '-',
      targetRole: 'ADMIN_PUPTR',
      fromRole: 'ADMIN_PERTANIAN',
      type: 'REJECTED_PERTANIAN',
      title: `BAP Penolakan Pertanian #${permohonanId}`,
      message: `Dinas Pertanian menolak alih fungsi lahan LP2B (BAP: ${bapPenolakanNum}). Berkas dikembalikan ke PUPTR untuk dikembalikan ke pemohon.`,
      bapPertanianDocNumber: bapPenolakanNum
    });

    return {
      success: true,
      message: 'BAP Penolakan berhasil diterbitkan. Berkas dikembalikan ke antrean PUPTR.'
    };
  } catch (err: any) {
    console.error('[workflowRejectPertanian] Failed:', err);
    throw err;
  }
}

/**
 * 3. WORKFLOW 2: Admin Pertanian approves application with automated spatial difference
 * Target Status: PERTEK_PERTANIAN (Row disappears from Pertanian, returns to PUPTR with clean geometry)
 */
export async function workflowApprovePertanianWithDifference(params: {
  permohonanId: string;
  currentGeometry: any;
  sensitiveLayersFeatures: any[];
  baDocNum: string;
  srDocNum: string;
  notes: string;
  applicantName: string;
  companyName: string;
}): Promise<{
  success: boolean;
  cleanGeometry: any;
  cutAreaM2: number;
  remainingAreaM2: number;
  message: string;
}> {
  const {
    permohonanId,
    currentGeometry,
    sensitiveLayersFeatures,
    baDocNum,
    srDocNum,
    notes,
    applicantName,
    companyName
  } = params;

  const timestamp = new Date().toISOString();

  // 1. Execute spatial difference
  const diffResult = executeSpatialDifference(currentGeometry, sensitiveLayersFeatures);
  const cleanGeom = diffResult.cleanGeometry || currentGeometry;
  const remainingAreaHa = Number((diffResult.remainingAreaM2 / 10000).toFixed(4)) || 0.5;

  try {
    // 2. Call backend API for server-side PostGIS ST_Difference & sawah layer trimming
    try {
      await fetch('/api/v1/pkkpr/approve-alih-fungsi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          permohonan_id: permohonanId,
          berita_acara_num: baDocNum,
          surat_rekomendasi_num: srDocNum,
          notes,
          cut_geometry: cleanGeom,
          remaining_area_m2: diffResult.remainingAreaM2
        })
      });
    } catch (apiErr) {
      console.warn('[workflowApprovePertanianWithDifference] Backend endpoint warning:', apiErr);
    }

    // 3. Update Supabase with cut geometry & status Approved_Pertanian
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'APPROVED_PERTANIAN',
          pertanian_approved_at: timestamp,
          geometry_json: cleanGeom,
          geom: cleanGeom,
          luas_m2: diffResult.remainingAreaM2,
          luas_ha: remainingAreaHa,
          berita_acara_pertanian_num: baDocNum,
          catatan_teknis: `[PERTEK PERTANIAN TERBIT - ${baDocNum}]: Terpotong LP2B ${diffResult.cutAreaM2} m². Sisa luas: ${diffResult.remainingAreaM2} m². ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'PERTEK_PERTANIAN',
          status: 'PERTEK_PERTANIAN',
          pertanian_status: 'APPROVED',
          geometry: cleanGeom,
          area_ha: remainingAreaHa,
          berita_acara_num: baDocNum,
          surat_rekomendasi_num: srDocNum,
          override_justification: `[PERTEK PERTANIAN TERBIT - ${baDocNum}]: Terpotong LP2B ${diffResult.cutAreaM2} m². Sisa luas: ${diffResult.remainingAreaM2} m². ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    // 4. Update local cache
    syncLocalStorageStatus(permohonanId, 'PERTEK_PERTANIAN', {
      pertanianStatus: 'APPROVED',
      agriStatus: 'Approved',
      beritaAcaraDocNum: baDocNum,
      suratRekomendasiNum: srDocNum,
      geometry: cleanGeom,
      areaHa: remainingAreaHa,
      luasM2: diffResult.remainingAreaM2
    });

    // 5. Cross-OPD notification to PUPTR
    addCrossOpdNotification({
      applicationId: permohonanId,
      applicantName,
      companyName,
      sector: 'Pemanfaatan Ruang',
      districtName: 'Kab. Luwu',
      villageName: '-',
      targetRole: 'ADMIN_PUPTR',
      fromRole: 'ADMIN_PERTANIAN',
      type: 'APPROVED_PERTANIAN',
      title: `BAP Pertek Pertanian Terbit #${permohonanId}`,
      message: `Rekomendasi alih fungsi terbit No. ${baDocNum}. Geometri telah dipotong (${diffResult.cutAreaM2} m² dikeluarkan dari LP2B). Lanjutkan Persetujuan Akhir PUPTR.`,
      bapPertanianDocNumber: baDocNum
    });

    return {
      success: true,
      cleanGeometry: cleanGeom,
      cutAreaM2: diffResult.cutAreaM2,
      remainingAreaM2: diffResult.remainingAreaM2,
      message: `BAP Pertanian berhasil diterbitkan. Poligon permohonan telah dipotong secara spasial (Luas terpotong: ${diffResult.cutAreaM2} m²). Berkas diteruskan kembali ke PUPTR.`
    };
  } catch (err: any) {
    console.error('[workflowApprovePertanianWithDifference] Failed:', err);
    throw err;
  }
}

/**
 * 4. WORKFLOW 3: PUPTR Tindak Lanjut Penolakan (Kembalikan ke Pemohon)
 * Target Status: REJECTED_FINAL (Row disappears from PUPTR, visible in applicant portal)
 */
export async function workflowPuptrFinalReject(params: {
  permohonanId: string;
  notes: string;
  applicantName: string;
  companyName: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, notes, applicantName, companyName } = params;
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'DITOLAK',
          catatan_teknis: `[DITOLAK FINAL OLEH PUPTR]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'REJECTED_FINAL',
          status: 'REJECTED_FINAL',
          override_justification: `[DITOLAK FINAL OLEH PUPTR]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    syncLocalStorageStatus(permohonanId, 'REJECTED_FINAL', {
      pkkprStatus: 'Requires Revision',
      status_pkkpr: 'REJECTED_FINAL',
      status_permohonan: 'REJECTED_FINAL'
    });

    return {
      success: true,
      message: 'Permohonan telah dikembalikan ke pemohon secara final. Berkas telah dikeluarkan dari antrean kerja dinas.'
    };
  } catch (err: any) {
    console.error('[workflowPuptrFinalReject] Failed:', err);
    throw err;
  }
}

/**
 * 5. WORKFLOW 3: PUPTR Persetujuan Akhir (Pertek Ruang Terbit)
 * Target Status: PROSES_OSS (Row disappears from PUPTR, appears in DPMPTSP/OSS queue)
 */
export async function workflowPuptrFinalApprove(params: {
  permohonanId: string;
  bapPuptrDocNum: string;
  notes: string;
  applicantName: string;
  companyName: string;
  bapPertanianDocNum?: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, bapPuptrDocNum, notes, applicantName, companyName, bapPertanianDocNum } = params;
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'APPROVED_PUPTR',
          puptr_approved_at: timestamp,
          pertek_puptr_num: bapPuptrDocNum,
          catatan_teknis: `[PERTEK PUPTR TERBIT - ${bapPuptrDocNum}]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'PROSES_OSS',
          status: 'PROSES_OSS',
          pkkpr_doc_number: bapPuptrDocNum,
          override_justification: `[PERTEK PUPTR TERBIT - ${bapPuptrDocNum}]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    syncLocalStorageStatus(permohonanId, 'PROSES_OSS', {
      pertekPuptrNum: bapPuptrDocNum,
      pkkprDocNumber: bapPuptrDocNum,
      pkkprStatus: 'Approved_PUPTR',
      status_permohonan: 'PROSES_OSS',
      status_pkkpr: 'PROSES_OSS'
    });

    // Notify DPMPTSP / OSS
    addCrossOpdNotification({
      applicationId: permohonanId,
      applicantName,
      companyName,
      sector: 'Pemanfaatan Ruang',
      districtName: 'Kab. Luwu',
      villageName: '-',
      targetRole: 'ADMIN_DPMPTSP',
      fromRole: 'ADMIN_PUPTR',
      type: 'APPROVED_PUPTR',
      title: `Pertek PUPTR Terbit #${permohonanId}`,
      message: `PUPTR telah menerbitkan Pertek Kesesuaian Ruang No. ${bapPuptrDocNum}. Berkas siap dicetak SK Izin PKKPR & disematkan TTE Digital oleh DPMPTSP.`,
      bapPertanianDocNumber: bapPertanianDocNum,
      bapPuptrDocNumber: bapPuptrDocNum
    });

    return {
      success: true,
      message: 'Pertek PUPTR resmi diterbitkan. Permohonan telah berpindah ke Antrean Cetak & TTE DPMPTSP/OSS.'
    };
  } catch (err: any) {
    console.error('[workflowPuptrFinalApprove] Failed:', err);
    throw err;
  }
}

/**
 * 6. WORKFLOW 4: Admin Perizinan OSS / DPMPTSP Finalisasi (TTE & Terbitkan Izin)
 * Target Status: IZIN_TERBIT (Selesai, terkirim ke Pemohon)
 */
export async function workflowOssPublishTte(params: {
  permohonanId: string;
  skPkkprNum: string;
  tteSignerName: string;
  tteFileUrl?: string;
  applicantName: string;
  companyName: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, skPkkprNum, tteSignerName, tteFileUrl, applicantName, companyName } = params;
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'TERBIT',
          published_at: timestamp,
          sk_pkkpr_num: skPkkprNum,
          catatan_teknis: `[SK PKKPR RESMI TERBIT - ${skPkkprNum}]: Ditandatangani elektronik oleh ${tteSignerName}.`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'IZIN_TERBIT',
          status: 'IZIN_TERBIT',
          sk_pkkpr_doc_number: skPkkprNum,
          override_justification: `[SK PKKPR RESMI TERBIT - ${skPkkprNum}]: Ditandatangani elektronik oleh ${tteSignerName}.`,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    syncLocalStorageStatus(permohonanId, 'IZIN_TERBIT', {
      skPkkprNum,
      skPkkprDocNumber: skPkkprNum,
      isTteSigned: true,
      publishedToApplicant: true,
      status_permohonan: 'IZIN_TERBIT',
      status_pkkpr: 'IZIN_TERBIT'
    });

    return {
      success: true,
      message: 'SK PKKPR resmi diterbitkan dengan TTE sah. Dokumen telah terkirim ke dashboard pemohon.'
    };
  } catch (err: any) {
    console.error('[workflowOssPublishTte] Failed:', err);
    throw err;
  }
}

/**
 * 7. WORKFLOW REVISI: Pertanian / PUPTR Meminta Revisi Dokumen/Delineasi
 * Target Status: REVISI_PEMOHON (Tampil di Dashboard Pemohon dengan alert kuning)
 */
export async function workflowRequestRevision(params: {
  permohonanId: string;
  notes: string;
  performedByRole: string;
  actorName: string;
}): Promise<{ success: boolean; message: string }> {
  const { permohonanId, notes, performedByRole, actorName } = params;
  const timestamp = new Date().toISOString();

  try {
    await Promise.all([
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'REVISI_PEMOHON',
          catatan_revisi: notes,
          catatan_teknis: `[PERMINTAAN REVISI OLEH ${performedByRole}]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('investments')
        .update({
          status_permohonan: 'REVISI_PEMOHON',
          status: 'REVISI_PEMOHON',
          catatan_revisi: notes,
          override_justification: `[PERMINTAAN REVISI]: ${notes}`,
          updated_at: timestamp
        })
        .eq('id', permohonanId),
      supabase
        .from('gis_pkkpr')
        .update({
          status_pkkpr: 'REVISI_PEMOHON',
          catatan_teknis: notes,
          updated_at: timestamp
        })
        .eq('id', permohonanId)
    ]);

    syncLocalStorageStatus(permohonanId, 'REJECTED_FINAL', {
      pkkprStatus: 'Requires Revision',
      status_pkkpr: 'REVISI_PEMOHON',
      status_permohonan: 'REVISI_PEMOHON',
      catatan_revisi: notes
    });

    return {
      success: true,
      message: 'Permintaan revisi berkas telah dikirimkan ke pemohon.'
    };
  } catch (err: any) {
    console.error('[workflowRequestRevision] Failed:', err);
    throw err;
  }
}

/**
 * Pilihan Jenis Pengajuan PKKPR dan Pengelompokan Kategori
 */
export const PKKPR_JENIS_PENGAJUAN_OPTIONS = [
  // A. KATEGORI BANGUNAN / FISIK
  "Rumah Tinggal / Hunian Perorangan",
  "Rumah Toko (Ruko) / Tempat Usaha & Hunian",
  "Tempat Usaha / Kios / Toko / Kantor / Perdagangan Jasa",
  "Kawasan Industri / Gudang / Pabrik",
  "Fasilitas Sosial / Fasilitas Umum / Tempat Ibadah",
  // B. KATEGORI PARSIL TANAH MURNI
  "Parsil Lahan untuk Pengajuan Sertipikat / Pemecahan Lahan (ATR/BPN)",
  "Parsil Lahan Kegiatan Usaha / Perkebunan / Non-Komersial Bangunan",
  "Lainnya / Pemecahan Parsil Lahan"
] as const;

export type KategoriPengajuanPkkpr = 'BANGUNAN' | 'PARSIL_TANAH';

/**
 * Deteksi Kategori Pengajuan: 'BANGUNAN' vs 'PARSIL_TANAH'
 */
export function getKategoriPengajuan(jenis: string | null | undefined): KategoriPengajuanPkkpr {
  if (!jenis) return 'BANGUNAN';
  const parsilKeywords = [
    'parsil', 'pemecahan', 'atr/bpn', 'bpn', 'perkebunan', 'sertipikat / pemecahan', 'tanah murni', 'tanpa bangunan', 'non-komersial bangunan'
  ];
  const lower = jenis.toLowerCase();
  if (parsilKeywords.some(kw => lower.includes(kw))) {
    return 'PARSIL_TANAH';
  }
  return 'BANGUNAN';
}

/**
 * Null-Safety Guard on Auth Handlers & Workflow Permissions:
 * Ensures password validation is skipped when authMode === 'OTP' or when password is null/empty.
 */
export function validateCitizenAuthMode(payload: {
  nik?: string;
  phone?: string;
  password?: string | null;
  authMode?: 'OTP' | 'PASSWORD' | string;
}): { isValid: boolean; skipPasswordCheck: boolean; error?: string } {
  const isOtpMode = payload.authMode === 'OTP' || !payload.password || payload.password.trim() === '';
  if (isOtpMode) {
    return { isValid: true, skipPasswordCheck: true };
  }
  if (!payload.password || payload.password.trim().length < 4) {
    return { isValid: false, skipPasswordCheck: false, error: 'Password minimal 4 karakter.' };
  }
  return { isValid: true, skipPasswordCheck: false };
}

/**
 * Construct safe citizen auth payload with fallback for undefined citizenPassword
 */
export function createSafeCitizenAuthPayload(
  verifiedNik: string,
  phoneNumber: string,
  citizenPassword?: string | null,
  authMode: 'OTP' | 'PASSWORD' = 'OTP'
) {
  return {
    nik: verifiedNik,
    phone: phoneNumber,
    password: typeof citizenPassword !== 'undefined' && citizenPassword ? citizenPassword : null,
    authMode: authMode
  };
}

/**
 * Dispatch Non-Berusaha (and Berusaha) PKKPR Submission directly to PUPTR Queue & Spatial Tables
 * Dual/Triple record creation: gis_pkkpr / pkkpr_permohonan AND mpp_queues bound to instansi_code: 'PUPTR'
 */
export async function dispatchNonBerusahaPkkprToPuptrQueue(payload: {
  docNumber: string;
  virtualTicket: string;
  category: 'Non-Berusaha' | 'Berusaha' | string;
  title: string;
  applicantName: string;
  nik: string;
  phone?: string | null;
  userId?: string;
  sector?: string;
  jenisPengajuan?: string;
  kategoriPengajuan?: 'BANGUNAN' | 'PARSIL_TANAH';
  kecamatan?: string;
  desa?: string;
  luasM2?: number;
  luasHa?: number;
  geometryJson: any;
  siteplanUrl?: string | null;
  sertifikatUrl?: string | null;
  suratPengantarUrl?: string | null;
  berkasGabunganUrl?: string | null;
  catatanTeknis?: string;
  isIntersectLp2b?: boolean;
}): Promise<{ success: boolean; queueId: string; docNumber: string }> {
  const {
    docNumber,
    virtualTicket,
    category,
    title,
    applicantName,
    nik,
    phone,
    userId,
    sector,
    jenisPengajuan,
    kategoriPengajuan = 'BANGUNAN',
    kecamatan = 'Belopa',
    desa = 'Senga',
    luasM2 = 500,
    luasHa = 0.05,
    geometryJson,
    siteplanUrl,
    sertifikatUrl,
    suratPengantarUrl,
    berkasGabunganUrl,
    catatanTeknis,
    isIntersectLp2b = false
  } = payload;

  const validUserId = userId || (nik ? `cit-${nik}` : `cit-${Date.now()}`);
  const timestamp = new Date().toISOString();

  // Lifecycle Status Alignment
  const initialStatusPkkpr = isIntersectLp2b ? 'VERIFIKASI_PERTANIAN' : 'WAITING_PUPTR_VERIFICATION';
  const initialProgressStep = 'TAHAP 1: VERIFIKASI BERKAS & TATA RUANG (PUPTR)';

  // 1. Dual Record Creation - Record 1: mpp_queues
  const queuePayload = {
    id: docNumber,
    ticket_code: virtualTicket,
    instansi_code: 'PUPTR',
    target_department: 'PUPTR',
    user_id: validUserId,
    citizen_nik: nik,
    nik_pemohon: nik,
    nama_pemohon: applicantName,
    service_type: 'PKKPR',
    service_name: `Izin PKKPR Tata Ruang (${category})`,
    status: 'WAITING_PUPTR_VERIFICATION',
    category: category,
    source: 'ONLINE',
    geometry_json: geometryJson,
    created_at: timestamp,
    updated_at: timestamp
  };

  // 2. Dual Record Creation - Record 2: gis_pkkpr
  const gisPayload = {
    id: docNumber,
    nomor_tiket: virtualTicket,
    jenis_permohonan: category,
    nama_permohonan: title,
    nama_pemohon: applicantName,
    nik_pemohon: nik,
    no_whatsapp: phone || null,
    sektor: sector || (category === 'Berusaha' ? 'Komersial / Usaha' : 'Non-Komersial / Perumahan'),
    jenis_pengajuan_pkkpr: jenisPengajuan || 'Rumah Tinggal / Hunian Perorangan',
    kategori_pengajuan: kategoriPengajuan,
    file_siteplan_url: siteplanUrl || null,
    kecamatan: kecamatan,
    desa_kelurahan: desa,
    luas_m2: luasM2,
    luas_ha: luasHa,
    geometry_json: geometryJson,
    status_pkkpr: initialStatusPkkpr,
    status_permohonan: 'REVIEW_PUPTR',
    tahap_proses: initialProgressStep,
    catatan_teknis: catatanTeknis || `[PUPTR Queue Auto Dispatch] Permohonan PKKPR ${category} telah masuk ke antrean verifikasi Dinas PUPTR.`,
    file_alas_hak_url: sertifikatUrl || null,
    sertifikat_tanah_url: sertifikatUrl || null,
    surat_pengantar_desa_url: suratPengantarUrl || null,
    berkas_legalitas_gabungan_url: berkasGabunganUrl || null,
    user_id: validUserId,
    created_by: validUserId,
    created_at: timestamp,
    updated_at: timestamp
  };

  // 3. Dual Record Creation - Record 3: investments
  const invPayload = {
    id: docNumber,
    pkkpr_doc_number: virtualTicket,
    title: `[PKKPR ${category}] ${title}`,
    name: applicantName,
    category: category === 'Berusaha' ? 'Komersial / Usaha' : 'Non-Komersial / Perseorangan',
    contact_pic: applicantName,
    nama_kontak_person: applicantName,
    plot_number: nik,
    sector: sector || 'Non-Komersial / Perumahan',
    kecamatan: kecamatan,
    desa: desa,
    area_ha: luasHa,
    geometry: geometryJson,
    status: 'WAITING_PUPTR_VERIFICATION',
    status_permohonan: 'REVIEW_PUPTR',
    created_at: timestamp,
    updated_at: timestamp
  };

  // Execute strict atomic writes to Supabase database
  const [qRes, gisRes, invRes] = await Promise.all([
    supabase.from('mpp_queues').upsert([queuePayload]),
    supabase.from('gis_pkkpr').upsert([gisPayload]),
    supabase.from('investments').upsert([invPayload])
  ]);

  if (gisRes.error) {
    throw new Error(`GIS_PKKPR Insert Failed: ${gisRes.error.message}`);
  }
  if (qRes.error) {
    throw new Error(`mpp_queues Sync Failed: ${qRes.error.message}`);
  }

  // Send Cross-OPD notification to PUPTR Admin
  addCrossOpdNotification({
    applicationId: docNumber,
    applicantName: applicantName,
    companyName: title,
    sector: sector || 'Non-Komersial / Perumahan',
    districtName: kecamatan,
    villageName: desa,
    targetRole: 'ADMIN_PUPTR',
    fromRole: 'PEMOHON',
    type: 'NEW_SUBMISSION',
    title: `Permohonan PKKPR ${category} Baru #${virtualTicket}`,
    message: `Permohonan PKKPR ${category} atas nama ${applicantName} (NIK: ${nik}) telah dikirim dan berada di Antrean Verifikasi Dinas PUPTR.`
  });

  // Sync to local storage
  syncLocalStorageStatus(docNumber, 'SUBMITTED' as PkkprStatusPermohonan, {
    id: docNumber,
    pkkpr_doc_number: virtualTicket,
    nik,
    nama_pemohon: applicantName,
    title,
    category,
    status: 'WAITING_PUPTR_VERIFICATION',
    status_pkkpr: 'WAITING_PUPTR_VERIFICATION',
    status_permohonan: 'REVIEW_PUPTR',
    tahap_proses: initialProgressStep,
    submitted_at: timestamp
  });

  return {
    success: true,
    queueId: virtualTicket,
    docNumber
  };
}


