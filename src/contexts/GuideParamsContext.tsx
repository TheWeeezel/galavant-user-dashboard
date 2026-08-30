import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGuideParams, type GuideParams } from '../api';

/**
 * Shown while the fetch is in flight, and kept if it never lands. These are the only params the
 * guide still reads: an energy ceiling with its refill clock, and the platform fee. The four
 * earning/decay/drop levers that used to be defaulted here went with the owner's 2026-08-30
 * decision — verbatim: "no gameplay metrics publishing which helps player perfect against the
 * algorithm." A default is a published number like any other: it ships inside the JavaScript
 * bundle, so it is readable without ever calling the API, which makes this file the one place
 * where deleting a value server-side would otherwise have achieved nothing at all.
 */
const DEFAULTS: GuideParams = {
  maxEnergyCap: 200,
  energyRegenPercent: 25,
  energyRegenIntervalHours: 6,
  fullRechargeHours: 24,
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
