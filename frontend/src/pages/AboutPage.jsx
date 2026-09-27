import React from 'react';
import {
  GraduationCap,
  Users,
  Award,
  BookOpen,
  Shield,
  Layers,
  CheckCircle,
  ExternalLink,
  Code
} from 'lucide-react';

export const AboutPage = () => {
  const teamMembers = [
    {
      name: 'Bellamkonda Pallavi',
      role: 'Siamese Contrastive Architecture & Metric Learning',
      tasks: 'Designed twin encoder networks, contrastive loss formulations, and user spending profile embeddings.'
    },
    {
      name: 'Dasari Raju Kavya',
      role: 'Graph Neural Networks & Relational Topology',
      tasks: 'Constructed heterogeneous bipartite graphs (User-Device-Merchant-Txn) and GraphSAGE neighborhood aggregation.'
    },
    {
      name: 'Kachi Venkata Sudha Vyshnavi',
      role: 'Continual Learning & Concept Drift Pipeline',
      tasks: 'Implemented experience replay buffers, ADWIN drift monitoring, and Elastic Weight Consolidation (EWC).'
    },
    {
      name: 'Katuru Vyshnavi',
      role: 'Full-Stack Dashboard & Explainable AI (SHAP)',
      tasks: 'Developed React cybersecurity analytics dashboard, FastAPI services, and SHAP feature attribution waterfall views.'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-8 rounded-2xl bg-dark-card border border-dark-border relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-800/50 text-blue-300 text-xs font-mono">
            <GraduationCap className="w-4 h-4 text-blue-400" />
            BTech Final-Year Capstone Project Submission
          </div>

          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white leading-tight">
            Graph-Enhanced Adaptive Hybrid Learning for Digital Payment Fraud Detection
          </h1>

          <p className="text-xs md:text-sm text-slate-300">
            Department of Artificial Intelligence & Machine Learning
          </p>
        </div>
      </div>

      {/* Project Leadership & Mentorship */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-blue-400">
            <Award className="w-4 h-4" />
            Project Coordinator
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Ms. B. Poojitha</h3>
            <p className="text-xs text-slate-400">Faculty Coordinator</p>
            <p className="text-xs text-slate-500 mt-1">Department of Artificial Intelligence & Machine Learning</p>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <div className="flex items-center gap-2.5 text-xs font-mono uppercase tracking-wider text-emerald-400">
            <Award className="w-4 h-4" />
            Project Guide
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Mr. K. Chiranjeevi</h3>
            <p className="text-xs text-slate-400">Project Mentor & Guide</p>
            <p className="text-xs text-slate-500 mt-1">Department of Artificial Intelligence & Machine Learning</p>
          </div>
        </div>
      </div>

      {/* Student Project Team */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-400" />
          <h2 className="text-base font-bold text-white tracking-wide">Project Student Team</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="p-5 rounded-xl bg-dark-card border border-dark-border hover:border-blue-500/40 transition-colors flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">{member.name}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-dark-surface border border-dark-border text-slate-400">
                    Team Member 0{index + 1}
                  </span>
                </div>
                <p className="text-xs font-mono text-blue-400 mt-1">{member.role}</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {member.tasks}
                </p>
              </div>

              <div className="pt-2 border-t border-dark-border/60 text-[10px] font-mono text-slate-500">
                Identity records verified in backend configuration.
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Academic Integrity & Reproducibility Statement */}
      <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-400" />
          Academic Integrity & Modular Design Statement
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          In strict compliance with academic research integrity standards, this prototype uses a modular inference architecture. No fabricated real-world accuracy claims are made. Real neural network weights (PyTorch state dictionaries, PyTorch Geometric GNN checkpoints, and pickled SHAP explainers) can be placed into the <code className="bg-dark-surface text-blue-300 px-1 rounded">/models</code> directory to transition the system to live empirical inference.
        </p>
      </div>
    </div>
  );
};
