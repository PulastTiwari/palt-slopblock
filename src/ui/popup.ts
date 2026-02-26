import { getSettings, updateSettings } from '../shared/storage';

const enabledToggle = document.getElementById('enabledToggle') as HTMLButtonElement;
const enabledState = document.getElementById('enabledState') as HTMLSpanElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const modeSlider = document.getElementById('modeSlider') as HTMLInputElement;
const modeDisplay = document.getElementById('modeDisplay') as HTMLDivElement;
const ticks = Array.from(document.querySelectorAll<HTMLDivElement>('.tick'));

type FilterMode = 'very-strict' | 'strict' | 'balanced' | 'relaxed' | 'very-relaxed';

const MODE_ORDER: FilterMode[] = ['very-strict', 'strict', 'balanced', 'relaxed', 'very-relaxed'];

const MODE_THRESHOLD: Record<FilterMode, number> = {
  'very-strict': 7,
  strict: 8,
  balanced: 10,
  relaxed: 11.5,
  'very-relaxed': 13
};

const MODE_LABEL: Record<FilterMode, string> = {
  'very-strict': 'Very strict',
  strict: 'Strict',
  balanced: 'Balanced',
  relaxed: 'Relaxed',
  'very-relaxed': 'Very relaxed'
};

let selectedMode: FilterMode = 'balanced';
let isEnabled = true;

function closestMode(threshold: number): FilterMode {
  const entries = Object.entries(MODE_THRESHOLD) as [FilterMode, number][];
  let best = entries[0][0];
  let distance = Math.abs(entries[0][1] - threshold);
  for (const [mode, value] of entries.slice(1)) {
    const nextDistance = Math.abs(value - threshold);
    if (nextDistance < distance) {
      best = mode;
      distance = nextDistance;
    }
  }
  return best;
}

function updateSliderVisuals(index: number): void {
  const pct = (index / 4) * 100;
  modeSlider.style.setProperty('--fill-pct', `${pct}%`);
  ticks.forEach((tick, i) => {
    tick.classList.toggle('active', i <= index);
  });
}

function setActiveMode(mode: FilterMode): void {
  selectedMode = mode;
  const index = MODE_ORDER.indexOf(mode);
  modeSlider.value = String(index);
  modeDisplay.textContent = MODE_LABEL[mode];
  updateSliderVisuals(index);
}

function setEnabled(enabled: boolean): void {
  isEnabled = enabled;
  enabledToggle.dataset.enabled = enabled ? '1' : '0';
  enabledToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
  enabledState.textContent = enabled ? 'On' : 'Off';
}

async function persist(): Promise<void> {
  await updateSettings({
    threshold: MODE_THRESHOLD[selectedMode],
    enabled: isEnabled
  });
  statusText.textContent = 'Saved';
  setTimeout(() => {
    statusText.textContent = '';
  }, 900);
}

enabledToggle.addEventListener('click', () => {
  setEnabled(!isEnabled);
  void persist();
});

modeSlider.addEventListener('input', () => {
  const index = Number(modeSlider.value);
  const mode = MODE_ORDER[index];
  setActiveMode(mode);
  void persist();
});

async function init(): Promise<void> {
  const settings = await getSettings();
  setActiveMode(closestMode(settings.threshold));
  setEnabled(settings.enabled);
}

void init();
