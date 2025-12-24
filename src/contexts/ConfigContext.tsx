"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchAppConfig, AppConfig } from '@/lib/configService';
import { setRuntimeConfig } from '@/config/app-config';

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedConfig = await fetchAppConfig(forceRefresh);
      setConfig(fetchedConfig);
      
      // Update the runtime config so direct imports from app-config.ts work
      setRuntimeConfig(fetchedConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      console.error('Failed to load app config from S3:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
    
    // Refresh config when window gains focus (user returns to tab)
    const handleFocus = () => {
      loadConfig(true);
    };
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refresh: loadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

