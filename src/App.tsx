import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardV2 from './pages/DashboardV2';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard-v2" replace />} />
      <Route path="/dashboard-v2" element={<DashboardV2 />} />
      <Route path="*" element={<Navigate to="/dashboard-v2" replace />} />
    </Routes>
  );
}

export default App;