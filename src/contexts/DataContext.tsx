import React, { createContext, useContext, ReactNode } from 'react';
import { Investment, District, Village, GeoJSONLayer } from '../types';

interface DataContextType {
  investments: Investment[];
  setInvestments: React.Dispatch<React.SetStateAction<Investment[]>>;
  spatialLayers: Record<string, GeoJSONLayer>;
  setSpatialLayers: React.Dispatch<React.SetStateAction<Record<string, GeoJSONLayer>>>;
  districts: District[];
  setDistricts: React.Dispatch<React.SetStateAction<District[]>>;
  villages: Village[];
  setVillages: React.Dispatch<React.SetStateAction<Village[]>>;
  rtrwZoning: any[];
  setRtrwZoning: React.Dispatch<React.SetStateAction<any[]>>;
  incentivePolicies: any[];
  setIncentivePolicies: React.Dispatch<React.SetStateAction<any[]>>;
  supplyChainMatrix: any;
  setSupplyChainMatrix: React.Dispatch<React.SetStateAction<any>>;
  executiveMetrics: any;
  setExecutiveMetrics: React.Dispatch<React.SetStateAction<any>>;
  refreshData: () => Promise<void>;
  isLoading: boolean;
  isSpatialLiveSyncEnabled?: boolean;
  setIsSpatialLiveSyncEnabled?: React.Dispatch<React.SetStateAction<boolean>>;
  liveSyncStatus?: "connecting" | "connected" | "error" | "off";
  loiCount: number;
}

export const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    return {
      investments: [],
      setInvestments: () => {},
      spatialLayers: {},
      setSpatialLayers: () => {},
      districts: [],
      setDistricts: () => {},
      villages: [],
      setVillages: () => {},
      rtrwZoning: [],
      setRtrwZoning: () => {},
      incentivePolicies: [],
      setIncentivePolicies: () => {},
      supplyChainMatrix: null,
      setSupplyChainMatrix: () => {},
      executiveMetrics: null,
      setExecutiveMetrics: () => {},
      refreshData: async () => {},
      isLoading: false,
      loiCount: 0,
    };
  }
  return context;
};
