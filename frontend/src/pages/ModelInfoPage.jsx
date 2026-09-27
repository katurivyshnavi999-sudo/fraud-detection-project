import React from 'react';
import {
  Layers,
  ArrowDown,
  GitFork,
  Cpu,
  Network,
  RefreshCw,
  Eye,
  CheckCircle2,
  HelpCircle,
  Code2,
  FileCode
} from 'lucide-react';

export const ModelInfoPage = () => {
  const pipeline = [
    {
      step: 1,
      title: 'Input Transaction Data Ingestion',
      category: 'Data Layer',
      desc: 'Real-time streaming ingestion of transaction features: Amount, Timestamp, User ID, Merchant ID, Device Hardware Fingerprint, Payment Method, and Geolocation coordinates.',
      math: 'x = [x_{num}, x_{cat}, x_{cyclical}, x_{graph}] \\in \\mathbb{R}^d',
      viva: 'Examiner asks: "How do you handle timestamps?" Answer: We decompose timestamps into cyclical sine and cosine projections (\u03c0*hour/12) so 23:59 and 00:01 remain numerically adjacent.'
    },
    {
      step: 2,
      title: 'Hybrid Contrastive Learning',
      category: 'Self-Supervised Pretraining',
      desc: 'Pre-trains representation encoders that map genuine user habits close together in latent space while repelling fraudulent anomalies far apart.',
      math: '\\mathcal{L}_{contrastive} = (1-Y)\\frac{1}{2}D^2 + Y\\frac{1}{2}\\{\\max(0, m - D)\\}^2',
      viva: 'Examiner asks: "Why contrastive learning?" Answer: Fraud datasets are heavily imbalanced (often <1% fraud). Contrastive learning trains encoders on representation similarity without relying solely on class balance.'
    },
    {
      step: 3,
      title: 'Siamese Neural Network (Twin Encoders)',
      category: 'Behavior Profiling',
      desc: 'Twin subnetworks sharing identical weights compute the Euclidean distance between a user’s historical baseline anchor and the incoming transaction candidate vector.',
      math: 'D(x_1, x_2) = \\|f_\\theta(x_1) - f_\\theta(x_2)\\|_2',
      viva: 'Examiner asks: "What is a twin encoder?" Answer: Two identical feed-forward networks that share weights \\theta, ensuring both candidate and anchor transactions are projected into the same metric space.'
    },
    {
      step: 4,
      title: 'Attention-Based Neural Network',
      category: 'Sequential Modeling',
      desc: 'Multi-head temporal self-attention captures short-term velocity bursts, sudden transaction frequency changes, and abnormal off-hour purchasing sequences.',
      math: '\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V',
      viva: 'Examiner asks: "Why attention instead of LSTM?" Answer: Multi-head self-attention models long-range and burst dependencies in parallel with faster GPU matrix operations, without vanishing gradients.'
    },
    {
      step: 5,
      title: 'Graph Neural Network (GNN - GraphSAGE)',
      category: 'Relational Graph Topology',
      desc: 'Heterogeneous neighborhood aggregation across User \u2192 Device \u2192 Transaction \u2192 Merchant bipartite graphs to detect multi-account syndicates and shared emulator farms.',
      math: 'h_v^{(k)} = \\sigma\\left(W \\cdot \\text{CONCAT}\\left(h_v^{(k-1)}, \\text{AGG}\\left(\\{h_u^{(k-1)}, \\forall u \\in \\mathcal{N}(v)\\}\\right)\\right)\\right)',
      viva: 'Examiner asks: "How does GNN detect organized fraud rings?" Answer: Fraudsters share devices or bank accounts across synthetic accounts. GNN message-passing propagates risk embeddings across shared hardware nodes.'
    },
    {
      step: 6,
      title: 'Continual Learning Engine',
      category: 'Adaptive Model Evolution',
      desc: 'Experience replay buffer with Elastic Weight Consolidation (EWC) adapts the network to emerging zero-day attack tactics without catastrophic forgetting of old baseline fraud patterns.',
      math: '\\mathcal{L}(\\theta) = \\mathcal{L}_{new}(\\theta) + \\sum_i \\frac{\\lambda}{2} F_i (\\theta_i - \\theta_{i,old}^*)^2',
      viva: 'Examiner asks: "What is catastrophic forgetting?" Answer: When a neural network trains on new data, its weights can overwrite previously learned patterns. EWC penalizes changes to critical weights using Fisher Information matrix F.'
    },
    {
      step: 7,
      title: 'Fraud Prediction & Decision Engine',
      category: 'Inference Layer',
      desc: 'Calibrates representation distances, attention scores, and graph embeddings into a normalized 0-100 Risk Index and assigns automated actions: Approved, Challenge OTP, or Block.',
      math: 'R(x) = \\sigma\\left(\\alpha \\cdot h_{gnn} + \\beta \\cdot D_{siamese} + \\gamma \\cdot \\text{Attn}(x)\\right) \\times 100',
      viva: 'Examiner asks: "How do you set the decision threshold?" Answer: We calibrate operating thresholds based on cost-benefit trade-offs between False Positives (customer friction) and False Negatives (financial loss).'
    },
    {
      step: 8,
      title: 'SHAP Explainable AI (XAI)',
      category: 'Interpretability & Governance',
      desc: 'Game-theoretic Shapley value decomposition attributes positive and negative forces to individual features, ensuring regulatory compliance and analyst auditability.',
      math: '\\phi_i(x) = \\sum_{S \\subseteq F \\setminus \\{i\\}} \\frac{|S|!(|F| - |S| - 1)!}{|F|!} (f(S \\cup \\{i\\}) - f(S))',
      viva: 'Examiner asks: "Why SHAP?" Answer: SHAP provides fair Shapley attribution satisfying efficiency, symmetry, and additivity, explaining exactly why an individual transaction was blocked.'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-2 border-b border-dark-border">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-white tracking-wide">Model Architecture & Viva Presentation Guide</h1>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/70 text-blue-300 border border-blue-800">
            BTech Capstone Defense
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Complete structural explanation of the 8-stage hybrid learning pipeline, mathematical equations, and examiner viva questions.
        </p>
      </div>

      {/* Visual Pipeline Flowchart */}
      <div className="p-6 rounded-xl bg-dark-card border border-dark-border">
        <h2 className="text-sm font-bold text-white mb-6 tracking-wide flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          End-to-End Architectural Pipeline Flow
        </h2>

        <div className="relative space-y-6">
          {pipeline.map((item, index) => (
            <div key={item.step} className="relative">
              {/* Step Card */}
              <div className="p-5 rounded-xl bg-dark-surface border border-dark-border hover:border-blue-500/40 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/40 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      0{item.step}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{item.title}</h3>
                      <span className="text-[10px] font-mono text-blue-400 uppercase">{item.category}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {item.desc}
                </p>

                {/* Mathematical Formulation */}
                <div className="p-3 rounded-lg bg-dark-card border border-dark-border font-mono text-xs text-cyan-300 overflow-x-auto">
                  <span className="text-[10px] text-slate-500 block mb-0.5 uppercase font-sans font-semibold">Mathematical Formula:</span>
                  {item.math}
                </div>

                {/* Viva Tip */}
                <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-300 text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    <span>Viva Defense Tip:</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{item.viva}</p>
                </div>
              </div>

              {/* Arrow downwards */}
              {index < pipeline.length - 1 && (
                <div className="flex justify-center my-2">
                  <div className="w-6 h-6 rounded-full bg-dark-card border border-dark-border flex items-center justify-center text-slate-400">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
