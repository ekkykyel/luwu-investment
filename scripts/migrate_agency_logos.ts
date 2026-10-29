/**
 * Skrip Migrasi Standarisasi Logo Instansi MPP Simpurusiang
 * Mengikuti Spesifikasi E1 & Bagian B:
 * - Menempatkan logo pada kanvas persegi 512px dengan padding aman 8% (area aktif 430px)
 * - Format output WebP q85 seragam
 * - Mode default: DRY-RUN (aman, tidak mengubah database dan tidak menimpa berkas asli)
 * - Mode aktif: sertakan argumen `--apply`
 */

import { supabase } from '../src/lib/supabaseClient';
import sharp from 'sharp';

interface MigrationReportItem {
  no: number;
  name: string;
  code: string;
  before: {
    dimensions: string;
    sizeKB: string;
    ratio: string;
    format: string;
    url: string;
  };
  after: {
    dimensions: string;
    sizeKB: string;
    ratio: string;
    format: string;
    url?: string;
  };
  status: 'SUCCESS' | 'SKIPPED' | 'WARNING' | 'ERROR';
  note?: string;
}

async function runLogoMigration() {
  const isApply = process.argv.includes('--apply');
  console.log(`\n======================================================`);
  console.log(`🚀 STANDARISASI LOGO INSTANSI MPP SIMPURUSIANG`);
  console.log(`Mode: ${isApply ? '🔴 LIVE APPLY (Tulis ke Storage)' : '🟢 DRY-RUN (Simulasi Aman - Tanpa Mengubah Berkas/DB)'}`);
  console.log(`======================================================\n`);

  const { data: tenants, error } = await supabase.from('mpp_tenants').select('*').order('name');
  if (error || !tenants) {
    console.error('Gagal mengambil data mpp_tenants:', error?.message);
    process.exit(1);
  }

  const reports: MigrationReportItem[] = [];

  for (let i = 0; i < tenants.length; i++) {
    const t = tenants[i];
    const report: MigrationReportItem = {
      no: i + 1,
      name: t.name,
      code: t.code || `TENANT-${i + 1}`,
      before: {
        dimensions: '0x0',
        sizeKB: '0',
        ratio: '0',
        format: 'N/A',
        url: t.logo || '',
      },
      after: {
        dimensions: '512x512',
        sizeKB: '0',
        ratio: '1.00',
        format: 'webp',
      },
      status: 'SUCCESS',
    };

    try {
      let buffer: Buffer | null = null;
      let originalFormat = 'png';

      if (t.logo && (t.logo.startsWith('http://') || t.logo.startsWith('https://'))) {
        const res = await fetch(t.logo);
        if (res.ok) {
          buffer = Buffer.from(await res.arrayBuffer());
        } else {
          report.status = 'WARNING';
          report.note = `HTTP ${res.status}: Gagal mengunduh URL logo`;
        }
      } else {
        report.status = 'WARNING';
        report.note = `Logo lokal/tidak valid: ${t.logo}`;
      }

      if (buffer) {
        const meta = await sharp(buffer).metadata();
        originalFormat = meta.format || 'png';
        report.before.dimensions = `${meta.width || 0}x${meta.height || 0}`;
        report.before.sizeKB = (buffer.length / 1024).toFixed(1);
        report.before.ratio = meta.width && meta.height ? (meta.width / meta.height).toFixed(2) : '1.00';
        report.before.format = originalFormat;

        // Pipeline Standarisasi Sharp:
        // 1. Trim margin transparan / putih
        let trimmed: Buffer;
        try {
          trimmed = await sharp(buffer).trim({ threshold: 12 }).toBuffer();
        } catch (e) {
          trimmed = buffer;
        }

        // 2. Skalakan logo ke dalam kotak 430x430 (margin 8% dari 512px)
        const innerLogo = await sharp(trimmed)
          .resize(430, 430, { fit: 'inside', background: { r: 255, g: 255, b: 255, alpha: 0 } })
          .toBuffer();

        // 3. Gabungkan di atas kanvas 512x512 transparan di tengah
        const processedWebP = await sharp({
          create: {
            width: 512,
            height: 512,
            channels: 4,
            background: { r: 255, g: 255, b: 255, alpha: 0 },
          },
        })
          .composite([{ input: innerLogo, gravity: 'center' }])
          .webp({ quality: 85 })
          .toBuffer();

        report.after.sizeKB = (processedWebP.length / 1024).toFixed(1);

        if (isApply) {
          const newFilename = `tenants/512_std_${t.code?.toLowerCase() || i + 1}_${Date.now()}.webp`;
          const uploadRes = await supabase.storage.from('mpp-images').upload(newFilename, processedWebP, {
            contentType: 'image/webp',
            upsert: true,
          });

          if (!uploadRes.error) {
            const { data: pUrl } = supabase.storage.from('mpp-images').getPublicUrl(newFilename);
            report.after.url = pUrl.publicUrl;
            // Catatan: tidak menimpa database bila instruksi meminta jangan ubah data
          }
        }
      }
    } catch (err: any) {
      report.status = 'ERROR';
      report.note = err.message;
    }

    reports.push(report);
  }

  // Tampilkan tabel hasil
  console.log(`\n📋 TABEL HASIL STANDARISASI LOGO 20 INSTANSI (SEBELUM vs SESUDAH):\n`);
  console.table(
    reports.map((r) => ({
      No: r.no,
      Instansi: r.name,
      'Dimensi Asli': r.before.dimensions,
      'Ukuran Asli': `${r.before.sizeKB} KB`,
      'Rasio Asli': r.before.ratio,
      'Dimensi Baru': r.after.dimensions,
      'Ukuran WebP': `${r.after.sizeKB} KB`,
      'Rasio Baru': r.after.ratio,
      Status: r.status,
      Catatan: r.note || 'Siap Migrasi 512px WebP q85',
    }))
  );

  console.log(`\n✅ Selesai: ${reports.length} logo instansi telah diaudit dan disimulasikan sesuai standar kanvas 512px WebP q85.\n`);
}

runLogoMigration();
