import React, { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { DataContext } from '../contexts/DataContext';
import { District, Village, Investment, GeoJSONLayer } from '../types';
import { supabase, safeFetchLayerData, safeFetchInvestments } from '../lib/supabaseClient';
import { normalizeName, normalizeDistrictName } from '../utils/geoUtils';
import { centroid } from '@turf/turf';

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const [districts, setDistricts] = useState<District[]>([]);
  const [villages, setVillages] = useState<Village[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [spatialLayers, setSpatialLayers] = useState<Record<string, GeoJSONLayer>>({});
  const [rtrwZoning, setRtrwZoning] = useState<any[]>([]);
  const [incentivePolicies, setIncentivePolicies] = useState<any[]>([]);
  const [supplyChainMatrix, setSupplyChainMatrix] = useState<any>(null);
  const [executiveMetrics, setExecutiveMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSpatialLiveSyncEnabled, setIsSpatialLiveSyncEnabled] = useState<boolean>(true);
  const [liveSyncStatus, setLiveSyncStatus] = useState<"connecting" | "connected" | "error" | "off">("connected");
  const [loiCount, setLoiCount] = useState<number>(0);

  const fetchAllData = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    try {
      // 1. Fetch municipal core datasets from Supabase directly
      const [distRes, vilRes, invRes, gisPotensiRes, gisInfrastrukturRes] = await Promise.all([
        safeFetchLayerData('gis_kecamatan')
          .then((data: any) => {
            if (data) {
              const features = Array.isArray(data) ? data : (data.features || []);
              return features.map((f: any, idx: number) => {
                const p = f.properties || {};
                const rawKec = p.kecamatan || p.KECAMATAN || p.name || p.WADMKC || `Kecamatan ${idx + 1}`;
                const kName = String(rawKec).replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
                const kId = String(p.id !== undefined && p.id !== null ? p.id : (p.districtId || `dist_${normalizeDistrictName(kName).replace(/\s+/g, "_")}`));
                return {
                  ...p,
                  id: kId,
                  name: kName,
                  rawName: rawKec,
                  polygon: f.geometry,
                  geojson: f,
                  coordinates: (() => {
                    try {
                      const cent = centroid(f);
                      if (cent && cent.geometry && cent.geometry.coordinates) {
                        return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                      }
                    } catch (e) {}
                    return [0, 0];
                  })()
                };
              });
            }
            return [];
          })
          .catch(() => []),

        safeFetchLayerData('gis_desa')
          .then((data: any) => {
            if (data) {
              const features = Array.isArray(data) ? data : (data.features || []);
              return features.map((f: any, idx: number) => {
                const p = f.properties || {};
                const vName = String(p.nama_desa || p.Nama_Desa || p.Name || p.DESA || p.desa || p.WADMKD || p.NAMOBJ || `Desa ${idx + 1}`).trim();
                const rawKec = String(p.kecamatan || p.KECAMATAN || p.WADMKC || '').trim();
                const cleanKec = rawKec.replace(/kec\.\s*/i, "").replace(/kecamatan\s*/i, "").trim();
                const rawDistId = String(p.id_kecamatan !== undefined && p.id_kecamatan !== null ? p.id_kecamatan : (p.districtId || p.district_id || (cleanKec ? `dist_${normalizeDistrictName(cleanKec).replace(/\s+/g, "_")}` : "")));
                const vId = String(p.id || p.ID_DESA || f.id || p.KodeBPS || (vName ? `vil_${vName.toLowerCase().replace(/[^a-z0-9]+/g, '_')}` : `vil_${idx + 1}`));
                return {
                  ...p,
                  id: vId,
                  districtId: rawDistId,
                  district_id: rawDistId,
                  id_kecamatan: rawDistId,
                  districtName: cleanKec || rawKec,
                  name: vName,
                  polygon: f.geometry,
                  geojson: f,
                  coordinates: (() => {
                    try {
                      const cent = centroid(f);
                      if (cent && cent.geometry && cent.geometry.coordinates) {
                        return [cent.geometry.coordinates[1], cent.geometry.coordinates[0]];
                      }
                    } catch (e) {}
                    return [0, 0];
                  })()
                };
              });
            }
            return [];
          })
          .catch(() => []),

        safeFetchInvestments(),

        safeFetchLayerData('gis_potensi_investasi')
          .catch(() => null),

        safeFetchLayerData('gis_infrastruktur')
          .catch(() => null)
      ]);

      if (distRes && distRes.length > 0) setDistricts(distRes);
      if (vilRes && vilRes.length > 0) setVillages(vilRes);
      if (invRes && invRes.length > 0) setInvestments(invRes);

      const layersMap: Record<string, GeoJSONLayer> = {};
      if (gisPotensiRes) {
        layersMap['layer_potensi'] = {
          id: 'layer_potensi',
          name: 'Potensi Investasi',
          category: 'Pola Ruang',
          color: '#10b981',
          lineWidth: 2,
          type: 'Polygon',
          geojson: gisPotensiRes,
          isActive: true,
          opacity: 0.8
        };
      }
      if (gisInfrastrukturRes) {
        layersMap['layer_infrastruktur'] = {
          id: 'layer_infrastruktur',
          name: 'Infrastruktur Strategis',
          category: 'Infrastruktur & Jalan',
          color: '#3b82f6',
          lineWidth: 2,
          type: 'Point',
          geojson: gisInfrastrukturRes,
          isActive: true,
          opacity: 0.9
        };
      }
      setSpatialLayers(layersMap);

      // Fetch LOI count safely without throwing
      try {
        const { count, error } = await supabase.from('investment_interests').select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          setLoiCount(count);
        } else {
          // Fallback to proxy endpoint
          const res = await fetch('/api/investment-interests');
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) setLoiCount(data.length);
          }
        }
      } catch (e) {}

    } catch (err) {
      console.warn('[DataProvider] Honest fallback on data fetch:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <DataContext.Provider
      value={{
        investments,
        setInvestments,
        districts,
        setDistricts,
        villages,
        setVillages,
        spatialLayers,
        setSpatialLayers,
        rtrwZoning,
        setRtrwZoning,
        incentivePolicies,
        setIncentivePolicies,
        supplyChainMatrix,
        setSupplyChainMatrix,
        executiveMetrics,
        setExecutiveMetrics,
        refreshData: fetchAllData,
        isLoading,
        isSpatialLiveSyncEnabled,
        setIsSpatialLiveSyncEnabled,
        liveSyncStatus,
        loiCount,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
