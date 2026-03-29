// File: src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
// [NEW] Import the BrowserRouter
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// [UPDATE] Wrap the <App /> component with <BrowserRouter>
// This enables routing for the entire application.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);