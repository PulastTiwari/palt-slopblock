import { collapsePost, type CollapseHandle } from './domHelpers';
import { extractPost, findFeedRoot, findPostElements } from './extractors';
import { scorePost } from './scorer';
import { getSettings, updateSettings } from '../shared/storage';
import type { ExtensionSettings } from '../shared/types';

const isDev = false;
const ACTION_LOG_LIMIT = 100;
const MUTATION_DEBOUNCE_MS = 140;

let settings: ExtensionSettings;
let settingsVersion = 0;
let settingsFingerprint = '';
const seenByVersion = new WeakMap<HTMLElement, number>();
const collapsedByPostId = new Map<string, CollapseHandle>();
const evaluatedSignatureByPostId = new Map<string, string>();
const manuallyShownPostIds = new Set<string>();
const pendingScanRoots = new Set<ParentNode>();
let mutationDebounceTimer: number | null = null;
let idleFlushScheduled = false;

type SlopblockStats = {
  enabled: boolean;
  scanned: number;
  collapsed: number;
  lastPostId: string | null;
  lastScore: number;
  lastFlags: string[];
};

const flagReasonLabel: Partial<Record<keyof ExtensionSettings['filters'], string>> = {
  emojiDensity: 'emoji density',
  emojiBullets: 'emoji/bullet lines',
  inlinePhrase: 'inline phrases',
  ctaEnding: 'cta ending',
  excessLineBreaks: 'line breaks',
  emDashOveruse: 'em-dash',
  hashtagOveruse: 'hashtags',
  shortLineStacking: 'short-line stacking',
  technicalTokens: 'technical tokens',
  longParagraph: 'long paragraph',
  noCtaNoStacking: 'no-cta/no-stack'
};

declare global {
  interface Window {
    __slopblockStats?: SlopblockStats;
  }
}

const runtimeStats: SlopblockStats = {
  enabled: true,
  scanned: 0,
  collapsed: 0,
  lastPostId: null,
  lastScore: 0,
  lastFlags: []
};

function devLog(scope: string, payload: Record<string, unknown>): void {
  if (!isDev) {
    return;
  }
  console.warn(`[slopblock:${scope}]`, payload);
}

function syncRuntimeStats(): void {
  runtimeStats.enabled = settings.enabled;
  if (isDev) {
    window.__slopblockStats = { ...runtimeStats };
  }
}

function hashText(text: string): string {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) | 0;
  }
  return String(hash);
}

function refreshSettingsFingerprint(): void {
  settingsFingerprint = JSON.stringify({
    enabled: settings.enabled,
    threshold: settings.threshold,
    weights: settings.weights,
    filters: settings.filters,
    phraseList: settings.phraseList,
    regexList: settings.regexList,
    whitelistAuthors: settings.whitelistAuthors
  });
}

function hasRescoreImpact(previous: ExtensionSettings, next: ExtensionSettings): boolean {
  return JSON.stringify({
    enabled: previous.enabled,
    threshold: previous.threshold,
    weights: previous.weights,
    filters: previous.filters,
    phraseList: previous.phraseList,
    regexList: previous.regexList,
    whitelistAuthors: previous.whitelistAuthors
  }) !==
    JSON.stringify({
      enabled: next.enabled,
      threshold: next.threshold,
      weights: next.weights,
      filters: next.filters,
      phraseList: next.phraseList,
      regexList: next.regexList,
      whitelistAuthors: next.whitelistAuthors
    });
}

function postSignature(postId: string, rawText: string): string {
  return `${settingsVersion}:${postId}:${hashText(rawText)}:${hashText(settingsFingerprint)}`;
}

function runIdle(task: () => void): void {
  const idleScheduler = (window as { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
  if (typeof idleScheduler === 'function') {
    idleScheduler(task);
    return;
  }
  window.setTimeout(task, 0);
}

function restoreAllCollapsedPosts(): void {
  const postIds = Array.from(collapsedByPostId.keys());
  for (const postId of postIds) {
    collapsedByPostId.get(postId)?.restore();
    collapsedByPostId.delete(postId);
  }
  syncBadgeCount();
}

function syncBadgeCount(): void {
  try {
    chrome.runtime.sendMessage({
      type: 'SLOPBLOCK_BADGE_COUNT',
      count: collapsedByPostId.size
    });
  } catch {
    return;
  }
}

async function recordAction(message: string): Promise<void> {
  const now = new Date().toISOString();
  const nextLog = [`${now} ${message}`, ...settings.lastActions].slice(0, ACTION_LOG_LIMIT);
  settings = await updateSettings({ lastActions: nextLog });
}

const intersectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) {
        continue;
      }
      const postEl = entry.target as HTMLElement;
      intersectionObserver.unobserve(postEl);
      void evaluatePost(postEl);
    }
  },
  { rootMargin: '200px 0px' }
);

