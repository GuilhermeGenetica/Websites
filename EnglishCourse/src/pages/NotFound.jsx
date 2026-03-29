import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet-async';

const NotFound = () => {
  return (
    <>
      <Helmet>
        <title>Página não encontrada (404)</title>
      </Helmet>
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="flex flex-col items-center space-y-6"
        >
          <AlertTriangle className="w-24 h-24 text-destructive" />
          <h1 className="text-6xl font-extrabold text-foreground">404</h1>
          <h2 className="text-2xl font-semibold text-muted-foreground">Página não encontrada</h2>
          <p className="max-w-md text-foreground">
            Desculpe, a página que você está procurando não existe ou foi movida.
          </p>
          <Button asChild size="lg">
            <Link to="/">
              <Home className="mr-2 h-5 w-5" />
              Voltar para o início
            </Link>
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default NotFound;