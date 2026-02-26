import { getLineBreakCount, getWordCount, normalizeText } from './normalize';
import type { ExtensionSettings, RuleKey, ScoreResult } from '../shared/types';

const emojiRegex = /\p{Extended_Pictographic}/gu;
const lineEndingCtaRegex = /(?:\?|\!)\s*$|\b(share|comment|thoughts|agree|follow|dm|message me|what do you think)\s*\??\s*$/i;
const technicalTokenRegex = /\b(function|api|sql)\b|[{};]/i;
const INLINE_PHRASE_MAX_SCORE = 4;

function countEmoji(text: string): number {
  return (text.match(emojiRegex) ?? []).length;
}

function countEmDash(text: string): number {
  return (text.match(/—/g) ?? []).length;
}

function countHashtags(text: string): number {
  return (text.match(/(^|\s)#[\p{L}\p{N}_]+/gu) ?? []).length;
}

function startsWithEmojiOrBulletLine(text: string): boolean {
  const bulletOrEmojiPrefix =
    /^\s*([\u2022\u25CF\u25E6\u25AA\u25AB\u25C6\u25C7\u25B8\u25B9\u25BA\u25BB\u2B25\u2B26\u{1F538}\u{1F539}\u{1F53A}\u{1F53B}]|\p{Extended_Pictographic})/u;

  return text
    .split(/\n/)
    .slice(0, 14)
    .some((line) => bulletOrEmojiPrefix.test(line));
}

function findPhraseMatches(normalized: string, phraseList: string[]): string[] {
  return phraseList.filter((phrase) => phrase && normalized.includes(phrase.toLowerCase()));
}

function findRegexMatches(normalized: string, regexList: string[]): string[] {
  const matches: string[] = [];
  for (const pattern of regexList) {
    try {
      const rx = new RegExp(pattern, 'i');
      if (rx.test(normalized)) {
        matches.push(pattern);
      }
    } catch {
      continue;
    }
  }
  return matches;
}

function getLastNonEmptyLine(rawText: string): string {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return lines.at(-1) ?? '';
}

function getShortLineStats(rawText: string): { maxStreak: number; hasStacking: boolean } {
  const lines = rawText.split(/\r?\n/);
  let maxStreak = 0;
  let currentStreak = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentStreak = 0;
      continue;
    }

    const words = getWordCount(normalizeText(trimmed));
    if (words > 0 && words < 8) {
      currentStreak += 1;
      maxStreak = Math.max(maxStreak, currentStreak);
      continue;
    }

    currentStreak = 0;
  }

  return {
    maxStreak,
    hasStacking: maxStreak >= 4
  };
}

function getLongestParagraphWords(rawText: string): number {
  const paragraphs = rawText
    .split(/\n\s*\n/g)
    .map((entry) => entry.trim())
    .filter(Boolean);

  let maxWords = 0;
  for (const paragraph of paragraphs) {
    maxWords = Math.max(maxWords, getWordCount(normalizeText(paragraph)));
  }
  return maxWords;
}

export function scorePost(rawText: string, settings: ExtensionSettings): ScoreResult {
  const normalized = normalizeText(rawText);
  const wordCount = getWordCount(normalized);
  const emojiCount = countEmoji(rawText);
  const lineBreakCount = getLineBreakCount(rawText);
  const emDashCount = countEmDash(rawText);
  const hashtagCount = countHashtags(rawText);
  const emojiRatio = emojiCount / Math.max(wordCount, 1);
  const phraseMatches = findPhraseMatches(normalized, settings.phraseList);
  const lastLine = getLastNonEmptyLine(rawText);
  const lastLineNormalized = normalizeText(lastLine);
  const ctaPhraseMatches = findPhraseMatches(lastLineNormalized, settings.phraseList);
  const ctaRegexMatches = findRegexMatches(lastLineNormalized, settings.regexList);
  const endingByPunctuation = lineEndingCtaRegex.test(lastLine.trim());
  const ctaEndingMatches = [
    ...ctaPhraseMatches.map((value) => `phrase:${value}`),
    ...ctaRegexMatches.map((value) => `regex:${value}`),
    ...(endingByPunctuation ? ['ending:punctuationOrCta'] : [])
  ];

  const ctaMatchedPhrases = new Set(ctaPhraseMatches.map((phrase) => phrase.toLowerCase()));
  const inlinePhraseMatches = phraseMatches.filter((phrase) => !ctaMatchedPhrases.has(phrase.toLowerCase()));
  const emojiBullets = startsWithEmojiOrBulletLine(rawText);
  const { maxStreak: maxShortLineStreak, hasStacking: hasShortLineStacking } = getShortLineStats(rawText);
  const hashtagRatio = hashtagCount / Math.max(wordCount, 1);
  const hasTechnicalTokens = technicalTokenRegex.test(rawText);
  const longestParagraphWords = getLongestParagraphWords(rawText);

  const flags: RuleKey[] = [];
  let score = 0;

  if (settings.filters.emojiDensity && (emojiRatio > 0.05 || (emojiCount >= 3 && wordCount < 120))) {
    score += settings.weights.emojiDensity;
    flags.push('emojiDensity');
  }

  if (settings.filters.emojiBullets && emojiBullets) {
    score += settings.weights.emojiBullets;
    flags.push('emojiBullets');
  }

  if (settings.filters.inlinePhrase && inlinePhraseMatches.length > 0) {
    const inlinePhraseScore = Math.min(
      inlinePhraseMatches.length * settings.weights.inlinePhrase,
      INLINE_PHRASE_MAX_SCORE
    );
    score += inlinePhraseScore;
    flags.push('inlinePhrase');
  }

  if (settings.filters.ctaEnding && ctaEndingMatches.length > 0) {
    score += settings.weights.ctaEnding;
    flags.push('ctaEnding');
  }

  if (settings.filters.excessLineBreaks && wordCount < 180 && lineBreakCount >= 8) {
    score += settings.weights.excessLineBreaks;
    flags.push('excessLineBreaks');
  }

  if (settings.filters.emDashOveruse && emDashCount > 0) {
    score += settings.weights.emDashOveruse;
    flags.push('emDashOveruse');
  }

  if (settings.filters.hashtagOveruse && (hashtagRatio > 0.04 || hashtagCount >= 5)) {
    score += settings.weights.hashtagOveruse;
    flags.push('hashtagOveruse');
  }

  if (settings.filters.shortLineStacking && hasShortLineStacking) {
    score += settings.weights.shortLineStacking;
    flags.push('shortLineStacking');
  }

  if (settings.filters.technicalTokens && hasTechnicalTokens) {
    score += settings.weights.technicalTokens;
    flags.push('technicalTokens');
  }

  if (settings.filters.longParagraph && longestParagraphWords > 80) {
    score += settings.weights.longParagraph;
    flags.push('longParagraph');
  }

  if (
    settings.filters.noCtaNoStacking &&
    wordCount >= 20 &&
    wordCount < 180 &&
    ctaEndingMatches.length === 0 &&
    !hasShortLineStacking
  ) {
    score += settings.weights.noCtaNoStacking;
    flags.push('noCtaNoStacking');
  }

  return {
    score,
    action: score >= settings.threshold ? 'collapse' : 'none',
    flags,
    features: {
      emojiCount,
      wordCount,
      emojiRatio,
      lineBreakCount,
      emDashCount,
      hashtagCount,
      startsWithEmojiBullets: emojiBullets,
      inlinePhraseMatches,
      ctaEndingMatches,
      maxShortLineStreak,
      hasShortLineStacking,
      hasTechnicalTokens,
      longestParagraphWords
    }
  };
}
