import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { OverviewPage } from './pages/OverviewPage';
import { NavigationPage } from './pages/NavigationPage';
import { WeatherPage } from './pages/WeatherPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { ResponsePage } from './pages/ResponsePage';
import { ReliefCentersPage } from './pages/ReliefCentersPage';
import { SystemStatusPage } from './pages/SystemStatusPage';

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
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<OverviewRoute />} />
          <Route path="navigation" element={<NavigationRoute />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="incidents" element={<IncidentsRoute />} />
          <Route path="response" element={<ResponseRoute />} />
          <Route path="relief-centers" element={<ReliefCentersPage />} />
          <Route path="system" element={<SystemStatusPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};
