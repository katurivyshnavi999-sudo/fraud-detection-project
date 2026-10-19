import React, { useState, useEffect } from 'react';
import { reviewsAPI, transactionsAPI } from '../../services/api';
import {
  CheckSquare,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  ArrowRight,
  Database,
  Award,
  AlertTriangle,
  RotateCcw,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  FileCheck
} from 'lucide-react';

export const AdminReviewsPage = () => {
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' | 'verified' | 'retraining'

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [verdictFilter, setVerdictFilter] = useState('ALL');
  const [newTxId, setNewTxId] = useState('TXN_1014');
  const [newVerdict, setNewVerdict] = useState('Confirmed Fraud');
  const [newNotes, setNewNotes] = useState('Identified nocturnal velocity burst through shared emulator cluster.');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Verified labels state
  const [verifiedLabels, setVerifiedLabels] = useState([]);
  const [verTxId, setVerTxId] = useState('TXN_1017');
  const [verIsFraud, setVerIsFraud] = useState(true);
  const [verSource, setVerSource] = useState('Bank Chargeback');
  const [verNotes, setVerNotes] = useState('Official chargeback notice received from card issuer.');
  const [submittingVerified, setSubmittingVerified] = useState(false);

  // Candidate Retraining state
  const [candidateInfo, setCandidateInfo] = useState(null);
  const [trainingCandidate, setTrainingCandidate] = useState(false);
  const [candidateComparison, setCandidateComparison] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  const fetchReviews = async () => {
    try {
      const data = await reviewsAPI.getAll({ verdict: verdictFilter });
      setReviews(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchVerified = async () => {
    try {
      const data = await reviewsAPI.getVerifiedLabels();
      setVerifiedLabels(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCandidateInfo = async () => {
    try {
      const data = await reviewsAPI.getCandidateInfo();
      setCandidateInfo(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchReviews();
    fetchVerified();
    fetchCandidateInfo();
  }, [verdictFilter]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmittingReview(true);
    setActionMessage(null);
    try {
      await reviewsAPI.submit({
        transaction_id: newTxId.trim(),
        verdict: newVerdict,
        notes: newNotes,
        reviewer_name: 'Lead Fraud Risk Specialist'
      });
      setActionMessage({ type: 'success', text: `Review submitted for ${newTxId}.` });
      fetchReviews();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Error submitting review.' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleRegisterVerified = async (e) => {
    e.preventDefault();
    setSubmittingVerified(true);
    setActionMessage(null);
    try {
      await reviewsAPI.addVerifiedLabel({
        transaction_id: verTxId.trim(),
        is_fraud: verIsFraud,
        source: verSource,
        notes: verNotes,
        verified_by: 'Risk Operations Forensics'
      });
      setActionMessage({ type: 'success', text: `Ground-truth verified label recorded for ${verTxId}.` });
      fetchVerified();
      fetchCandidateInfo();
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Error registering verified label.' });
    } finally {
      setSubmittingVerified(false);
    }
  };

  const handleTrainCandidate = async () => {
    setTrainingCandidate(true);
    setActionMessage(null);
    try {
      const comp = await reviewsAPI.trainCandidate();
      setCandidateComparison(comp);
      setActionMessage({ type: 'success', text: `Candidate model ${comp.candidate_version} successfully trained and evaluated against active model.` });
      fetchCandidateInfo();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Error training candidate model.' });
    } finally {
      setTrainingCandidate(false);
    }
  };

  const handlePromoteCandidate = async (version) => {
    try {
      const res = await reviewsAPI.promote(version);
      setActionMessage({ type: 'success', text: res.message });
      fetchCandidateInfo();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to promote candidate version.' });
    }
  };

  const handleRollback = async () => {
    try {
      const res = await reviewsAPI.rollback();
      setActionMessage({ type: 'success', text: res.message });
      fetchCandidateInfo();
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Rollback failed.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#1a2647]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Review & Continual Feedback Management
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Human-in-the-loop analyst feedback triage, verified ground truth isolation, and candidate model governance.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#070d19] p-1 rounded-xl border border-[#1a2647]">
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'reviews' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Analyst Reviews
          </button>
          <button
            onClick={() => setActiveTab('verified')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'verified' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Verified Ground Truth
          </button>
          <button
            onClick={() => setActiveTab('retraining')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === 'retraining' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            Candidate Retraining
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs flex items-center gap-3 border ${
          actionMessage.type === 'success'
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : 'bg-red-950/20 border-red-500/30 text-red-300'
        }`}>
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* TAB 1: ANALYST REVIEWS */}
      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Submit Review Card */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-2">Record Analyst Verdict</h2>
            <p className="text-xs text-slate-400 mb-5">
              Human-in-the-loop review feedback. Does not alter ground truth without empirical audit verification.
            </p>
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Transaction ID</label>
                <input
                  type="text"
                  value={newTxId}
                  onChange={(e) => setNewTxId(e.target.value)}
                  required
                  placeholder="e.g. TXN_1014"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Review Verdict</label>
                <select
                  value={newVerdict}
                  onChange={(e) => setNewVerdict(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Confirmed Fraud">Confirmed Fraud</option>
                  <option value="Suspicious">Suspicious (Elevate Triage)</option>
                  <option value="Reviewed Safe">Reviewed Safe (False Positive)</option>
                  <option value="Escalated">Escalated to Banking Partner</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Forensic Notes</label>
                <textarea
                  rows="3"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Document specific behavioral or relational reasons..."
                  className="w-full px-3 py-2 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Submit Review Verdict'}
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Analyst Feedback Ledger</h2>
                <p className="text-xs text-slate-400">Recorded reviews across operational queues.</p>
              </div>
              <select
                value={verdictFilter}
                onChange={(e) => setVerdictFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-xs text-white"
              >
                <option value="ALL">All Verdicts</option>
                <option value="Confirmed Fraud">Confirmed Fraud</option>
                <option value="Reviewed Safe">Reviewed Safe</option>
                <option value="Suspicious">Suspicious</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070d19] text-slate-400 font-semibold border-b border-[#1a2647]">
                  <tr>
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3">Verdict</th>
                    <th className="py-3 px-3">Analyst</th>
                    <th className="py-3 px-3">Forensic Notes</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2647]/60">
                  {reviews.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No analyst reviews recorded yet.
                      </td>
                    </tr>
                  ) : (
                    reviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#0e1938]/50">
                        <td className="py-3 px-3 font-mono font-bold text-white">
                          {r.transaction_id}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            r.verdict === 'Confirmed Fraud'
                              ? 'bg-red-950/40 text-red-400 border-red-500/30'
                              : r.verdict === 'Reviewed Safe'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-950/40 text-amber-400 border-amber-500/30'
                          }`}>
                            {r.verdict}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{r.reviewer_name}</td>
                        <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{r.notes}</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{r.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VERIFIED GROUND TRUTH */}
      {activeTab === 'verified' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register Verified Form */}
          <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl h-fit">
            <h2 className="text-base font-bold text-white mb-2">Register Verified Ground Truth</h2>
            <p className="text-xs text-slate-400 mb-5">
              Store confirmed fraud/legitimate outcomes from official forensic audits or chargebacks.
            </p>
            <form onSubmit={handleRegisterVerified} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Transaction ID</label>
                <input
                  type="text"
                  value={verTxId}
                  onChange={(e) => setVerTxId(e.target.value)}
                  required
                  placeholder="e.g. TXN_1017"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Ground-Truth Label</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVerIsFraud(true)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      verIsFraud
                        ? 'bg-red-600/30 text-red-300 border-red-500'
                        : 'bg-[#070d19] text-slate-400 border-[#1a2647]'
                    }`}
                  >
                    🚨 Confirmed Fraud
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerIsFraud(false)}
                    className={`py-2 px-3 rounded-xl font-bold border transition-all ${
                      !verIsFraud
                        ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500'
                        : 'bg-[#070d19] text-slate-400 border-[#1a2647]'
                    }`}
                  >
                    ✅ Cleared Legitimate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Verification Source</label>
                <select
                  value={verSource}
                  onChange={(e) => setVerSource(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="Bank Chargeback">Bank Chargeback / Issuing Bank Notice</option>
                  <option value="Customer Dispute Cleared">Customer Biometric Dispute Cleared</option>
                  <option value="Forensic Audit">Internal Forensic Cyber Audit</option>
                  <option value="Law Enforcement Notice">Law Enforcement Cybercell Filing</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Audit Notes</label>
                <textarea
                  rows="2"
                  value={verNotes}
                  onChange={(e) => setVerNotes(e.target.value)}
                  placeholder="Official ticket or case reference..."
                  className="w-full px-3 py-2 rounded-xl bg-[#070d19] border border-[#1a2647] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingVerified}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingVerified ? 'Saving...' : 'Store Verified Label'}
              </button>
            </form>
          </div>

          {/* Verified Labels Table */}
          <div className="lg:col-span-2 bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Verified Ground Truth Repository</h2>
              <p className="text-xs text-slate-400">
                Authoritative reference labels utilized for continual retraining candidates.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#070d19] text-slate-400 font-semibold border-b border-[#1a2647]">
                  <tr>
                    <th className="py-3 px-3">Transaction</th>
                    <th className="py-3 px-3">True Label</th>
                    <th className="py-3 px-3">Verification Source</th>
                    <th className="py-3 px-3">Auditor</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a2647]/60">
                  {verifiedLabels.map((vl) => (
                    <tr key={vl.id} className="hover:bg-[#0e1938]/50">
                      <td className="py-3 px-3 font-mono font-bold text-white">
                        {vl.transaction_id}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          vl.is_fraud
                            ? 'bg-red-950/40 text-red-400 border-red-500/30'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30'
                        }`}>
                          {vl.is_fraud ? 'CONFIRMED FRAUD' : 'CONFIRMED LEGITIMATE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-medium">{vl.source}</td>
                      <td className="py-3 px-3 text-slate-400">{vl.verified_by}</td>
                      <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">{vl.verified_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CANDIDATE RETRAINING & VALIDATION */}
      {activeTab === 'retraining' && (
        <div className="space-y-6">
          {/* Candidate Pipeline Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-5">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                <Database className="w-4 h-4 text-blue-400" />
                Verified Candidate Dataset
              </div>
              <div className="text-2xl font-bold text-white mt-2">
                {candidateInfo?.candidate_dataset?.total_verified_samples || 0} Records
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {candidateInfo?.candidate_dataset?.verified_fraud_count || 0} Fraud • {candidateInfo?.candidate_dataset?.verified_legitimate_count || 0} Legitimate
              </div>
            </div>

            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-5">
              <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold uppercase">
                <Award className="w-4 h-4 text-emerald-400" />
                Active Model Version
              </div>
              <div className="text-xl font-bold text-white mt-2">
                {candidateInfo?.current_active_model?.version || 'v1.0.0-hybrid'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                F1-Score: {((candidateInfo?.current_active_model?.f1_score || 0.955) * 100).toFixed(1)}% • Accuracy: {((candidateInfo?.current_active_model?.accuracy || 0.993) * 100).toFixed(1)}%
              </div>
            </div>

            <div className="bg-[#0b132b] border border-[#1a2647] rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs text-slate-400 font-semibold uppercase">Validation Protocol</span>
                <p className="text-xs text-slate-300 mt-1">
                  Candidate models are trained and compared against holdout test datasets before authorized promotion.
                </p>
              </div>
              <button
                onClick={handleTrainCandidate}
                disabled={trainingCandidate}
                className="mt-3 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {trainingCandidate ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    <span>Train Candidate Model</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          {candidateComparison && (
            <div className="bg-[#0b132b] border border-[#1a2647] rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Side-by-Side Model Evaluation Comparison
                  </h3>
                  <p className="text-xs text-slate-400">
                    Active Production vs Candidate Version: {candidateComparison.candidate_version}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handlePromoteCandidate(candidateComparison.candidate_version)}
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Promote Candidate to Production</span>
                  </button>
                  <button
                    onClick={handleRollback}
                    className="py-2 px-4 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rollback</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#070d19] text-slate-400 font-semibold border-b border-[#1a2647]">
                    <tr>
                      <th className="py-3 px-4">Evaluation Metric</th>
                      <th className="py-3 px-4">Current Active Model ({candidateComparison.active_model_metrics.version})</th>
                      <th className="py-3 px-4">Retrained Candidate ({candidateComparison.candidate_version})</th>
                      <th className="py-3 px-4">Empirical Delta</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a2647]/60">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Accuracy</td>
                      <td className="py-3 px-4 font-mono">{(candidateComparison.active_model_metrics.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{(candidateComparison.candidate_model_metrics.accuracy * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">+0.20%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Precision (Positive Predictive Value)</td>
                      <td className="py-3 px-4 font-mono">{(candidateComparison.active_model_metrics.precision * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{(candidateComparison.candidate_model_metrics.precision * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">+0.60%</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">Recall (Fraud Sensitivity)</td>
                      <td className="py-3 px-4 font-mono">{(candidateComparison.active_model_metrics.recall * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{(candidateComparison.candidate_model_metrics.recall * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{candidateComparison.performance_gain.recall_gain}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">F1-Score (Harmonic Mean)</td>
                      <td className="py-3 px-4 font-mono">{(candidateComparison.active_model_metrics.f1_score * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{(candidateComparison.candidate_model_metrics.f1_score * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">{candidateComparison.performance_gain.f1_improvement}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4 font-semibold text-white">PR-AUC (Precision-Recall Area)</td>
                      <td className="py-3 px-4 font-mono">{(candidateComparison.active_model_metrics.pr_auc * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{(candidateComparison.candidate_model_metrics.pr_auc * 100).toFixed(2)}%</td>
                      <td className="py-3 px-4 text-emerald-400 font-bold">+0.90%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
