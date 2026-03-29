// Adress: src/pages/
// File: TermsAndPolicy.jsx
// Extension: .jsx

import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpenCheck, ArrowLeft } from 'lucide-react';

const TermsAndPolicy = () => {
    return (
        <>
            <Helmet>
                <title>Termos de Uso e Política de Privacidade - Perfect English</title>
            </Helmet>
            <div className="bg-background min-h-screen">
                <header className="py-4 px-6 lg:px-8 border-b">
                    <Link to="/" className="flex items-center gap-2">
                        <BookOpenCheck className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold text-foreground">Perfect English</span>
                    </Link>
                </header>
                <main className="max-w-4xl mx-auto py-12 px-6 lg:px-8">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <h1 className="text-4xl font-bold text-foreground mb-8">Termos de Uso e Política de Privacidade</h1>
                        
                        <section id="terms" className="mb-12">
                            <h2 className="text-2xl font-semibold text-primary mb-4">Termos de Uso</h2>
                            <div className="space-y-4 text-muted-foreground prose dark:prose-invert">
                                <p><strong>Última atualização:</strong> 15 de outubro de 2025</p>
                                <p>Bem-vindo ao Perfect English! Ao aceder e usar a nossa plataforma, você concorda em cumprir os seguintes termos e condições. Por favor, leia-os com atenção.</p>
                                
                                <h3 className="text-xl font-semibold text-foreground">1. Uso da Plataforma</h3>
                                <p>A sua conta é pessoal e intransferível. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorram na sua conta. O uso da plataforma para fins ilegais ou não autorizados é estritamente proibido.</p>

                                <h3 className="text-xl font-semibold text-foreground">2. Planos e Pagamentos</h3>
                                <p>Oferecemos planos gratuitos e premium (pagos). Os pagamentos para os planos premium são processados através do nosso parceiro, Stripe, e estão sujeitos aos seus termos. As assinaturas são recorrentes e podem ser canceladas a qualquer momento através do seu painel de perfil.</p>
                                
                                <h3 className="text-xl font-semibold text-foreground">3. Propriedade Intelectual</h3>
                                <p>Todo o conteúdo disponível na plataforma, incluindo textos, vídeos, áudios e software, é propriedade exclusiva do Perfect English e está protegido por leis de direitos de autor.</p>
                            </div>
                        </section>

                        <section id="policy" className="mb-12">
                            <h2 className="text-2xl font-semibold text-primary mb-4">Política de Privacidade</h2>
                            <div className="space-y-4 text-muted-foreground prose dark:prose-invert">
                                <p>A sua privacidade é de extrema importância para nós. Esta política descreve como recolhemos, usamos e protegemos as suas informações pessoais.</p>
                                
                                <h3 className="text-xl font-semibold text-foreground">1. Informações que Recolhemos</h3>
                                <p>Recolhemos informações que você nos fornece diretamente, como nome, e-mail e nível de inglês durante o registo. Também recolhemos dados de progresso e uso da plataforma para melhorar a sua experiência de aprendizado.</p>
                                
                                <h3 className="text-xl font-semibold text-foreground">2. Como Usamos as Suas Informações</h3>
                                <p>As suas informações são usadas para personalizar o seu conteúdo de aprendizado, gerir a sua conta, processar pagamentos e comunicar atualizações importantes. Não partilhamos as suas informações pessoais com terceiros para fins de marketing.</p>
                                
                                <h3 className="text-xl font-semibold text-foreground">3. Segurança dos Dados</h3>
                                <p>Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados contra acesso não autorizado, alteração ou destruição. As transações de pagamento são encriptadas usando a tecnologia SSL.</p>
                            </div>
                        </section>
                        
                        <div className="text-center mt-12">
                            <Link to="/">
                                <Button size="lg">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Voltar à Página Principal
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </main>
            </div>
        </>
    );
};

export default TermsAndPolicy;
