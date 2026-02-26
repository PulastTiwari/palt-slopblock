import type { ExtensionSettings } from './types';

export const defaultSettings: ExtensionSettings = {
  enabled: true,
  threshold: 10,
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
  phraseList: [
    "here's what i learned",
    '3 lessons',
    'let that sink in',
    'this is your sign',
    'stop scrolling'
  ],
  regexList: ['follow.*for', 'what do you think', '\\b(follow me|dm me|check my thread)\\b'],
  whitelistAuthors: [],
  lastActions: []
};
