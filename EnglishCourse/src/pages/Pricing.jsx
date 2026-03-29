// Adress: src/pages/
// File: Pricing.jsx
// Extension: .jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Check, Crown, Star, Zap, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

// --- START: Configuration ---
const STRIPE_PUBLIC_KEY = import.meta.env.VITE_STRIPE_PUBLIC_KEY || '';
const PHP_CHECKOUT_API_URL = (import.meta.env.VITE_API_BASE_URL || '') + '/create_stripe_checkout.php';
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);
// --- END: Configuration ---

const Pricing = () => {
  const { toast } = useToast();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  const [currency, setCurrency] = useState('BRL');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const currencies = {
    BRL: { symbol: 'R$', monthly: '10,90', 'semi-annual': '58,90', annual: '112,90' },
    USD: { symbol: '$', monthly: '1.99', 'semi-annual': '10.99', annual: '20.99' },
    EUR: { symbol: '€', monthly: '1.70', 'semi-annual': '9.40', annual: '18.00' }
  };

  const plans = [
    {
      name: "Gratuito",
      price: "0",
      description: "Perfeito para começar a sua jornada e conhecer o método.",
      features: ["3 frases diárias com áudio", "Acesso aos primeiros 7 dias do cronograma", "Acompanhamento de progresso básico", "Gamificação com XP e streaks"],
      cta: "Seu Plano Atual",
      current: user?.plan !== 'premium' || !user.is_active,
      isPremium: false,
    },
    {
      name: "Premium",
      priceKey: 'monthly',
      description: "A experiência completa para alcançar a fluência.",
      features: ["Todos os benefícios do plano Gratuito", "Acesso ilimitado a todos os níveis (A1-C1)", "Histórico completo e frases favoritas", "Suporte prioritário da nossa equipa", "Relatórios de progresso em PDF"],
      cta: "Fazer Upgrade Agora",
      popular: true,
      current: user?.plan === 'premium' && user.is_active,
      isPremium: true,
    }
  ];

  const longTermPlans = [
    { name: 'Mensal', priceKey: 'monthly', discount: null, period: 'mês' },
    { name: 'Semestral', priceKey: 'semi-annual', discount: 'Economize 10%', period: '6 meses' }, // priceKey 'semi-annual' (com hífen) está correto
    { name: 'Anual', priceKey: 'annual', discount: 'Economize 20%', period: 'ano' }
  ];

  const handlePayment = async (planDetails) => {
    setIsProcessingPayment(true);
    try {
      // --- INÍCIO DA CORREÇÃO: Lógica de redirecionamento atualizada ---
      // Não precisamos mais do `stripe` aqui, apenas para carregar.
      // const stripe = await stripePromise; 
      const response = await fetch(PHP_CHECKOUT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planKey: planDetails.priceKey, // Envia 'semi-annual' (com hífen)
          currency: currency,
          userEmail: user?.email,
          userId: user?.id,
          planName: planDetails.name,
        }),
      });

      const session = await response.json();

      // Verificamos se a resposta do backend foi bem-sucedida e se contém a URL
      if (session.success && session.url) {
        // Redirecionamos o utilizador diretamente para a página de pagamento do Stripe
        window.location.href = session.url;
      } else {
        // Se o backend retornou um erro (como a chave em falta), mostramos esse erro
        throw new Error(session.error || "Não foi possível criar a sessão de checkout.");
      }
      // --- FIM DA CORREÇÃO ---
    } catch (error) {
      toast({ title: "❌ Erro ao Iniciar Pagamento", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <>
      <Helmet><title>Planos e Preços - Perfect English</title></Helmet>
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
                <h1 className="text-4xl lg:text-5xl font-extrabold text-foreground mb-4">Planos Flexíveis para a Sua Fluência</h1>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">Comece gratuitamente e faça o upgrade para o Premium para desbloquear todo o seu potencial.</p>
                <div className="inline-flex items-center bg-muted p-1 rounded-full mt-8">
                    {Object.keys(currencies).map((curr) => (
                        <Button key={curr} variant={currency === curr ? "default" : "ghost"} size="sm" onClick={() => setCurrency(curr)} className="rounded-full">{curr}</Button>
                    ))}
                </div>
            </motion.div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
                {plans.map((plan, index) => (
                    <motion.div key={index} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}>
                        <Card className={`h-full relative flex flex-col card-border-gradient ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
                            {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold flex items-center gap-1"><Crown className="w-4 h-4" />Mais Popular</div>}
                            <CardHeader className="text-center pb-4 pt-10">
                                <CardTitle className="text-3xl font-bold mb-2">{plan.name}</CardTitle>
                                <div className="text-5xl font-bold text-foreground my-4">
                                    {plan.isPremium ? <>{currencies[currency].symbol}{currencies[currency].monthly}<span className="text-lg text-muted-foreground">/mês</span></> : `${currencies[currency].symbol}0`}
                                </div>
                                <CardDescription className="h-12">{plan.description}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex flex-col flex-grow p-8">
                                <ul className="space-y-4 flex-grow mb-8">
                                    {plan.features.map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3"><Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" /> <span className="text-muted-foreground">{feature}</span></li>
                                    ))}
                                </ul>
                                {plan.isPremium ? (
                                    <Button onClick={() => handlePayment({name: 'Premium Mensal', priceKey: 'monthly'})} disabled={plan.current || isProcessingPayment} size="lg" className="w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90">
                                        {isProcessingPayment ? <Loader2 className="animate-spin" /> : plan.current ? <><Star className="w-5 h-5 mr-2"/>Seu Plano Atual</> : <><Zap className="w-5 h-5 mr-2"/>{plan.cta}</>}
                                    </Button>
                                ) : (
                                    <Button disabled size="lg" className="w-full text-lg py-6"><Star className="w-5 h-5 mr-2"/>{plan.cta}</Button>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}>
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl font-bold">Economize com Planos de Longo Prazo</CardTitle>
                        <CardDescription>Escolha um plano estendido e pague menos para ter acesso ilimitado.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-3 gap-6">
                        {longTermPlans.map((plan, index) => (
                            <div key={index} className={`text-center p-6 border rounded-lg flex flex-col justify-between transition-all ${plan.discount ? 'bg-primary/5 dark:bg-primary/10 border-primary/20' : ''}`}>
                                <div>
                                    {plan.discount && <div className="text-xs text-primary-foreground bg-primary px-3 py-1 rounded-full mb-3 inline-block font-semibold">{plan.discount}</div>}
                                    <h4 className="text-2xl font-bold mb-2">{plan.name}</h4>
                                    <div className="text-3xl font-bold text-foreground mb-1">{currencies[currency].symbol}{currencies[currency][plan.priceKey]}</div>
                                    <p className="text-sm text-muted-foreground">Pagamento único por {plan.period}</p>
                                </div>
                                <Button onClick={() => handlePayment({name: `Premium ${plan.name}`, priceKey: plan.priceKey})} disabled={isProcessingPayment} size="lg" className="w-full mt-6">
                                    {isProcessingPayment ? <Loader2 className="animate-spin" /> : 'Assinar Agora'}
                                </Button>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </motion.div>
        </main>
      </div>
    </>
  );
};

export default Pricing;