async function evaluatePost(postEl: HTMLElement): Promise<void> {
  const { postId, rawText, authorKey } = extractPost(postEl);
  runtimeStats.scanned += 1;
  runtimeStats.lastPostId = postId;
  devLog('extract', {
    postId,
    authorKey,
    textLength: rawText.length
  });

  if (!rawText || rawText.length < 20) {
    return;
  }

  // User explicitly chose to see this post — never re-collapse it this session
  if (manuallyShownPostIds.has(postId)) {
    return;
  }

  if (!settings.enabled) {
    if (collapsedByPostId.has(postId)) {
      collapsedByPostId.get(postId)?.restore();
      collapsedByPostId.delete(postId);
      syncBadgeCount();
    }
    return;
  }

  const signature = postSignature(postId, rawText);
  if (evaluatedSignatureByPostId.get(postId) === signature) {
    return;
  }
  evaluatedSignatureByPostId.set(postId, signature);

  if (authorKey && settings.whitelistAuthors.includes(authorKey)) {
    if (collapsedByPostId.has(postId)) {
      collapsedByPostId.get(postId)?.restore();
      collapsedByPostId.delete(postId);
      syncBadgeCount();
    }
    return;
  }

  const result = scorePost(rawText, settings);
  runtimeStats.lastScore = result.score;
  runtimeStats.lastFlags = [...result.flags];
  syncRuntimeStats();
  devLog('score', {
    postId,
    score: result.score,
    threshold: settings.threshold,
    flags: result.flags,
    action: result.action
  });

  if (result.action !== 'collapse') {
    if (collapsedByPostId.has(postId)) {
      collapsedByPostId.get(postId)?.restore();
      collapsedByPostId.delete(postId);
      syncBadgeCount();
      void recordAction(`auto-restore post=${postId}`);
    }
    return;
  }

  if (collapsedByPostId.has(postId)) {
    return;
  }

  const reasonLabels = result.flags.map((flag) => flagReasonLabel[flag] ?? flag);
  const reason = reasonLabels.join(', ') || 'threshold';
  const collapseSummary = `collapse post=${postId} score=${result.score} flags=${reason}`;
  runtimeStats.collapsed += 1;
  syncRuntimeStats();
  const handle = collapsePost(postEl, reasonLabels, {
    onShow: () => {
      manuallyShownPostIds.add(postId);
      handle.restore();
      collapsedByPostId.delete(postId);
      syncBadgeCount();
      void recordAction(`show post=${postId}`);
    }
  });

  collapsedByPostId.set(postId, handle);
  syncBadgeCount();
  void recordAction(collapseSummary);
}

function queuePost(postEl: HTMLElement, force = false): void {
  const seenVersion = seenByVersion.get(postEl);
  if (!force && seenVersion === settingsVersion) {
    return;
  }
  seenByVersion.set(postEl, settingsVersion);
  intersectionObserver.observe(postEl);
}

function scanNode(root: ParentNode = document, force = false): void {
  for (const post of findPostElements(root)) {
    queuePost(post, force);
  }
}

function flushPendingScans(force = false): void {
  const roots = Array.from(pendingScanRoots);
  pendingScanRoots.clear();
  idleFlushScheduled = false;

  if (roots.length === 0) {
    return;
  }

  runIdle(() => {
    for (const root of roots) {
      scanNode(root, force);
    }
  });
}

function scheduleScan(root: ParentNode = document, force = false): void {
  pendingScanRoots.add(root);

  if (force) {
    flushPendingScans(true);
    return;
  }

  if (idleFlushScheduled) {
    return;
  }
  idleFlushScheduled = true;
  runIdle(() => flushPendingScans(false));
}

function watchFeedMutations(): void {
  const feedRoot = findFeedRoot(document) ?? document.body;

  const observer = new MutationObserver((mutations) => {
    if (mutationDebounceTimer) {
      window.clearTimeout(mutationDebounceTimer);
    }
    mutationDebounceTimer = window.setTimeout(() => {
      let foundRelevantNode = false;
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.dataset.slopblockBanner === '1' || node.dataset.slopblockCollapsed === '1') {
              return;
            }
            if (node.closest('[data-slopblock-banner="1"]')) {
              return;
            }
            pendingScanRoots.add(node);
            foundRelevantNode = true;
          }
        });
      }

      if (!foundRelevantNode) {
        return;
      }
      scheduleScan(feedRoot, false);
    }, MUTATION_DEBOUNCE_MS);
  });

  observer.observe(feedRoot, { childList: true, subtree: true });
}

async function bootstrap(): Promise<void> {
  if (!location.pathname.startsWith('/feed')) {
    return;
  }
  settings = await getSettings();
  refreshSettingsFingerprint();
  syncRuntimeStats();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.settings?.newValue) {
      const previousSettings = settings;
      const nextSettings = {
        ...settings,
        ...changes.settings.newValue
      } as ExtensionSettings;

      settings = nextSettings;
      const shouldRescan = hasRescoreImpact(previousSettings, nextSettings);
      if (!shouldRescan) {
        syncRuntimeStats();
        return;
      }
      settingsVersion += 1;
      refreshSettingsFingerprint();
      if (!settings.enabled) {
        restoreAllCollapsedPosts();
      }
      scheduleScan(findFeedRoot(document) ?? document, true);
    }
  });

  scheduleScan(findFeedRoot(document) ?? document, true);
  watchFeedMutations();
}

void bootstrap();
