import React from 'react';

export const RiskMeter = ({ score = 0, confidence = 0, size = 'normal' }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine color theme based on score
  let colorClass = 'text-emerald-400 stroke-emerald-500';
  let bgFillClass = 'bg-emerald-500';
  let riskText = 'LOW RISK';
  let badgeBorder = 'border-emerald-500/40 text-emerald-400 bg-emerald-950/40';

  if (normalizedScore >= 85) {
    colorClass = 'text-red-500 stroke-red-500';
    bgFillClass = 'bg-red-500';
    riskText = 'CRITICAL FRAUD RISK';
    badgeBorder = 'border-red-500/50 text-red-400 bg-red-950/50';
  } else if (normalizedScore >= 65) {
    colorClass = 'text-orange-500 stroke-orange-500';
    bgFillClass = 'bg-orange-500';
    riskText = 'HIGH RISK';
    badgeBorder = 'border-orange-500/40 text-orange-400 bg-orange-950/40';
  } else if (normalizedScore >= 40) {
    colorClass = 'text-amber-400 stroke-amber-400';
    bgFillClass = 'bg-amber-400';
    riskText = 'MODERATE RISK';
    badgeBorder = 'border-amber-500/40 text-amber-400 bg-amber-950/40';
  }

  // SVG Gauge calculations
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  // Half-circle arch (180 deg)
  const strokeDashoffset = circumference - (normalizedScore / 100) * (circumference / 2);

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-dark-card border border-dark-border">
      <div className="relative flex items-center justify-center">
        <svg className="w-36 h-24 transform rotate-180" viewBox="0 0 120 70">
          {/* Background Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#1F293D"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active Colored Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            className={colorClass}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference / 2}
            strokeDashoffset={((100 - normalizedScore) / 100) * (circumference / 2)}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-3xl font-mono font-bold tracking-tight text-white">
            {normalizedScore.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
            Risk Index
          </span>
        </div>
      </div>

      <div className="mt-1 flex flex-col items-center gap-1">
        <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-semibold border ${badgeBorder}`}>
          {riskText}
        </span>
        {confidence > 0 && (
          <span className="text-xs text-slate-400 font-mono mt-1">
            Model Confidence: <span className="text-slate-200 font-semibold">{confidence.toFixed(1)}%</span>
          </span>
        )}
      </div>
    </div>
  );
};
