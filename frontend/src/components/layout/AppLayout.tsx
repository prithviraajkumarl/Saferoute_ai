import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SosEmergencyDrawer } from '../SosEmergencyDrawer';
import { ReportHazardModal } from '../ReportHazardModal';
import { SimulationControlModal } from '../SimulationControlModal';
import { DisasterProtocolsModal } from '../DisasterProtocolsModal';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const { theme } = useTheme();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Modals & Drawers state
  const [showSosDrawer, setShowSosDrawer] = useState(false);
  const [showHazardModal, setShowHazardModal] = useState(false);
  const [showSimModal, setShowSimModal] = useState(false);
  const [showProtocolsModal, setShowProtocolsModal] = useState(false);

  // Global simulation flag
  const [isSimulated, setIsSimulated] = useState(false);

  // Incident state for SOS drawer
  const [activeIncident, setActiveIncident] = useState<any>(null);

  return (
    <div className={`flex h-screen w-screen overflow-hidden ${
      theme === 'dark' ? 'bg-[#080c16] text-slate-100' : 'text-slate-900'
    }`} style={theme !== 'dark' ? { background: 'linear-gradient(135deg, #dbeafe 0%, #e0f2fe 25%, #f0f9ff 50%, #ecfdf5 75%, #f0fdf4 100%)', backgroundAttachment: 'fixed' } : {}}>
      {/* 1. Persistent Left Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
        isSimulated={isSimulated}
      />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header
          onOpenMobile={() => setMobileSidebarOpen(true)}
          onOpenSos={() => setShowSosDrawer(true)}
          onOpenProtocols={() => setShowProtocolsModal(true)}
          onOpenSimulation={() => setShowSimModal(true)}
          isSimulated={isSimulated}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 overflow-y-auto relative custom-scrollbar">
          <Outlet context={{
            onOpenSos: () => setShowSosDrawer(true),
            onOpenReportHazard: () => setShowHazardModal(true),
            onOpenSimulation: () => setShowSimModal(true),
            isSimulated,
          }} />
        </main>
      </div>

      {/* 3. Global Modals and Emergency Drawers */}
      <SosEmergencyDrawer
        isOpen={showSosDrawer}
        onClose={() => setShowSosDrawer(false)}
        activeIncident={activeIncident}
        setActiveIncident={setActiveIncident}
      />

      <ReportHazardModal
        isOpen={showHazardModal}
        onClose={() => setShowHazardModal(false)}
        onHazardAdded={() => {}}
      />

      <SimulationControlModal
        isOpen={showSimModal}
        onClose={() => setShowSimModal(false)}
        isSimulated={isSimulated}
        setIsSimulated={setIsSimulated}
      />

      <DisasterProtocolsModal
        isOpen={showProtocolsModal}
        onClose={() => setShowProtocolsModal(false)}
      />
    </div>
  );
};
