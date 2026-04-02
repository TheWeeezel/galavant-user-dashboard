import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGuideParams, type GuideParams } from '../api';

const DEFAULTS: GuideParams = {
  maxEnergyCap: 200,
  energyRegenPercent: 25,
  energyRegenIntervalHours: 6,
  fullRechargeHours: 24,
  baseEarningRateCommon: 5,
  hpDecayPerMinute: 0.5,
  durabilityDecayPerMinute: 0.8,
  toolboxBaseDropChance: 0.02,
  platformTaxPercent: 5,
};

const GuideParamsContext = createContext<GuideParams>(DEFAULTS);

export function GuideParamsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery({
    queryKey: ['guide-params'],
    queryFn: fetchGuideParams,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  return (
    <GuideParamsContext.Provider value={data ?? DEFAULTS}>
      {children}
    </GuideParamsContext.Provider>
  );
}

export function useGuideParams(): GuideParams {
  return useContext(GuideParamsContext);
}
