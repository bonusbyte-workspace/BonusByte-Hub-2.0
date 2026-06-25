import { useState, useEffect } from 'react';
import type { DevMetrics } from '@/models/types';

function MetricCard({ label, value, unit, accent }: { label: string; value: string | number; unit?: string; accent?: string }) {
  return (
    <div className="admin-metric-card">
      <p className="text-steel-400 text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="font-black text-xl leading-none" style={{ color: accent ?? '#E8E8E8' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="text-xs font-normal text-steel-400 ml-1">{unit}</span>}
      </p>
    </div>
  );
}

function ConfigToggle({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-obsidian-700">
      <span className="text-chrome-300 text-sm">{label}</span>
      <input
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-24 bg-obsidian-900 border border-obsidian-600 rounded-lg px-3 py-1.5 text-chrome-200 text-sm text-right outline-none focus:border-chrome-500"
        style={{ touchAction: 'auto', userSelect: 'auto' }}
      />
    </div>
  );
}

const MOCK_METRICS: DevMetrics = {
  apiLatencyMs:          38,
  firestoreReadsToday:   14230,
  firestoreWritesToday:  3410,
  antiCheatBlocksToday:  12,
  activeUsers:           187,
  syncCallsPerMinute:    94,
};

export default function DeveloperModule() {
  const [metrics, setMetrics]   = useState<DevMetrics>(MOCK_METRICS);
  const [maxCPS,  setMaxCPS]    = useState(20);
  const [regenRate, setRegenRate] = useState(3);
  const [maxEnergy, setMaxEnergy] = useState(1000);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    // In production: fetch /api/admin/metrics with auth token
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        apiLatencyMs:       20 + Math.floor(Math.random() * 50),
        syncCallsPerMinute: 80 + Math.floor(Math.random() * 40),
        activeUsers:        prev.activeUsers + Math.floor(Math.random() * 3 - 1),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const saveConfig = async () => {
    // In production: POST /api/admin/config
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="p-5 space-y-6">
      <div>
        <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-3">
          Live API Metrics
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="API Latency"       value={metrics.apiLatencyMs}          unit="ms"   accent="#4FC3F7" />
          <MetricCard label="Active Users"      value={metrics.activeUsers}                        accent="#A5D6A7" />
          <MetricCard label="Reads Today"       value={metrics.firestoreReadsToday}                />
          <MetricCard label="Writes Today"      value={metrics.firestoreWritesToday}               />
          <MetricCard label="Anti-Cheat Blocks" value={metrics.antiCheatBlocksToday}               accent="#EF9A9A" />
          <MetricCard label="Syncs / min"       value={metrics.syncCallsPerMinute}                 accent="#FFE082" />
        </div>
      </div>

      <div>
        <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-3">
          Game Config
        </h3>
        <div className="chrome-surface rounded-xl px-4">
          <ConfigToggle label="Max CPS (anti-cheat ceiling)" value={maxCPS}      onChange={setMaxCPS}    />
          <ConfigToggle label="Energy regen rate (per sec)"  value={regenRate}   onChange={setRegenRate}  />
          <ConfigToggle label="Max energy capacity"          value={maxEnergy}   onChange={setMaxEnergy}  />
        </div>
        <button
          onClick={saveConfig}
          className="mt-3 chrome-button w-full py-2.5 rounded-xl font-bold text-obsidian-900 text-sm"
        >
          {saved ? '✓ Saved' : 'Save Config'}
        </button>
      </div>

      <div>
        <h3 className="chrome-text text-sm font-black uppercase tracking-widest mb-3">
          Anti-Cheat Log
        </h3>
        <div className="chrome-surface rounded-xl overflow-hidden">
          {[
            { user: '@player123', reason: 'CPS exceeded',   clicks: 420, max: 60 },
            { user: '@grinder99', reason: 'Hash mismatch',  clicks: 800, max: 60 },
            { user: '@tapper007', reason: 'CPS exceeded',   clicks: 350, max: 60 },
          ].map((log, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 border-b border-obsidian-700 last:border-0">
              <div>
                <p className="text-chrome-300 text-xs font-semibold">{log.user}</p>
                <p className="text-steel-400 text-[10px]">{log.reason}</p>
              </div>
              <div className="text-right">
                <p className="text-red-400 text-xs font-bold">{log.clicks} clicks</p>
                <p className="text-steel-400 text-[10px]">max {log.max}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
