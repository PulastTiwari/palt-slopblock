import { getSettings, updateSettings } from '../shared/storage';
import type { RuleFilters, RuleKey, RuleWeights } from '../shared/types';

const thresholdInput = document.getElementById('threshold') as HTMLInputElement;
const phraseInput = document.getElementById('phrases') as HTMLTextAreaElement;
const regexInput = document.getElementById('regex') as HTMLTextAreaElement;
const whitelistInput = document.getElementById('whitelist') as HTMLTextAreaElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const statusText = document.getElementById('status') as HTMLSpanElement;

const ruleKeys: RuleKey[] = [
  'emojiDensity',
  'emojiBullets',
  'inlinePhrase',
  'ctaEnding',
  'excessLineBreaks',
  'emDashOveruse',
  'hashtagOveruse',
  'shortLineStacking',
  'technicalTokens',
  'longParagraph',
  'noCtaNoStacking'
];

function getFilterInput(rule: RuleKey): HTMLInputElement {
  return document.getElementById(`filter-${rule}`) as HTMLInputElement;
}

function getWeightInput(rule: RuleKey): HTMLInputElement {
  return document.getElementById(`weight-${rule}`) as HTMLInputElement;
}

function linesToArray(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

saveBtn.addEventListener('click', async () => {
  const filters = ruleKeys.reduce((acc, rule) => {
    acc[rule] = getFilterInput(rule).checked;
    return acc;
  }, {} as RuleFilters);

  const weights = ruleKeys.reduce((acc, rule) => {
    acc[rule] = Number(getWeightInput(rule).value || '0');
    return acc;
  }, {} as RuleWeights);

  await updateSettings({
    threshold: Number(thresholdInput.value),
    filters,
    weights,
    phraseList: linesToArray(phraseInput.value),
    regexList: linesToArray(regexInput.value),
    whitelistAuthors: linesToArray(whitelistInput.value)
  });
  statusText.textContent = 'Saved and applied.';
  setTimeout(() => {
    statusText.textContent = '';
  }, 1200);
});

async function init(): Promise<void> {
  const settings = await getSettings();
  thresholdInput.value = String(settings.threshold);
  for (const rule of ruleKeys) {
    getFilterInput(rule).checked = settings.filters[rule];
    getWeightInput(rule).value = String(settings.weights[rule]);
  }
  phraseInput.value = settings.phraseList.join('\n');
  regexInput.value = settings.regexList.join('\n');
  whitelistInput.value = settings.whitelistAuthors.join('\n');
}

void init();
