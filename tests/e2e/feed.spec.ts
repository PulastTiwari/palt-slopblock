import { expect, test } from '@playwright/test';

async function applyAggressiveTestSettings(page: { evaluate: (fn: () => Promise<void>) => Promise<void> }) {
  await page.evaluate(async () => {
    const payload = {
      settings: {
        threshold: 2,
        weights: {
          emojiDensity: 2,
          emojiBullets: 2,
          inlinePhrase: 2,
          ctaEnding: 3,
          excessLineBreaks: 2,
          emDashOveruse: 1,
          hashtagOveruse: 2,
          shortLineStacking: 3,
          technicalTokens: -3,
          longParagraph: -2,
          noCtaNoStacking: -2
        },
        filters: {
          emojiDensity: true,
          emojiBullets: true,
          inlinePhrase: true,
          ctaEnding: true,
          excessLineBreaks: true,
          emDashOveruse: true,
          hashtagOveruse: true,
          shortLineStacking: true,
          technicalTokens: true,
          longParagraph: true,
          noCtaNoStacking: true
        },
        phraseList: ["here's what i learned", 'stop scrolling'],
        regexList: ['follow.*for', 'what do you think'],
        whitelistAuthors: [],
        lastActions: []
      }
    };
    await chrome.storage.local.set(payload);
  });
}

test('collapses engagement-style post and leaves regular post visible', async ({ page }) => {
  await page.goto('/feed/');
  await applyAggressiveTestSettings(page);

  await expect(page.locator('[data-slopblock-banner="1"]')).toHaveCount(1);
  await expect(page.locator('[data-urn="urn:li:activity:1"]')).toBeHidden();
  await expect(page.locator('[data-urn="urn:li:activity:2"]')).toBeVisible();
});


