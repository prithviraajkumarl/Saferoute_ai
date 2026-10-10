import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { StartPage } from './pages/StartPage';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { SettingsPage } from './pages/SettingsPage';
import { OverviewPage } from './pages/OverviewPage';
import { NavigationPage } from './pages/NavigationPage';
import { WeatherPage } from './pages/WeatherPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResponsePage } from './pages/ResponsePage';
import { ReliefCentersPage } from './pages/ReliefCentersPage';
import { ChatbotWidget } from './components/ChatbotWidget';

// Context bridges to cleanly bind layout modal actions to route pages
const OverviewRoute: React.FC = () => {
  const ctx = useOutletContext<any>();
  return (
    <OverviewPage
      onOpenSos={ctx.onOpenSos}
      onOpenReportHazard={ctx.onOpenReportHazard}
      onOpenSimulation={ctx.onOpenSimulation}
      isSimulated={ctx.isSimulated}
    />
  );
};

const NavigationRoute: React.FC = () => {
  const ctx = useOutletContext<any>();
  return <NavigationPage isSimulated={ctx.isSimulated} />;
};

const IncidentsRoute: React.FC = () => {
  const ctx = useOutletContext<any>();
  return (
    <IncidentsPage
      onOpenReportHazard={ctx.onOpenReportHazard}
      isSimulated={ctx.isSimulated}
    />
  );
};

const ResponseRoute: React.FC = () => {
  const ctx = useOutletContext<any>();
  return (
    <ResponsePage
      onOpenSosModal={ctx.onOpenSos}
      isSimulated={ctx.isSimulated}
    />
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Start page with Team Wired in, Travel Tech, and 3 role selection cards */}
        <Route path="/" element={<StartPage />} />
        <Route path="/weather-hub" element={<LandingPage />} />
        <Route path="/onboard" element={<OnboardingPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* Dashboard layout pages (sidebar + header) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<OverviewRoute />} />
          <Route path="navigation" element={<NavigationRoute />} />
          <Route path="incidents" element={<Navigate to="/app/relief-centers" replace />} />
          <Route path="response" element={<ResponseRoute />} />
          <Route path="relief-centers" element={<ReliefCentersPage />} />
          <Route path="system" element={<Navigate to="/app/dashboard" replace />} />
        </Route>

        {/* Legacy routes → redirect to new /app prefix */}
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/navigation" element={<Navigate to="/app/navigation" replace />} />
        <Route path="/weather" element={<Navigate to="/app/navigation" replace />} />
        <Route path="/incidents" element={<Navigate to="/app/relief-centers" replace />} />
        <Route path="/response" element={<Navigate to="/app/response" replace />} />
        <Route path="/relief-centers" element={<Navigate to="/app/relief-centers" replace />} />
        <Route path="/system" element={<Navigate to="/app/dashboard" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Global floating chatbot */}
      <ChatbotWidget />
    </BrowserRouter>
  );
};
