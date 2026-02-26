const POST_SELECTORS = [
  'div.feed-shared-update-v2',
  'div.feed-shared-update-v2__update-content-wrapper',
  'article[data-urn]',
  'article[data-id*="activity"]',
  'div[data-id^="urn:li:activity"]',
  'div[data-urn*="activity"]',
  'div.occludable-update',
  'div.scaffold-finite-scroll__content > div[data-id]',
  'main [data-urn][role="article"]'
];

const FEED_ROOT_SELECTORS = [
  'main .scaffold-finite-scroll__content',
  'main .scaffold-layout__list-container',
  'div.scaffold-finite-scroll__content',
  'main[role="main"]',
  'main'
];

export interface ExtractedPost {
  postId: string;
  authorKey: string | null;
  rawText: string;
  element: HTMLElement;
}

function inferPostId(postEl: HTMLElement): string {
  const persistedId = postEl.dataset.slopblockPostId;
  if (persistedId) {
    return persistedId;
  }

  const dataUrn = postEl.getAttribute('data-urn') || postEl.getAttribute('data-id');
  if (dataUrn) {
    postEl.dataset.slopblockPostId = dataUrn;
    return dataUrn;
  }
  const candidate = postEl.querySelector<HTMLElement>('[data-urn], [data-id]');
  const candidateId = candidate?.getAttribute('data-urn') || candidate?.getAttribute('data-id');
  if (candidateId) {
    postEl.dataset.slopblockPostId = candidateId;
    return candidateId;
  }
  const fallbackId = `${Date.now()}-${Math.random()}`;
  postEl.dataset.slopblockPostId = fallbackId;
  return fallbackId;
}

function inferAuthorKey(postEl: HTMLElement): string | null {
  const anchor = postEl.querySelector<HTMLAnchorElement>('a[href*="/in/"]');
  if (!anchor?.href) {
    return null;
  }
  try {
    const url = new URL(anchor.href);
    return url.pathname.replace(/\/$/, '').toLowerCase();
  } catch {
    return anchor.href.toLowerCase();
  }
}

function extractPostText(postEl: HTMLElement): string {
  const textSources = [
    postEl.querySelector<HTMLElement>('.update-components-text'),
    postEl.querySelector<HTMLElement>('.feed-shared-inline-show-more-text'),
    postEl.querySelector<HTMLElement>('.break-words'),
    postEl.querySelector<HTMLElement>('.feed-shared-update-v2__description-wrapper'),
    postEl
  ];
  for (const source of textSources) {
    if (!source) {
      continue;
    }
    const text = source.innerText?.trim();
    if (text) {
      return text;
    }
  }
  return '';
}

export function findPostElements(root: ParentNode = document): HTMLElement[] {
  const found = new Set<HTMLElement>();

  if (root instanceof HTMLElement) {
    for (const selector of POST_SELECTORS) {
      if (root.matches(selector)) {
        found.add(root);
      }
    }
  }

  for (const selector of POST_SELECTORS) {
    root.querySelectorAll<HTMLElement>(selector).forEach((el) => found.add(el));
  }

  root.querySelectorAll<HTMLElement>('[data-urn*="activity"], [data-id*="activity"]').forEach((el) => {
    if (el.innerText && el.innerText.length > 30) {
      found.add(el);
    }
  });

  return Array.from(found);
}

export function findFeedRoot(root: ParentNode = document): HTMLElement | null {
  for (const selector of FEED_ROOT_SELECTORS) {
    const match = root.querySelector<HTMLElement>(selector);
    if (match) {
      return match;
    }
  }
  return null;
}

export function extractPost(postEl: HTMLElement): ExtractedPost {
  return {
    postId: inferPostId(postEl),
    authorKey: inferAuthorKey(postEl),
    rawText: extractPostText(postEl),
    element: postEl
  };
}
