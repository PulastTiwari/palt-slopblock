import { defaultSettings } from '../src/shared/defaults';
import { scorePost } from '../src/content/scorer';

describe('scorePost edge cases', () => {
  it('does not trigger excessLineBreaks when word count is >= 180', () => {
    const words = Array.from({ length: 210 }, (_, i) => `w${i}`).join(' ');
    const text = `${words}\n\n\n\n\n\n\n\n\n\n`;
    const result = scorePost(text, defaultSettings);
    expect(result.flags).not.toContain('excessLineBreaks');
  });

  it('triggers emDashOveruse when any em-dash exists', () => {
    const noDash = scorePost('a b c', defaultSettings);
    const oneDash = scorePost('a — b c', defaultSettings);
    expect(noDash.flags).not.toContain('emDashOveruse');
    expect(oneDash.flags).toContain('emDashOveruse');
  });

  it('triggers hashtagOveruse when hashtag count is high', () => {
    const low = scorePost(`#a #b #c #d ${Array.from({ length: 120 }, (_, i) => `w${i}`).join(' ')}`, defaultSettings);
    const high = scorePost('#a #b #c #d #e #f', defaultSettings);
    expect(low.flags).not.toContain('hashtagOveruse');
    expect(high.flags).toContain('hashtagOveruse');
  });

  it('triggers hashtagOveruse on high ratio even when absolute count is low', () => {
    const ratioHeavy = scorePost('#a #b #c #d quick update', defaultSettings);
    expect(ratioHeavy.flags).toContain('hashtagOveruse');
  });

  it('counts extended pictographic emoji for emojiDensity signal', () => {
    const text = '🚀 🚀 🚀 🚀 shipping update';
    const result = scorePost(text, defaultSettings);
    expect(result.features.emojiCount).toBeGreaterThanOrEqual(3);
    expect(result.flags).toContain('emojiDensity');
  });

  it('fails open for near-empty text', () => {
    const result = scorePost('   ', defaultSettings);
    expect(result.action).toBe('none');
    expect(result.score).toBe(0);
  });
});
