import { defaultSettings } from './defaults';
import type { ExtensionSettings, StoredData } from './types';

const SETTINGS_KEY = 'settings';

export async function getSettings(): Promise<ExtensionSettings> {
  const data = (await chrome.storage.local.get(SETTINGS_KEY)) as Partial<StoredData>;
  if (!data.settings) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: defaultSettings });
    return defaultSettings;
  }
  return {
    ...defaultSettings,
    ...data.settings,
    enabled: data.settings.enabled ?? defaultSettings.enabled,
    weights: {
      ...defaultSettings.weights,
      ...(data.settings.weights ?? {})
    },
    filters: {
      ...defaultSettings.filters,
      ...(data.settings.filters ?? {})
    },
    phraseList: data.settings.phraseList ?? defaultSettings.phraseList,
    regexList: data.settings.regexList ?? defaultSettings.regexList,
    whitelistAuthors: data.settings.whitelistAuthors ?? defaultSettings.whitelistAuthors,
    lastActions: data.settings.lastActions ?? defaultSettings.lastActions
  };
}

export async function setSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function updateSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await getSettings();
  const next: ExtensionSettings = {
    ...current,
    ...patch,
    weights: {
      ...current.weights,
      ...(patch.weights ?? {})
    },
    filters: {
      ...current.filters,
      ...(patch.filters ?? {})
    }
  };
  await setSettings(next);
  return next;
}
