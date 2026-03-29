// src/components/landing/Footer.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import { Dna, Facebook, Twitter, Linkedin, Mail, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-secondary/30 pt-20 pb-12 footer-background">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          
          {/* Logo & Info */}
          <div className="col-span-2 lg:col-span-2 pr-8">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Dna className="w-7 h-7 text-primary" />
              <span className="text-xl font-bold text-foreground">NutraGenius</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs mb-6">
              Personalized, data-driven health analysis for optimal wellness.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-muted-foreground hover:text-primary"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>
          
          {/* Explore */}
          <div>
            <h4 className="font-bold text-lg mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="text-muted-foreground hover:text-foreground">Features</a></li>
              <li><a href="/#how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</a></li>
              <li><a href="/#faq" className="text-muted-foreground hover:text-foreground">FAQ</a></li>
              <li><Link to="/about-us" className="text-muted-foreground hover:text-foreground" onClick={() => window.scrollTo(0, 0)}>About Us</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h4 className="font-bold text-lg mb-4">Legal & Info</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground" onClick={() => window.scrollTo(0, 0)}>Privacy Policy</Link></li>
              <li><Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground" onClick={() => window.scrollTo(0, 0)}>Terms of Service</Link></li>
              <li><Link to="/certifications" className="text-muted-foreground hover:text-foreground" onClick={() => window.scrollTo(0, 0)}>Security & Certifications</Link></li>
            </ul>
          </div>
          
          {/* Support */}

          <div>
            <h4 className="font-bold text-lg mb-4">Support</h4>
            <ul className="space-y-2 text-sm">

              {/* UPDATED: Contact Us com ícone */}
              <li>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-foreground flex items-start space-x-2"
                >
                  <Mail className="w-4 h-4 mt-1 flex-shrink-0" />
                  <span>Contact Us</span>
                </Link>
              </li>
              
              <li>
                {/* Usei to="/locations" como exemplo. 
                  Se for um link externo (ex: Google Maps), use <a> em vez de <Link>
                  ex: <a href="https://maps.google.com/..." target="_blank" rel="noopener noreferrer" className="...">
                */}
                <Link 
                  to="/about-us" // Atualize este link conforme necessário
                  className="text-muted-foreground hover:text-foreground"
                >
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                    <span>Global Services 🌐</span>
                  </div>
                </Link>
              </li>

            </ul>
          </div>


        </div>
        
        {/* ============== INÍCIO DO BLOCO ADICIONADO (Copyright Atualizado) ============== */}

        <div className="mt-12 pt-8 pb-8 border-t text-center text-sm text-muted-foreground">
          <p>
            <a 
              href={process.env.VITE_APP_URL || "https://nutragenius.app"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              NutraGenius Global
            </a> a <a 
              href={process.env.VITE_APP_URL_HOLDING || "https://holdingcomp.com"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              HoldingComp
            </a> Company. 
            <br />
            Created by <a 
              href={process.env.VITE_APP_URL_WEBMASTER || "https://onenetweb.com"} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-primary"
            >
              OnNetWeb
            </a>. All Rights Reserved.
            <a href="/admin/login" className="hover:text-primary ml-2">
              Admin Access
            </a>
          </p>
        </div>
        {/* ============== FIM DO BLOCO ADICIONADO ============== */}

      </div>
    </footer>
  );
};

export default Footer;