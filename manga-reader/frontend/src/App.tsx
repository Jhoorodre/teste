import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HubPage from './pages/HubPage';
import SeriesPage from './pages/SeriesPage';
import ReaderPage from './pages/ReaderPage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HubPage />} />
        <Route path="/series/:slug" element={<SeriesPage />} />
        <Route path="/series/:slug/chapter/:chapter" element={<ReaderPage />} />
      </Routes>
    </Router>
  );
};

export default App;
