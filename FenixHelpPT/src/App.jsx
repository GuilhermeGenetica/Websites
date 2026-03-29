import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { DataProvider } from '@/contexts/DataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import HelpRequestPage from '@/pages/HelpRequestPage';
import OfferHelpPage from '@/pages/OfferHelpPage';
import HelpBoardPage from '@/pages/HelpBoardPage';
import ValidatorPage from '@/pages/ValidatorPage';
import MapPage from '@/pages/MapPage';
import AdminPage from '@/pages/AdminPage';
import DonatePage from '@/pages/DonatePage';
import RegisterPage from '@/pages/RegisterPage';
import ActionsPage from '@/pages/ActionsPage';
import CreateActionPage from '@/pages/CreateActionPage';
import BlogPage from '@/pages/BlogPage';

function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <Router>
          <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/preciso-ajuda" element={<HelpRequestPage />} />
                <Route path="/quero-ajudar" element={<OfferHelpPage />} />
                <Route path="/mural" element={<HelpBoardPage />} />
                <Route path="/acoes" element={<ActionsPage />} />
                <Route path="/criar-acao" element={<CreateActionPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/validador" element={<ValidatorPage />} />
                <Route path="/mapa" element={<MapPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/doar" element={<DonatePage />} />
                <Route path="/registar" element={<RegisterPage />} />
              </Routes>
            </main>
            <Footer />
            <Toaster />
          </div>
        </Router>
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
