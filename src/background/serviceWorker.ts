import { defaultSettings } from '../shared/defaults';

chrome.runtime.onInstalled.addListener(async () => {
  const result = await chrome.storage.local.get('settings');
  if (!result.settings) {
    await chrome.storage.local.set({ settings: defaultSettings });
  }
});

const tabBadgeCounts = new Map<number, number>();

function applyBadge(tabId: number, count: number): void {
  const text = count > 0 ? String(Math.min(count, 999)) : '';
  chrome.action.setBadgeText({ tabId, text });
  if (count > 0) {
    chrome.action.setBadgeBackgroundColor({ tabId, color: '#111111' });
    chrome.action.setBadgeTextColor({ tabId, color: '#ffffff' });
  }
}

function resetBadge(tabId: number): void {
  tabBadgeCounts.delete(tabId);
  chrome.action.setBadgeText({ tabId, text: '' });
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'SLOPBLOCK_BADGE_COUNT') {
    return;
  }
  const tabId = sender.tab?.id;
  if (typeof tabId !== 'number') {
    return;
  }
  const count = Number(message.count) || 0;
  tabBadgeCounts.set(tabId, count);
  applyBadge(tabId, count);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabBadgeCounts.delete(tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    resetBadge(tabId);
    return;
  }

  if (changeInfo.status === 'complete' && !tab.url?.startsWith('https://www.linkedin.com/feed')) {
    resetBadge(tabId);
  }
});
