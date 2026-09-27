import React, { useState, useEffect } from 'react';
import { datasetAPI } from '../services/api';
import {
  Database,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';

export const DatasetPage = () => {
  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSampleDataset = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await datasetAPI.getSample();
      setDataset(data);
    } catch (err) {
      console.error('Failed to load sample dataset:', err);
      setError('Unable to load sample dataset from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSampleDataset();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const data = await datasetAPI.upload(formData);
      setDataset(data);
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload or parse CSV. Ensure it has valid header columns.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-dark-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-wide">Dataset Management & Telemetry</h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950/70 text-blue-300 border border-blue-800">
              CSV Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Inspect transaction feature schemas, statistical class balance, and automated preprocessing transformations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSampleDataset}
            className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-xs text-slate-300 hover:text-white hover:border-slate-600 transition-colors font-mono"
          >
            Reload Sample Dataset
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-950/40 border border-red-800 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Zone & Preprocessing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Card (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-xl bg-dark-card border border-dark-border flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-blue-400" />
              Upload Payment Transactions CSV
            </h3>
            <p className="text-xs text-slate-400">
              Upload custom transaction data to generate instant statistical overview and feature distributions.
            </p>
          </div>

          <label className="border-2 border-dashed border-dark-border hover:border-blue-500/50 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-dark-surface/50 group">
            <FileSpreadsheet className="w-8 h-8 text-slate-500 group-hover:text-blue-400 mb-2 transition-colors" />
            <span className="text-xs font-semibold text-slate-200">
              {uploading ? 'Processing File...' : 'Drop CSV here or click to browse'}
            </span>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Supports .csv format (UTF-8 encoded)
            </span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <div className="text-[11px] text-slate-500 font-mono">
            Active Source: <span className="text-blue-400">{dataset?.file_name || 'sample_transactions.csv'}</span>
          </div>
        </div>

        {/* Automated Preprocessing Info (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-dark-card border border-dark-border space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            Feature Engineering & Preprocessing Pipeline
          </h3>
          <p className="text-xs text-slate-400">
            Raw incoming transactions pass through the following automated transformation stages before hybrid model inference:
          </p>

          <div className="space-y-2 pt-2">
            {(dataset?.preprocessing_steps || [
              '1. Schema validation & column type mapping',
              '2. Missing value imputation via median for continuous amounts',
              '3. Cyclical sine/cosine transformation for timestamp features',
              '4. Entity graph node & edge generation (User, Device, Merchant)',
              '5. Normalization via robust log-scaling on transaction values'
            ]).map((step, idx) => (
              <div key={idx} className="p-2.5 rounded bg-dark-surface border border-dark-border flex items-center gap-2.5 text-xs text-slate-300">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-mono text-[11px]">{step}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] space-y-2">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="text-xs font-mono text-slate-400">Inspecting Dataset Schema...</span>
        </div>
      ) : dataset ? (
        <>
          {/* Statistical KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Total Rows</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {dataset.number_of_rows.toLocaleString()}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Transactions</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Feature Columns</span>
              <p className="text-xl font-bold font-mono text-white mt-1">
                {dataset.number_of_columns}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Attributes</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Missing Values</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {dataset.missing_values}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Null Elements</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Fraud Count</span>
              <p className="text-xl font-bold font-mono text-red-400 mt-1">
                {dataset.fraud_count}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Positive Class</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Legitimate Count</span>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                {dataset.legitimate_count}
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Negative Class</span>
            </div>

            <div className="p-4 rounded-xl bg-dark-card border border-dark-border">
              <span className="text-[11px] font-mono text-slate-400">Class Imbalance</span>
              <p className="text-xl font-bold font-mono text-amber-400 mt-1">
                {dataset.fraud_percentage}%
              </p>
              <span className="text-[9px] text-slate-500 font-mono">Fraud Ratio</span>
            </div>
          </div>

          {/* Dataset Preview Table */}
          <div className="p-6 rounded-xl bg-dark-card border border-dark-border space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Dataset Preview (First {dataset.preview_data?.length || 0} Records)
              </h3>
              <span className="text-xs font-mono text-slate-500">
                {dataset.file_name}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 font-mono border-collapse">
                <thead>
                  <tr className="border-b border-dark-border text-[11px] uppercase text-slate-400 bg-dark-surface/50">
                    {dataset.columns?.map((col) => (
                      <th key={col} className="py-2.5 px-3 whitespace-nowrap">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-dark-border/60">
                  {dataset.preview_data?.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-dark-surface/60 transition-colors">
                      {dataset.columns?.map((col) => (
                        <td key={`${rIdx}-${col}`} className="py-2.5 px-3 whitespace-nowrap">
                          {col === 'is_fraud' ? (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              String(row[col]) === '1' ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            }`}>
                              {String(row[col]) === '1' ? 'FRAUD (1)' : 'LEGIT (0)'}
                            </span>
                          ) : (
                            row[col]
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};
