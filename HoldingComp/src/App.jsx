// File: src/App.jsx
import React, { useState, useEffect } from 'react';
// [NEW] Import components from react-router-dom
import { Routes, Route } from 'react-router-dom';

// Main App Components
import Navbar from './components/Navbar.jsx';
import MainPage from './pages/index.jsx'; 

// [NEW] Import the standalone page content
import TermsOfServiceContent from './pages/TermsOfService.jsx';
import PrivacyPolicyContent from './pages/PrivacyPolicy.jsx';

// [NEW] A simple wrapper for the standalone legal pages
// This will provide basic styling and apply the theme.
// It also includes a <style> tag to ensure it works as a standalone component.
const LegalPageWrapper = ({ children, title }) => (
  <div className="standalone-legal-page">
    <style>
      {`
        /* Simple styling for standalone pages.
          It uses the CSS variables from your index.css for theme compatibility.
        */
        .standalone-legal-page {
          background-color: var(--bg-color-dark);
          color: var(--text-color-dark);
          min-height: 100vh;
          padding: 20px;
        }
        
        body.light-theme .standalone-legal-page {
          background-color: var(--bg-color-light);
          color: var(--text-color-light);
        }
        
        /* We wrap the content in a container to match the site's max-width 
          and apply the same text styling from the popups.
        */
        .standalone-legal-page .content-container {
          max-width: 900px;
          margin: 40px auto;
          padding: 30px;
          border-radius: 10px;
          background-color: var(--accent-dark); /* Using accent for contrast */
          box-shadow: 0 4px 15px var(--halo-dark);
        }
        
        body.light-theme .standalone-legal-page .content-container {
           background-color: var(--accent-light);
           box-shadow: 0 4px 15px var(--halo-light);
        }
        
        /* Ensure the imported content styles apply */
        .standalone-legal-page .terms-content-wrapper {
          /* The content component already has this class */
        }
        
        /* Simple Back Link */
        .standalone-legal-page .back-link {
          display: inline-block;
          padding: 10px 15px;
          margin-bottom: 20px;
          color: var(--text-color-dark);
          background-color: var(--accent-dark);
          border-radius: 5px;
          text-decoration: none;
          font-weight: 500;
          box-shadow: 0 2px 5px var(--halo-dark);
        }
        
        body.light-theme .standalone-legal-page .back-link {
           color: var(--text-color-light);
           background-color: var(--accent-light);
           box-shadow: 0 2px 5px var(--halo-light);
        }
      `}
    </style>
    <a href="/" className="back-link">&larr; Back to HoldingComp Home</a>
    <div className="content-container">
      <div className="terms-content-wrapper">
        {children}
      </div>
    </div>
  </div>
);


// [NEW] This component will wrap the main part of your app
// to separate it from the new legal page routes
const MainAppLayout = ({ theme, onToggleTheme }) => (
  <>
    <Navbar onToggleTheme={onToggleTheme} theme={theme} />
    <MainPage theme={theme} />
  </>
);

function App() {
  // Theme logic (Dark/Light Mode)
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  };

  // This Effect Hook updates the <body> to apply global styles
  useEffect(() => {
    document.body.className = ''; // Clear previous classes
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    }
  }, [theme]);
  
  // [NEW] Use <Routes> to define the application's pages
  return (
    <div className="App">
      <Routes>
        {/* Route 1: The Main Application (at "/") */}
        <Route 
          path="/" 
          element={<MainAppLayout theme={theme} onToggleTheme={toggleTheme} />} 
        />
        
        {/* Route 2: The Terms of Service Page (at "/terms") */}
        <Route 
          path="/terms" 
          element={
            <LegalPageWrapper title="Terms of Service">
              <TermsOfServiceContent />
            </LegalPageWrapper>
          } 
        />
        
        {/* Route 3: The Privacy Policy Page (at "/privacy") */}
        <Route 
          path="/privacy" 
          element={
            <LegalPageWrapper title="Privacy Policy">
              <PrivacyPolicyContent />
            </LegalPageWrapper>
          } 
        />
        
        {/* Optional: A "catch-all" route for 404s can be added here if needed */}
        {/* <Route path="*" element={<NotFoundComponent />} /> */}
      </Routes>
    </div>
  );
}

export default App;