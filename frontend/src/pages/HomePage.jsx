import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  GitFork,
  Network,
  Cpu,
  RefreshCw,
  Eye,
  Layers,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

export const HomePage = () => {
  const features = [
    {
      title: 'Hybrid Contrastive Learning',
      icon: Layers,
      color: 'text-blue-400',
      bg: 'bg-blue-600/10 border-blue-500/20',
      desc: 'Blends self-supervised metric representations with supervised decision boundaries to isolate subtle fraudulent transaction signatures.'
    },
    {
      title: 'Siamese Neural Network',
      icon: GitFork,
      color: 'text-purple-400',
      bg: 'bg-purple-600/10 border-purple-500/20',
      desc: 'Twin parameter-sharing neural encoders map user historical spending profiles against current transactions using Contrastive Loss.'
    },
    {
      title: 'Attention Network',
      icon: Cpu,
      color: 'text-cyan-400',
      bg: 'bg-cyan-600/10 border-cyan-500/20',
      desc: 'Multi-head temporal self-attention models capture sudden burst behaviors, frequency spikes, and off-hour transaction sequences.'
    },
    {
      title: 'Graph Neural Network (GNN)',
      icon: Network,
      color: 'text-emerald-400',
      bg: 'bg-emerald-600/10 border-emerald-500/20',
      desc: 'Heterogeneous neighborhood aggregation across Users, Devices, and Merchants to uncover multi-account syndicates and shared emulators.'
    },
    {
      title: 'Continual Learning Engine',
      icon: RefreshCw,
      color: 'text-amber-400',
      bg: 'bg-amber-600/10 border-amber-500/20',
      desc: 'Streaming rehearsal buffer with Elastic Weight Consolidation (EWC) adapts models to emerging fraud patterns without catastrophic forgetting.'
    },
    {
      title: 'Explainable AI (SHAP)',
      icon: Eye,
      color: 'text-rose-400',
      bg: 'bg-rose-600/10 border-rose-500/20',
      desc: 'Rigorous game-theoretic Shapley attributions decompose individual predictions into transparent positive and negative feature forces.'
    }
  ];

  return (
    <div className="space-y-10">
      {/* Hero Section */}
      <div className="relative rounded-2xl bg-dark-card border border-dark-border p-8 md:p-12 overflow-hidden">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/50 text-blue-300 text-xs font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
            BTech Final-Year Capstone Project • AI & Machine Learning
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white leading-tight">
            Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
          </h1>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            A next-generation financial security intelligence system designed to defeat sophisticated digital payment threats across UPI, card networks, and net banking using multi-hop graph topology and continual representation learning.
          </p>

          <div className="pt-4 flex flex-wrap items-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold tracking-wide transition-all glow-subtle-blue"
            >
              <span>Launch Analytics Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/architecture"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-dark-surface hover:bg-dark-hover border border-dark-border text-slate-300 text-xs font-medium transition-all"
            >
              <span>Explore Architecture Pipeline</span>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </Link>
          </div>
        </div>
      </div>

      {/* The Problem & Proposed AI System */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center gap-2 text-rose-400 text-sm font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <h3>The Digital Payment Fraud Challenge</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Modern digital payment ecosystems process trillions of high-frequency transactions daily. Traditional rule-based engines and isolated tabular machine learning models fail when confronting distributed fraud syndicates, device spoofing farms, synthetic identities, and evolving zero-day tactics.
          </p>
          <ul className="space-y-1.5 pt-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400"></span>
              Distributed Account Takeover (ATO) bypassing 2FA
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400"></span>
              Card-testing botnets cycling stolen credit card numbers
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-red-400"></span>
              Non-stationary fraud drift causing catastrophic model decay
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <h3>The Proposed AI Solution</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our framework solves these limitations by fusing multi-modal architectures into a single adaptive pipeline. It constructs a heterogeneous transaction graph to propagate risk across shared hardware and merchants, while Siamese twin networks detect behavioral drift and continual learning shields against new vectors.
          </p>
          <ul className="space-y-1.5 pt-2 text-xs text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
              Relational GNNs capture multi-hop syndicate rings
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
              Zero-downtime streaming updates with Experience Replay
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
              SHAP feature attributions ensure regulatory auditability
            </li>
          </ul>
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">Core Architectural Components</h2>
          <p className="text-xs text-slate-400">
            Six interconnected technical innovations powering the hybrid detection system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.title}
                className="p-5 rounded-xl bg-dark-card border border-dark-border hover:border-slate-700 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${feat.bg} ${feat.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
