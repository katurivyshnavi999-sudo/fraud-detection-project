import React from 'react';

export const StatusBadge = ({ status, type = 'prediction' }) => {
  const s = String(status || '').trim();
  const lower = s.toLowerCase();

  if (type === 'prediction' || type === 'category') {
    const isFraud = lower.includes('fraud') || lower === 'blocked' || lower === 'high risk' || lower === 'critical';
    const isSuspicious = lower.includes('suspicious') || lower.includes('review') || lower === 'medium risk' || lower === 'warning';
    
    if (isFraud) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
          {s || 'Fraud'}
        </span>
      );
    }

    if (isSuspicious) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {s || 'Suspicious'}
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {s || 'Safe'}
      </span>
    );
  }

  if (type === 'risk') {
    const upper = s.toUpperCase();
    let badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
    if (upper === 'CRITICAL' || upper === 'HIGH') {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
    } else if (upper === 'MEDIUM' || upper === 'SUSPICIOUS') {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';
    } else if (upper === 'LOW' || upper === 'SAFE') {
      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${badgeClass}`}>
        {s || 'LOW'}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {s}
    </span>
  );
};

export const SimulatedEnvironmentBadge = ({ label = 'Simulated Payment Network' }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
    {label}
  </span>
);
