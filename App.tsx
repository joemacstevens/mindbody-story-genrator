import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import RenderPage from './pages/RenderPage';
import IngestPage from './pages/IngestPage';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/render" element={<RenderPage />} />
        <Route path="/ingest" element={<IngestPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;