import React from 'react';

export const StatusBadge = ({ status, type = 'prediction' }) => {
  if (type === 'prediction') {
    const isFraud = String(status).toLowerCase().includes('fraud') || String(status).toLowerCase() === 'blocked' || String(status).toLowerCase() === 'flagged';
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
        isFraud 
          ? 'bg-red-950/80 text-red-400 border border-red-800/60' 
          : 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
      }`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isFraud ? 'bg-red-400 animate-pulse' : 'bg-emerald-400'}`}></span>
        {status}
      </span>
    );
  }

  if (type === 'risk') {
    const s = String(status).toUpperCase();
    let colorClass = 'bg-slate-800 text-slate-300 border-slate-700';
    if (s === 'CRITICAL') colorClass = 'bg-red-950 text-red-300 border-red-700 font-bold';
    else if (s === 'HIGH') colorClass = 'bg-orange-950 text-orange-300 border-orange-700';
    else if (s === 'MEDIUM') colorClass = 'bg-amber-950 text-amber-300 border-amber-700';
    else if (s === 'LOW') colorClass = 'bg-emerald-950 text-emerald-300 border-emerald-700';

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium border ${colorClass}`}>
        {status}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
      {status}
    </span>
  );
};

export const DemoModeBadge = ({ note }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono bg-blue-950/60 text-blue-300 border border-blue-800/50" title={note || "Academic Prototype Demo Mode: Trained weights can be loaded via /models"}>
    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping"></span>
    DEMO INFERENCE MODE
  </span>
);
