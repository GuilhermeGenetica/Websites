import React from 'react';
import { Heart, Mail, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo e Missão */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className="text-xl font-bold">Projeto Fénix</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Das cinzas, a esperança. Conectamos quem precisa de ajuda com quem pode ajudar, 
              reconstruindo Portugal juntos após os incêndios.
            </p>
          </div>

          {/* Links Úteis */}
          <div className="space-y-4">
            <span className="text-lg font-semibold">Como Funciona</span>
            <div className="space-y-2 text-sm text-gray-300">
              <p>1. Registe o seu pedido ou oferta</p>
              <p>2. A nossa equipa valida a informação</p>
              <p>3. Conectamos a ajuda necessária</p>
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <span className="text-lg font-semibold">Contacto</span>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>ajuda@projetofenix.pt</span>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4" />
                <span>+351 800 000 000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
            <span>Feito com</span>
            <Heart className="w-4 h-4 text-red-500" />
            <span>para Portugal</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            © 2024 Projeto Fénix. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;