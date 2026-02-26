import { defaultSettings } from '../src/shared/defaults';
import { scorePost } from '../src/content/scorer';

describe('scorePost', () => {
  it('collapses curated engagement-style samples with default settings', () => {
    const curatedPositives = [
      `🚀 Stop scrolling\n\nShort.\nLine.\nStack.\nNow.\n\nWhat do you think?`,
      `✅ 3 lessons from my startup week\n\nShip faster\nNetwork daily\nBuild audience\nStay visible\n\nAgree?`,
      `🚀 🚀 🚀 This is your sign to stop waiting.\n\nShort.\nLine.\nStack.\nAgain.\n\nFollow for part 2?`
    ];

    for (const sample of curatedPositives) {
      const result = scorePost(sample, defaultSettings);
      expect(result.action).toBe('collapse');
      expect(result.score).toBeGreaterThanOrEqual(defaultSettings.threshold);
    }
  });

  it('keeps curated professional samples visible', () => {
    const curatedNegatives = [
      `I shipped a bug fix to reduce API timeout errors by 22% this week.\n\nRoot cause was a retry policy mismatch in SQL query retries; function handlers now back off correctly.`,
      `Quarterly hiring update: we closed 4 roles and improved interview turnaround time by 31%.`,
      `Team retrospective notes:\n- reduced flaky tests\n- added canary rollback\n- documented incident runbook`
    ];

    for (const sample of curatedNegatives) {
      const result = scorePost(sample, defaultSettings);
      expect(result.action).toBe('none');
      expect(result.score).toBeLessThan(defaultSettings.threshold);
    }
  });

  it('handles invalid regex patterns safely', () => {
    const settings = {
      ...defaultSettings,
      regexList: ['(unclosed']
    };
    const result = scorePost('simple post', settings);
    expect(result.action).toBe('none');
    expect(result.features.ctaEndingMatches).toEqual([]);
  });

  it('is deterministic for same input and settings', () => {
    const sample = `Stop scrolling\n\nHere's what I learned\n\nAgree?`;
    const first = scorePost(sample, defaultSettings);
    const second = scorePost(sample, defaultSettings);
    expect(second).toEqual(first);
  });

  it('respects filter toggles by suppressing disabled signal score', () => {
    const sample = `Shipping update\n\nFollow me for more`;
    const withCta = scorePost(sample, defaultSettings);
    const withoutCta = scorePost(sample, {
      ...defaultSettings,
      filters: {
        ...defaultSettings.filters,
        ctaEnding: false
      }
    });

    expect(withCta.features.ctaEndingMatches.length).toBeGreaterThan(0);
    expect(withoutCta.score).toBe(withCta.score - defaultSettings.weights.ctaEnding);
  });

  it('applies expected score contributions for line breaks and em-dash overuse', () => {
    const sample = `Line1\nLine2\nLine3\nLine4\nLine5\nLine6\nLine7\nLine8\nLine9\nLine10 —`;
    const settings = {
      ...defaultSettings,
      threshold: 99,
      phraseList: [],
      regexList: [],
      filters: {
        ...defaultSettings.filters,
        emojiDensity: false,
        emojiBullets: false,
        inlinePhrase: false,
        ctaEnding: false,
        hashtagOveruse: false,
        shortLineStacking: false,
        technicalTokens: false,
        longParagraph: false,
        noCtaNoStacking: false
      }
    };
    const result = scorePost(sample, settings);
    expect(result.flags).toContain('excessLineBreaks');
    expect(result.flags).toContain('emDashOveruse');
    expect(result.score).toBe(settings.weights.excessLineBreaks + settings.weights.emDashOveruse);
  });

  it('caps inline phrase contribution at 4 total', () => {
    const text = `here's what i learned. this is your sign. stop scrolling. 3 lessons\nshipping update`;
    const settings = {
      ...defaultSettings,
      threshold: 99,
      regexList: [],
      filters: {
        ...defaultSettings.filters,
        emojiDensity: false,
        emojiBullets: false,
        ctaEnding: false,
        excessLineBreaks: false,
        emDashOveruse: false,
        hashtagOveruse: false,
        shortLineStacking: false,
        technicalTokens: false,
        longParagraph: false,
        noCtaNoStacking: false
      }
    };

    const result = scorePost(text, settings);
    expect(result.flags).toContain('inlinePhrase');
    expect(result.score).toBe(4);
  });

  it('applies technical token negative signal', () => {
    const sample = `function run() { return apiClient.query('select * from jobs'); };`;
    const result = scorePost(sample, {
      ...defaultSettings,
      threshold: 99,
      phraseList: [],
      regexList: [],
      filters: {
        ...defaultSettings.filters,
        emojiDensity: false,
        emojiBullets: false,
        inlinePhrase: false,
        ctaEnding: false,
        excessLineBreaks: false,
        emDashOveruse: false,
        hashtagOveruse: false,
        shortLineStacking: false,
        longParagraph: false,
        noCtaNoStacking: false
      }
    });

    expect(result.flags).toContain('technicalTokens');
    expect(result.score).toBe(defaultSettings.weights.technicalTokens);
  });
});
