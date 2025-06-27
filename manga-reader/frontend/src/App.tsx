import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HubPage from './pages/HubPage';
import SeriesPage from './pages/SeriesPage';
import ReaderPage from './pages/ReaderPage';
import ThemeToggleButton from './components/ThemeToggleButton'; // Importar

const App: React.FC = () => {
  return (
    <Router>
      <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen">
        <Routes>
          <Route path="/" element={<HubPage />} />
          <Route path="/series/:slug" element={<SeriesPage />} />
          <Route path="/series/:slug/chapter/:chapter" element={<ReaderPage />} />
        </Routes>
        <ThemeToggleButton />
      </div>
    </Router>
  );
};

export default App;
