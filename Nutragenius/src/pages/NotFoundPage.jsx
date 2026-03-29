import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <Helmet>
        <title>404 - Page Not Found</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md"
        >
          <AlertTriangle className="mx-auto h-16 w-16 text-destructive mb-4" />
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <h2 className="mt-4 text-2xl font-semibold text-foreground">Page Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
          <Button onClick={() => navigate('/')} className="mt-8 gold-bg">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back Home
          </Button>
        </motion.div>
      </div>
    </>
  );
};

export default NotFoundPage;