import React from 'react';

export const RiskMeter = ({ score = 0, confidence = 0 }) => {
  const normalizedScore = Math.min(100, Math.max(0, score));

  // Determine color theme based on score
  let strokeColor = '#10b981'; // Green
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let riskText = 'SAFE (LOW RISK)';

  if (normalizedScore >= 75) {
    strokeColor = '#ef4444'; // Red
    badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
    riskText = 'HIGH RISK / FRAUD';
  } else if (normalizedScore >= 40) {
    strokeColor = '#f59e0b'; // Orange
    badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
    riskText = 'SUSPICIOUS ACTIVITY';
  }

  const radius = 48;
  const circumference = Math.PI * radius; // Half-circle
  const dashOffset = ((100 - normalizedScore) / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
      <div className="relative flex items-center justify-center">
        <svg className="w-40 h-24 transform rotate-180" viewBox="0 0 120 70">
          {/* Background Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <path
            d="M 10 60 A 50 50 0 0 1 110 60"
            fill="none"
            stroke={strokeColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>

        <div className="absolute top-10 flex flex-col items-center">
          <span className="text-3xl font-mono font-bold tracking-tight text-slate-800">
            {normalizedScore.toFixed(1)}
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
            Score / 100
          </span>
        </div>
      </div>

      <div className="mt-2 flex flex-col items-center gap-1">
        <span className={`px-3 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle}`}>
          {riskText}
        </span>
        {confidence > 0 && (
          <span className="text-xs text-slate-500 font-mono mt-1">
            Hybrid Confidence: <span className="text-slate-700 font-semibold">{confidence.toFixed(1)}%</span>
          </span>
        )}
      </div>
    </div>
  );
};
