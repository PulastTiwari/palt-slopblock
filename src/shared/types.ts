export type RuleKey =
  | 'emojiDensity'
  | 'emojiBullets'
  | 'inlinePhrase'
  | 'ctaEnding'
  | 'excessLineBreaks'
  | 'emDashOveruse'
  | 'hashtagOveruse'
  | 'shortLineStacking'
  | 'technicalTokens'
  | 'longParagraph'
  | 'noCtaNoStacking';

export interface RuleWeights {
  emojiDensity: number;
  emojiBullets: number;
  inlinePhrase: number;
  ctaEnding: number;
  excessLineBreaks: number;
  emDashOveruse: number;
  hashtagOveruse: number;
  shortLineStacking: number;
  technicalTokens: number;
  longParagraph: number;
  noCtaNoStacking: number;
}

export interface RuleFilters {
  emojiDensity: boolean;
  emojiBullets: boolean;
  inlinePhrase: boolean;
  ctaEnding: boolean;
  excessLineBreaks: boolean;
  emDashOveruse: boolean;
  hashtagOveruse: boolean;
  shortLineStacking: boolean;
  technicalTokens: boolean;
  longParagraph: boolean;
  noCtaNoStacking: boolean;
}

export interface ExtensionSettings {
  enabled: boolean;
  threshold: number;
  weights: RuleWeights;
  filters: RuleFilters;
  phraseList: string[];
  regexList: string[];
  whitelistAuthors: string[];
  lastActions: string[];
}

export interface StoredData {
  settings: ExtensionSettings;
}

export interface PostFeatures {
  emojiCount: number;
  wordCount: number;
  emojiRatio: number;
  lineBreakCount: number;
  emDashCount: number;
  hashtagCount: number;
  startsWithEmojiBullets: boolean;
  inlinePhraseMatches: string[];
  ctaEndingMatches: string[];
  maxShortLineStreak: number;
  hasShortLineStacking: boolean;
  hasTechnicalTokens: boolean;
  longestParagraphWords: number;
}

export interface ScoreResult {
  score: number;
  action: 'collapse' | 'none';
  flags: RuleKey[];
  features: PostFeatures;
}
