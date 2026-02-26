export function normalizeText(rawText: string): string {
  return rawText
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function getWordCount(text: string): number {
  if (!text.trim()) {
    return 0;
  }
  return text.split(/\s+/).filter(Boolean).length;
}

export function getLineBreakCount(rawText: string): number {
  return (rawText.match(/\n/g) ?? []).length;
}
