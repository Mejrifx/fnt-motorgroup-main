export type CheckState = 'pass' | 'fail' | null;

export type FuelLevel = 'empty' | 'quarter' | 'half' | 'three_quarter' | 'full';

export interface VehicleHealthCheck {
  fuel_level: FuelLevel | null;
  fuel_sufficient: CheckState;
  punctures: CheckState;
  exterior_clean: CheckState;
  interior_clean: CheckState;
  smell: CheckState;
  warning_lights: CheckState;
  starts_and_runs: CheckState;
  lights_working: CheckState;
  windscreen: CheckState;
  tyres: CheckState;
  notes: string;
  checked_at: string | null;
}

export const FUEL_LEVELS: { id: FuelLevel; label: string; caption: string }[] = [
  { id: 'empty', label: 'E', caption: 'Empty' },
  { id: 'quarter', label: '¼', caption: 'About a quarter' },
  { id: 'half', label: '½', caption: 'About half' },
  { id: 'three_quarter', label: '¾', caption: 'About three quarters' },
  { id: 'full', label: 'F', caption: 'Full' },
];

export const CHECK_FIELDS = [
  'fuel_sufficient',
  'punctures',
  'exterior_clean',
  'interior_clean',
  'smell',
  'warning_lights',
  'starts_and_runs',
  'lights_working',
  'windscreen',
  'tyres',
] as const;

export type CheckField = (typeof CHECK_FIELDS)[number];

export const emptyHealthCheck = (): VehicleHealthCheck => ({
  fuel_level: null,
  fuel_sufficient: null,
  punctures: null,
  exterior_clean: null,
  interior_clean: null,
  smell: null,
  warning_lights: null,
  starts_and_runs: null,
  lights_working: null,
  windscreen: null,
  tyres: null,
  notes: '',
  checked_at: null,
});

const FUEL_LEVEL_IDS = new Set<string>(FUEL_LEVELS.map(level => level.id));

export function normalizeHealthCheck(raw: unknown): VehicleHealthCheck {
  const next = emptyHealthCheck();
  if (!raw || typeof raw !== 'object') return next;

  const src = raw as Record<string, unknown>;
  if (typeof src.fuel_level === 'string' && FUEL_LEVEL_IDS.has(src.fuel_level)) {
    next.fuel_level = src.fuel_level as FuelLevel;
  }
  for (const key of CHECK_FIELDS) {
    const value = src[key];
    if (value === 'pass' || value === 'fail') next[key] = value;
  }
  if (typeof src.notes === 'string') next.notes = src.notes;
  if (typeof src.checked_at === 'string' && src.checked_at) next.checked_at = src.checked_at;
  return next;
}

export interface HealthSummary {
  answered: number;
  total: number;
  issues: number;
  status: 'empty' | 'partial' | 'issues' | 'clear';
  /** Compact line for the stock table and the launcher. */
  label: string;
}

const ISSUE_LABELS: Record<CheckField, string> = {
  fuel_sufficient: 'Low fuel',
  punctures: 'Punctures',
  exterior_clean: 'Exterior dirty',
  interior_clean: 'Interior dirty',
  smell: 'Smell',
  warning_lights: 'Warning lights',
  starts_and_runs: 'Won’t start',
  lights_working: 'Lights',
  windscreen: 'Windscreen',
  tyres: 'Tyres',
};

export function healthIssueLabels(check: VehicleHealthCheck): string[] {
  return CHECK_FIELDS.filter(key => check[key] === 'fail').map(key => ISSUE_LABELS[key]);
}

export function summarizeHealthCheck(raw: unknown): HealthSummary {
  const check = normalizeHealthCheck(raw);
  const checksAnswered = CHECK_FIELDS.filter(key => check[key] !== null).length;
  const answered = checksAnswered + (check.fuel_level ? 1 : 0);
  const total = CHECK_FIELDS.length + 1;
  const issues = CHECK_FIELDS.filter(key => check[key] === 'fail').length;

  let status: HealthSummary['status'] = 'empty';
  if (issues > 0) status = 'issues';
  else if (answered === 0 && !check.notes.trim()) status = 'empty';
  else if (answered >= total) status = 'clear';
  else status = 'partial';

  const label =
    status === 'empty'
      ? 'Fuel, punctures, clean, smell'
      : issues > 0
        ? `${issues} ${issues === 1 ? 'issue' : 'issues'}`
        : status === 'clear'
          ? 'All clear'
          : `${answered} of ${total} checked`;

  return { answered, total, issues, status, label };
}
