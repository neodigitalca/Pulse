import { useState, useCallback, useEffect } from "react";
import type { OptimizationSettings } from "@/components/integrations/wordpress/OptimizationSettingsPanel";
import { DEFAULT_SETTINGS } from "@/components/integrations/wordpress/OptimizationSettingsPanel";
import type { ArticleStyle } from "@/lib/content-generation/article-length-policy";
import { getArticleStyle, saveArticleStyle } from "@/lib/optimization-settings-storage";

const SETTINGS_STORAGE_KEY_PREFIX = "optimization_settings_";

export function useOptimizationSettings(siteId: string) {
  const [settings, setSettingsState] = useState<OptimizationSettings>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(`${SETTINGS_STORAGE_KEY_PREFIX}${siteId}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('[OptimizationSettings] Failed to parse stored settings:', e);
        }
      }
    }
    return DEFAULT_SETTINGS;
  });

  const setSettings = useCallback((newSettings: OptimizationSettings) => {
    setSettingsState(newSettings);
    if (typeof window !== "undefined") {
      localStorage.setItem(`${SETTINGS_STORAGE_KEY_PREFIX}${siteId}`, JSON.stringify(newSettings));
    }
  }, [siteId]);

  return [settings, setSettings] as const;
}

export function useArticleStyle(siteId: string) {
  const [style, setStyleState] = useState<ArticleStyle>(() => getArticleStyle(siteId));

  useEffect(() => {
    setStyleState(getArticleStyle(siteId));
  }, [siteId]);

  const setStyle = useCallback(
    (newStyle: ArticleStyle) => {
      setStyleState(newStyle);
      saveArticleStyle(siteId, newStyle);
    },
    [siteId],
  );

  return [style, setStyle] as const;
}

/** @deprecated Use useArticleStyle */
export function useOptimizationMode(siteId: string) {
  return useArticleStyle(siteId);
}

