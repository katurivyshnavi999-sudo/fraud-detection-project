import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { RootLayout } from './layouts/RootLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { DetectFraudPage } from './pages/DetectFraudPage';
import { NetworkGraphPage } from './pages/NetworkGraphPage';
import { ExplainableAIPage } from './pages/ExplainableAIPage';
import { ContinualLearningPage } from './pages/ContinualLearningPage';
import { DatasetPage } from './pages/DatasetPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ModelInfoPage } from './pages/ModelInfoPage';
import { AboutPage } from './pages/AboutPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication */}
          <Route path="/login" element={<LoginPage />} />

          {/* Main Application Routes inside RootLayout */}
          <Route path="/" element={<RootLayout />}>
            <Route index element={<HomePage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="detect" element={<DetectFraudPage />} />
            <Route path="network" element={<NetworkGraphPage />} />
            <Route path="explainable-ai" element={<ExplainableAIPage />} />
            <Route path="continual-learning" element={<ContinualLearningPage />} />
            <Route path="dataset" element={<DatasetPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="architecture" element={<ModelInfoPage />} />
            <Route path="about" element={<AboutPage />} />
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
