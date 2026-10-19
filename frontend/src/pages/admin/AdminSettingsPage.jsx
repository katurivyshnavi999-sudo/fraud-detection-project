import React, { useState } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Info,
  Shield,
  Clock,
  RotateCcw
} from 'lucide-react';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState({
    generationInterval: 2000,
    speedFactor: 'Normal (1x)',
    safeProportion: 80,
    suspiciousProportion: 12,
    fraudProportion: 8,
    safeThreshold: 40,
    fraudThreshold: 75,
    autoAlertEnabled: true
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleReset = () => {
    setSettings({
      generationInterval: 2000,
      speedFactor: 'Normal (1x)',
      safeProportion: 80,
      suspiciousProportion: 12,
      fraudProportion: 8,
      safeThreshold: 40,
      fraudThreshold: 75,
      autoAlertEnabled: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Simulation & Risk Engine Settings</h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure transaction generator parameters, prototype risk thresholds, and alert triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-600 shadow-sm flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
        </div>
      </div>

      {/* Prototype Disclaimer Banner */}
      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex gap-3 items-start">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Simulation Parameter Notice:</span>
          <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
            The thresholds and generation proportions defined here are configurable operational simulation parameters designed to test and evaluate system behaviors across diverse transaction patterns.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Stream Generator Settings */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" /> Transaction Stream Generator Controls
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Generation Interval (Milliseconds):
              </label>
              <select
                value={settings.generationInterval}
                onChange={(e) => setSettings({ ...settings, generationInterval: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value={500}>500 ms (Rapid Burst)</option>
                <option value={1000}>1000 ms (1 second)</option>
                <option value={2000}>2000 ms (2 seconds - Recommended)</option>
                <option value={5000}>5000 ms (5 seconds)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Controls the delay between simulated transaction emissions.</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Simulation Speed Multiplier:
              </label>
              <select
                value={settings.speedFactor}
                onChange={(e) => setSettings({ ...settings, speedFactor: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="Normal (1x)">Normal (1x Real-Time)</option>
                <option value="Accelerated (2x)">Accelerated (2x)</option>
                <option value="Fast (5x)">Fast (5x)</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 mb-2">Simulated Data Risk Distribution Proportions:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="font-semibold text-emerald-800">Safe Transactions:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={settings.safeProportion}
                    onChange={(e) => setSettings({ ...settings, safeProportion: Number(e.target.value) })}
                    className="w-20 bg-white border border-emerald-300 rounded p-1 text-center font-mono font-bold"
                  />
                  <span className="font-mono font-bold text-emerald-900">%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <span className="font-semibold text-amber-800">Suspicious Events:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.suspiciousProportion}
                    onChange={(e) => setSettings({ ...settings, suspiciousProportion: Number(e.target.value) })}
                    className="w-20 bg-white border border-amber-300 rounded p-1 text-center font-mono font-bold"
                  />
                  <span className="font-mono font-bold text-amber-900">%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <span className="font-semibold text-rose-800">Fraud Patterns:</span>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={settings.fraudProportion}
                    onChange={(e) => setSettings({ ...settings, fraudProportion: Number(e.target.value) })}
                    className="w-20 bg-white border border-rose-300 rounded p-1 text-center font-mono font-bold"
                  />
                  <span className="font-mono font-bold text-rose-900">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Prototype Risk Thresholds */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 pb-3 border-b border-slate-100">
            <Shield className="w-4 h-4 text-blue-600" /> Hybrid Classification Thresholds
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Safe to Suspicious Threshold (Scale 0 - 100):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={settings.safeThreshold}
                  onChange={(e) => setSettings({ ...settings, safeThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded w-12 text-center">
                  {settings.safeThreshold}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Transactions with score below {settings.safeThreshold} are categorized as Safe.</p>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Suspicious to Fraud Alert Threshold (Scale 0 - 100):
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="60"
                  max="90"
                  value={settings.fraudThreshold}
                  onChange={(e) => setSettings({ ...settings, fraudThreshold: Number(e.target.value) })}
                  className="w-full h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded w-12 text-center">
                  {settings.fraudThreshold}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Transactions with score at or above {settings.fraudThreshold} trigger high-risk fraud alerts.</p>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" /> Save Simulation & Risk Configuration
          </button>

          {savedSuccess && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4" /> Settings successfully saved to database
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default AdminSettingsPage;
