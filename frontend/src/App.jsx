import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { RootLayout } from './layouts/RootLayout';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// The Primary Core Pages Connected to Left Sidebar Navigation
import { LiveMonitorPage } from './pages/LiveMonitorPage';
import { AnalyzeTransactionPage } from './pages/AnalyzeTransactionPage';
import { RelationshipExplorerPage } from './pages/RelationshipExplorerPage';
import { SHAPPage } from './pages/SHAPPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Main Single Application Inside Modern RootLayout with Left Sidebar */}
      <Route path="/" element={<RootLayout />}>
        {/* 1. Landing Page: Live Transactions */}
        <Route index element={<LiveMonitorPage />} />
        <Route path="transactions" element={<LiveMonitorPage />} />
        <Route path="live" element={<LiveMonitorPage />} />

        {/* 2. Feature Two: Enter and Analyze a Transaction */}
        <Route path="analyze" element={<AnalyzeTransactionPage />} />

        {/* 3. Feature Three: Relationship Graph Explorer */}
        <Route path="explorer" element={<RelationshipExplorerPage />} />

        {/* 4. Feature Four: SHAP Explanation */}
        <Route path="shap" element={<SHAPPage />} />

        {/* Safe Redirects for Removed Routes */}
        <Route path="timeline" element={<Navigate to="/explorer" replace />} />
        <Route path="case-study" element={<Navigate to="/explorer" replace />} />

        {/* Legacy / Direct Route Compatibility Fallbacks (No Login Walls) */}
        <Route path="admin/live-monitor" element={<Navigate to="/" replace />} />
        <Route path="admin/dashboard" element={<Navigate to="/" replace />} />
        <Route path="admin/fraud-network" element={<Navigate to="/explorer" replace />} />
        <Route path="admin/check-fraud" element={<Navigate to="/analyze" replace />} />
        <Route path="admin/transactions/predict" element={<Navigate to="/analyze" replace />} />
        <Route path="admin/shap-explanation" element={<Navigate to="/shap" replace />} />
        <Route path="user/check-fraud" element={<Navigate to="/analyze" replace />} />
        <Route path="user/dashboard" element={<Navigate to="/" replace />} />
        <Route path="login" element={<Navigate to="/" replace />} />
      </Route>

      {/* Catch-all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppProvider>
          <AppRoutes />
        </AppProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
