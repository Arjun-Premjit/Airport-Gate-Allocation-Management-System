import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DashboardLayout } from './layouts/DashboardLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { AllocationsPage } from './pages/AllocationsPage';
import { TimelinePage } from './pages/TimelinePage';
import { GatesPage } from './pages/GatesPage';
import { FlightsPage } from './pages/FlightsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { 
  TerminalsPage, 
  AirlinesPage, 
  AircraftPage, 
  EmployeesPage, 
  AirportPage 
} from './pages/SupportingPages';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Editorial Landing Page */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/console" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dispatch Operations Console */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/allocations" element={<AllocationsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/gates" element={<GatesPage />} />
            <Route path="/flights" element={<FlightsPage />} />
            <Route path="/maintenance" element={<MaintenancePage />} />
            <Route path="/terminals" element={<TerminalsPage />} />
            <Route path="/airlines" element={<AirlinesPage />} />
            <Route path="/aircraft" element={<AircraftPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/airport" element={<AirportPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
