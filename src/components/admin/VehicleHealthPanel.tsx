import React from 'react';
import { ClipboardCheck, Fuel, X } from 'lucide-react';
import {
  emptyHealthCheck,
  FUEL_LEVELS,
  healthIssueLabels,
  summarizeHealthCheck,
  type CheckState,
  type FuelLevel,
  type VehicleHealthCheck,
} from '../../lib/vehicleHealthCheck';

interface CheckItem {
  key: keyof Pick<
    VehicleHealthCheck,
    | 'punctures'
    | 'exterior_clean'
    | 'interior_clean'
    | 'smell'
    | 'warning_lights'
    | 'starts_and_runs'
    | 'lights_working'
    | 'windscreen'
    | 'tyres'
    | 'fuel_sufficient'
  >;
  question: string;
  passLabel: string;
  failLabel: string;
}

const BODY_CHECKS: CheckItem[] = [
  { key: 'punctures', question: 'Any punctures?', passLabel: 'No', failLabel: 'Yes' },
  { key: 'exterior_clean', question: 'Is the exterior clean?', passLabel: 'Yes', failLabel: 'No' },
  { key: 'interior_clean', question: 'Is the interior clean?', passLabel: 'Yes', failLabel: 'No' },
  { key: 'smell', question: 'Does it smell?', passLabel: 'No', failLabel: 'Yes' },
  { key: 'windscreen', question: 'Any windscreen damage?', passLabel: 'No', failLabel: 'Yes' },
];

const RUNNING_CHECKS: CheckItem[] = [
  { key: 'starts_and_runs', question: 'Does it start and run?', passLabel: 'Yes', failLabel: 'No' },
  { key: 'warning_lights', question: 'Any warning lights?', passLabel: 'No', failLabel: 'Yes' },
  { key: 'lights_working', question: 'Are the lights working?', passLabel: 'Yes', failLabel: 'No' },
  { key: 'tyres', question: 'Are the tyres OK?', passLabel: 'Yes', failLabel: 'No' },
];

const FUEL_SUFFICIENT: CheckItem = {
  key: 'fuel_sufficient',
  question: 'Is the fuel sufficient?',
  passLabel: 'Yes',
  failLabel: 'No',
};

interface VehicleHealthPanelProps {
  vehicleName: string;
  registration: string | null | undefined;
  value: VehicleHealthCheck;
  onChange: (next: VehicleHealthCheck) => void;
  onClose: () => void;
}

