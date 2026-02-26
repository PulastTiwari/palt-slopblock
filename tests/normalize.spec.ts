import { getLineBreakCount, getWordCount, normalizeText } from '../src/content/normalize';

describe('normalize', () => {
  it('strips urls and lowercases text', () => {
    const text = 'Check THIS https://example.com/path';
    expect(normalizeText(text)).toBe('check this');
  });

  it('counts words and line breaks', () => {
    const text = 'one two\nthree';
    expect(getWordCount(text)).toBe(3);
    expect(getLineBreakCount(text)).toBe(1);
  });
});
