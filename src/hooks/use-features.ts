'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface FeaturesState {
  features: Record<string, boolean>;
  limits: Record<string, number>;
  loaded: boolean;
}

let globalState: FeaturesState = { features: {}, limits: {}, loaded: false };
let loadPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

async function loadFeatures() {
  try {
    const res = await apiClient.get('/admin/features');
    const data = res.data as { features: Record<string, boolean>; limits: Record<string, number> };
    globalState = { features: data.features ?? {}, limits: data.limits ?? {}, loaded: true };
  } catch {
    globalState = { features: {}, limits: {}, loaded: true };
  }
  notify();
}

function ensureLoaded() {
  if (globalState.loaded) return;
  if (!loadPromise) loadPromise = loadFeatures();
}

/**
 * Hook to check whether a feature is enabled for the current tenant.
 *
 * Usage:
 *   const { enabled, loading } = useFeature('WHATSAPP_COMMUNICATION');
 *   if (!enabled) return <UpgradeBanner />;
 */
export function useFeature(featureKey: string): { enabled: boolean; loading: boolean } {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    ensureLoaded();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    enabled: globalState.features[featureKey] ?? false,
    loading: !globalState.loaded,
  };
}

/**
 * Hook to get all resolved features for the current tenant.
 */
export function useFeatures(): { features: Record<string, boolean>; limits: Record<string, number>; loading: boolean } {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    ensureLoaded();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    features: globalState.features,
    limits: globalState.limits,
    loading: !globalState.loaded,
  };
}

/**
 * Check a specific limit.
 */
export function useLimit(limitKey: string): { limit: number; loading: boolean } {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    ensureLoaded();
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  return {
    limit: globalState.limits[limitKey] ?? 0,
    loading: !globalState.loaded,
  };
}

/**
 * Force reload features (e.g. after plan change).
 */
export function useRefreshFeatures(): () => void {
  return useCallback(() => {
    globalState = { features: {}, limits: {}, loaded: false };
    loadPromise = null;
    ensureLoaded();
  }, []);
}