const VehicleHealthPanel: React.FC<VehicleHealthPanelProps> = ({
  vehicleName,
  registration,
  value,
  onChange,
  onClose,
}) => {
  const summary = summarizeHealthCheck(value);
  const issues = healthIssueLabels(value);
  const fuelIndex = FUEL_LEVELS.findIndex(level => level.id === value.fuel_level);
  const fuelCaption = fuelIndex >= 0 ? FUEL_LEVELS[fuelIndex].caption : 'Tap how much is in the tank';

  const touch = (patch: Partial<VehicleHealthCheck>) => {
    onChange({
      ...value,
      ...patch,
      checked_at: new Date().toISOString(),
    });
  };

  const setCheck = (key: CheckItem['key'], next: CheckState) => {
    touch({ [key]: value[key] === next ? null : next } as Partial<VehicleHealthCheck>);
  };

  const setFuel = (level: FuelLevel) => {
    touch({ fuel_level: value.fuel_level === level ? null : level });
  };

  const barClass =
    summary.issues > 0
      ? 'bg-red-500'
      : summary.status === 'clear'
        ? 'bg-emerald-500'
        : 'bg-amber-400';

  return (
    <div className="flex h-full min-h-0 flex-col bg-gray-50 dark:bg-gray-900">
      <div className="shrink-0 border-b border-gray-200/80 dark:border-gray-700 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-gray-400">
              <ClipboardCheck className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wider">Health check</p>
            </div>
            <h2 className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-white">
              {vehicleName || 'This vehicle'}
            </h2>
            {registration && (
              <span className="mt-1 inline-block rounded bg-white px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-gray-800 dark:bg-gray-800 dark:text-gray-200">
                {registration}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close health check"
            className="rounded-xl p-2 text-gray-400 transition hover:bg-white hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs font-medium">
            <span className="text-gray-500 dark:text-gray-400">
              {summary.answered} of {summary.total} checked
            </span>
            <span
              className={
                summary.issues > 0
                  ? 'text-red-600 dark:text-red-400'
                  : summary.status === 'clear'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-gray-400'
              }
            >
              {summary.issues > 0
                ? `${summary.issues} ${summary.issues === 1 ? 'issue' : 'issues'}`
                : summary.status === 'clear'
                  ? 'All clear'
                  : 'Leave blank if you haven’t looked'}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barClass}`}
              style={{ width: `${Math.round((summary.answered / summary.total) * 100)}%` }}
            />
          </div>
          {issues.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {issues.map(issue => (
                <span
                  key={issue}
                  className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300"
                >
                  {issue}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        <section className="rounded-2xl border border-gray-200/80 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Fuel
            </h3>
            <Fuel className="h-4 w-4 text-gray-400" />
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-gray-900" role="group" aria-label="Fuel level">
            {FUEL_LEVELS.map((level, index) => {
              const filled = fuelIndex >= 0 && index <= fuelIndex;
              const tone =
                value.fuel_level === 'empty'
                  ? 'bg-red-500 text-white'
                  : value.fuel_level === 'quarter' || value.fuel_level === 'half'
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-500 text-white';
              return (
                <button
                  key={level.id}
                  type="button"
                  aria-pressed={value.fuel_level === level.id}
                  onClick={() => setFuel(level.id)}
                  className={`h-10 flex-1 rounded-lg text-xs font-bold transition ${
                    filled
                      ? tone
                      : 'text-gray-500 hover:bg-white dark:text-gray-400 dark:hover:bg-gray-800'
                  }`}
                >
                  {level.label}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">{fuelCaption}</p>
          <div className="mt-3 border-t border-gray-100 pt-1 dark:border-gray-700">
            <CheckRow
              item={FUEL_SUFFICIENT}
              value={value.fuel_sufficient}
              onChange={next => setCheck('fuel_sufficient', next)}
            />
          </div>
        </section>

        <CheckCard title="Body & interior" items={BODY_CHECKS} value={value} onChange={setCheck} />
        <CheckCard title="Running" items={RUNNING_CHECKS} value={value} onChange={setCheck} />

        <section>
          <label htmlFor="health-notes" className="field-label">
            Anything else
          </label>
          <textarea
            id="health-notes"
            className="field-input resize-none"
            rows={3}
            value={value.notes}
            onChange={event => touch({ notes: event.target.value })}
            placeholder="Odd noise, missing locking wheel nut, interior stains…"
          />
        </section>
      </div>

      <div className="shrink-0 border-t border-gray-200/80 bg-gray-50/80 px-5 py-4 dark:border-gray-700 dark:bg-gray-900">
        <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
          Saved when you press Save changes on the vehicle.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onChange(emptyHealthCheck())}
            className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-600 transition hover:bg-white dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl bg-fnt-black py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Back to vehicle
          </button>
        </div>
      </div>
    </div>
  );
};

const CheckCard: React.FC<{
  title: string;
  items: CheckItem[];
  value: VehicleHealthCheck;
  onChange: (key: CheckItem['key'], next: CheckState) => void;
}> = ({ title, items, value, onChange }) => (
  <section className="rounded-2xl border border-gray-200/80 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-800">
    <h3 className="pb-1 pt-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
      {title}
    </h3>
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {items.map(item => (
        <CheckRow
          key={item.key}
          item={item}
          value={value[item.key]}
          onChange={next => onChange(item.key, next)}
        />
      ))}
    </div>
  </section>
);

const CheckRow: React.FC<{
  item: CheckItem;
  value: CheckState;
  onChange: (next: CheckState) => void;
}> = ({ item, value, onChange }) => (
  <div className={`flex items-center justify-between gap-3 py-2.5 ${value === 'fail' ? '-mx-2 rounded-xl bg-red-50/80 px-2 dark:bg-red-950/30' : ''}`}>
    <p className="min-w-0 text-sm font-medium text-gray-800 dark:text-gray-100">{item.question}</p>
    <div className="flex shrink-0 rounded-xl border border-gray-200/80 bg-gray-50 p-0.5 dark:border-gray-600 dark:bg-gray-900" role="group" aria-label={item.question}>
      <Choice label={item.passLabel} active={value === 'pass'} tone="pass" onClick={() => onChange('pass')} />
      <Choice label={item.failLabel} active={value === 'fail'} tone="fail" onClick={() => onChange('fail')} />
    </div>
  </div>
);

const Choice: React.FC<{
  label: string;
  active: boolean;
  tone: 'pass' | 'fail';
  onClick: () => void;
}> = ({ label, active, tone, onClick }) => (
  <button
    type="button"
    aria-pressed={active}
    onClick={onClick}
    className={`min-w-[3.25rem] rounded-lg px-3 py-1.5 text-xs font-bold transition ${
      active
        ? tone === 'pass'
          ? 'bg-emerald-500 text-white shadow-sm'
          : 'bg-red-500 text-white shadow-sm'
        : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'
    }`}
  >
    {label}
  </button>
);

export default VehicleHealthPanel;
