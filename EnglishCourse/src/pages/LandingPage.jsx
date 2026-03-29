// Adress: src/pages/
// File: LandingPage.jsx
// Extension: .jsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  Play, Star, Users, Trophy, Globe, BookOpenCheck, LogIn, Mail, Lock, User, CheckCircle, XCircle, ChevronRight,
  Heart, Linkedin, Instagram, Quote, ShieldCheck, LifeBuoy, Target, Lightbulb, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const API_BASE_URL = 'https://perfectenglish.onnetweb.com/api';

// --- Reusable Animation Variants ---
const sectionVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};
const itemVariant = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

// --- Reusable Scroll-to-Section Function ---
const scrollToSection = (id) => {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};


// --- Header Component ---
const Header = () => (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <nav className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
            <a href="#" className="flex items-center gap-2">
                <BookOpenCheck className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold text-foreground">Perfect English</span>
            </a>
            <div className="hidden md:flex items-center gap-8 font-medium">
                <a href="#solution" onClick={(e) => { e.preventDefault(); scrollToSection('solution'); }} className="hover:text-primary transition-colors">O Método</a>
                <a href="#benefits" onClick={(e) => { e.preventDefault(); scrollToSection('benefits'); }} className="hover:text-primary transition-colors">Benefícios</a>
                <a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }} className="hover:text-primary transition-colors">Depoimentos</a>
                <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }} className="hover:text-primary transition-colors">Planos</a>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => scrollToSection('login-section')}>
                    Login
                </Button>
                <Button onClick={() => scrollToSection('login-section')} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Começar Agora
                </Button>
                <ThemeToggle />
            </div>
        </nav>
    </header>
);

// --- Hero Section ---
const HeroSection = () => (
    <motion.section 
        className="relative min-h-[80vh] flex items-center bg-hero-gradient-light dark:bg-hero-gradient-dark"
        variants={sectionVariant} initial="hidden" animate="visible"
    >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
            <div className="text-center md:text-left">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground tracking-tight">
                    A fluência em inglês não é um sonho.
                    <span className="block text-primary text-glow-gold mt-2">É o seu próximo passo.</span>
                </h1>
                <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto md:mx-0">
                    Descubra o nosso método exclusivo que transforma a sua dedicação em confiança para comunicar, um dia de cada vez.
                </p>
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                    <Button size="lg" className="w-full sm:w-auto text-lg px-8 py-7 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg ring-glow-gold" onClick={() => scrollToSection('login-section')}>
                        Comece a falar hoje <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                </div>
            </div>
             <div className="hidden md:block">
                 <motion.div 
                    className="relative"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
                >
                    <div className="aspect-square rounded-full bg-primary/10 absolute -inset-8 animate-pulse"></div>
                    <img src="https://placehold.co/600x600/172554/FFFFFF?text=Learner" alt="Aluna de inglês sorrindo com confiança" className="rounded-full shadow-2xl relative z-10" />
                </motion.div>
            </div>
        </div>
    </motion.section>
);

// --- Problem & Solution Section ---
const ProblemSolutionSection = () => (
    <motion.section id="solution" className="py-20" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <div className="max-w-5xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Cansado de métodos que não funcionam?</h2>
            <p className="mt-4 text-lg text-muted-foreground">Muitos cursos focam apenas na gramática e deixam você perdido na hora de falar. Você estuda, estuda, mas a confiança não vem.</p>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 mt-16 grid md:grid-cols-3 gap-8 text-center">
            <motion.div variants={itemVariant} className="p-6 rounded-lg">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-foreground">O Problema: Falta de Prática</h3>
                <p className="text-muted-foreground mt-2">Aulas teóricas sem aplicação real criam uma barreira entre você e a conversação.</p>
            </motion.div>
            <motion.div variants={itemVariant} className="p-6 rounded-lg bg-primary/5 border-2 border-primary/20 scale-105">
                 <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                    <Lightbulb className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">A Solução: Método Imersivo</h3>
                <p className="text-muted-foreground mt-2">Nosso cronograma diário foca em atividades práticas de <i className="font-semibold">listening, speaking, reading e writing</i> para desenvolver a sua fluência de forma natural.</p>
            </motion.div>
             <motion.div variants={itemVariant} className="p-6 rounded-lg">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="font-semibold text-foreground">O Problema: Desmotivação</h3>
                <p className="text-muted-foreground mt-2">Sem um caminho claro, é fácil perder o foco e abandonar os estudos no meio do caminho.</p>
            </motion.div>
        </div>
    </motion.section>
);


// --- Benefits Section ---
const BenefitsSection = () => {
    const benefits = [
        { icon: Target, title: "Clareza e Direção", text: "Siga um cronograma de 30 dias por nível, desenhado por especialistas para resultados visíveis." },
        { icon: TrendingUp, title: "Aprendizado Acelerado", text: "Com a nossa gamificação, você ganha pontos, sobe de nível e mantém-se motivado todos os dias." },
        { icon: Globe, title: "Confiança para Falar", text: "Pratique com frases diárias, áudios de nativos e prepare-se para conversas do mundo real." },
        { icon: LifeBuoy, title: "Suporte Contínuo", text: "A nossa equipa de tutores está pronta para tirar as suas dúvidas e guiar o seu aprendizado." },
    ];
    return (
        <motion.section id="benefits" className="py-20 bg-card" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold text-foreground">Vá além da gramática. <span className="text-primary">Conquiste a comunicação.</span></h2>
                    <p className="mt-4 text-lg text-muted-foreground">Aqui, cada lição é um passo em direção à sua transformação pessoal e profissional.</p>
                </div>
                <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-10">
                    {benefits.map((item, index) => (
                        <motion.div key={index} className="text-center" variants={itemVariant}>
                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                                <item.icon className="w-8 h-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
                            <p className="mt-2 text-muted-foreground">{item.text}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

// --- Social Proof Section ---
const SocialProofSection = () => {
    const testimonials = [
        { name: "Joana Silva", role: "Analista de Marketing", text: "Finalmente encontrei um método que me mantém motivada! Em um mês, minha confiança para participar de reuniões em inglês aumentou absurdamente.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d" },
        { name: "Pedro Costa", role: "Desenvolvedor de Software", text: "A plataforma é incrível e o cronograma é perfeito para quem tem uma rotina corrida. Recomendo para qualquer pessoa que queira destravar o inglês.", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026705d" },
        { name: "Mariana Almeida", role: "Estudante Universitária", text: "O sistema de gamificação tornou o aprendizado divertido. Sinto que estou a progredir todos os dias, e os resultados são reais!", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026706d" },
    ];
    return (
        <motion.section id="testimonials" className="py-20" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
                 <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-4xl font-bold text-foreground">Junte-se a mais de <span className="text-primary">5.000 alunos</span> satisfeitos</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Veja o que os nossos alunos estão a dizer sobre a sua jornada de aprendizado.</p>
                </div>
                <div className="mt-16 grid lg:grid-cols-3 gap-8">
                    {testimonials.map((item, i) => (
                        <motion.div key={i} variants={itemVariant}>
                            <Card className="h-full flex flex-col">
                                <CardContent className="p-6 flex-grow">
                                    <Quote className="w-8 h-8 text-primary/30 mb-4" />
                                    <p className="text-muted-foreground italic">"{item.text}"</p>
                                </CardContent>
                                <CardHeader className="flex-row items-center gap-4 pt-4">
                                    <Avatar><AvatarImage src={item.avatar} alt={item.name} /><AvatarFallback>{item.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div>
                                        <CardTitle className="text-base">{item.name}</CardTitle>
                                        <CardDescription>{item.role}</CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.section>
    );
};

// --- Guarantee Section ---
const GuaranteeSection = () => (
    <motion.section id="guarantee" className="py-20 bg-card" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
            <Card className="bg-primary/5 border-primary/20 text-center p-8 md:p-12">
                <ShieldCheck className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-foreground">Sua Satisfação é a Nossa Prioridade</h2>
                <p className="text-muted-foreground mt-4 text-lg">Estamos tão confiantes no nosso método que oferecemos uma garantia de satisfação de 7 dias. Se por qualquer motivo você não estiver satisfeito com o plano Premium, nós devolvemos o seu dinheiro. Sem perguntas.</p>
                <Button size="lg" className="mt-8" onClick={() => scrollToSection('pricing')}>Ver Planos e Preços</Button>
            </Card>
        </div>
    </motion.section>
);


// --- FAQ Section ---
const FAQSection = () => {
    const faqs = [
        { q: "Quanto tempo leva para me tornar fluente?", a: "A fluência varia para cada pessoa, mas nosso método é desenhado para avançar um nível do CEFR (A1, A2, etc.) a cada 30-60 dias de estudo consistente. Com dedicação, você verá um progresso significativo em poucos meses." },
        { q: "Preciso de algum conhecimento prévio?", a: "Não! O nosso curso cobre desde o nível A1 (iniciante absoluto) até o C1 (avançado). Ao se registrar, você seleciona o seu nível atual para começar no ponto certo da sua jornada." },
        { q: "Como funciona o suporte?", a: "Alunos do plano Premium têm acesso a suporte prioritário via chat e email para tirar dúvidas sobre o conteúdo e a plataforma. A nossa equipa de tutores está sempre pronta para ajudar." },
        { q: "Posso cancelar a minha assinatura a qualquer momento?", a: "Sim. Você pode gerenciar ou cancelar a sua assinatura Premium a qualquer momento através do seu painel de perfil. O acesso permanecerá ativo até o final do período já pago." }
    ];
    return (
        <motion.section id="faq" className="py-20" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-foreground">Perguntas Frequentes</h2>
                    <p className="mt-4 text-lg text-muted-foreground">Tudo o que você precisa saber para começar com confiança.</p>
                </div>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, i) => (
                        <AccordionItem key={i} value={`item-${i}`}>
                            <AccordionTrigger className="text-lg text-left">{faq.q}</AccordionTrigger>
                            <AccordionContent className="text-base text-muted-foreground">{faq.a}</AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </motion.section>
    );
};


// --- Login/Register Section ---
const LoginRegisterSection = () => {
    const { login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('register');
    const [isLoading, setIsLoading] = useState(false);

    // Registration State
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerLevel, setRegisterLevel] = useState('A1');

    // Login State
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/register.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: registerName, email: registerEmail, password: registerPassword, level: registerLevel }),
            });
            const data = await response.json();
            if (data.success) {
                toast({
                    title: "Sucesso!", description: "Conta criada com sucesso! Faça login para começar.",
                    action: <CheckCircle className="text-green-500" />,
                });
                setActiveTab('login');
                setLoginEmail(registerEmail); // Pre-fill email for user convenience
                setLoginPassword('');
            } else {
                throw new Error(data.message || "Não foi possível registrar o usuário.");
            }
        } catch (error) {
            toast({ title: "Erro no Registo", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/login.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: loginEmail, password: loginPassword }),
            });
            const data = await response.json();
            if (data.success && data.user && data.token) {
                // The login function now only updates the context state
                login(data.user, data.token);
                toast({ title: "Login bem-sucedido!", description: "A redirecionar para o seu painel...", action: <CheckCircle className="text-green-500" /> });
                // The navigation happens here, after the context state is set
                navigate('/dashboard');
            } else {
                throw new Error(data.message || "Credenciais inválidas.");
            }
        } catch (error) {
            toast({ title: "Erro no Login", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.section id="login-section" className="py-20 bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-slate-800 dark:to-gray-900" variants={sectionVariant} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="max-w-md mx-auto px-4">
                <Card>
                    <CardHeader className="text-center">
                        <BookOpenCheck className="w-12 h-12 mx-auto mb-4 text-primary" />
                        <CardTitle className="text-3xl">Comece a sua jornada agora</CardTitle>
                        <CardDescription>Crie a sua conta gratuita ou faça login para continuar.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="register">Cadastrar</TabsTrigger>
                                <TabsTrigger value="login">Entrar</TabsTrigger>
                            </TabsList>
                            <TabsContent value="register" className="mt-6">
                                <form onSubmit={handleRegister} className="space-y-4">
                                     <div><Label htmlFor="name-reg">Nome</Label><Input id="name-reg" value={registerName} onChange={(e) => setRegisterName(e.target.value)} required /></div>
                                     <div><Label htmlFor="email-reg">Email</Label><Input id="email-reg" type="email" value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} required /></div>
                                     <div><Label htmlFor="password-reg">Senha</Label><Input id="password-reg" type="password" minLength="8" value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} required /></div>
                                     <div><Label htmlFor="level-reg">Qual o seu nível de inglês?</Label>
                                        <Select value={registerLevel} onValueChange={setRegisterLevel}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="A1">A1 - Iniciante</SelectItem>
                                                <SelectItem value="A2">A2 - Básico</SelectItem>
                                                <SelectItem value="B1">B1 - Intermediário</SelectItem>
                                                <SelectItem value="B2">B2 - Intermediário-Avançado</SelectItem>
                                                <SelectItem value="C1">C1 - Avançado</SelectItem>
                                                <SelectItem value="C2">C2 - Proficiente</SelectItem>                                
                                            </SelectContent>
                                        </Select>
                                     </div>
                                     <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading ? 'A criar conta...' : 'Criar Conta Gratuita'}</Button>
                                </form>
                            </TabsContent>
                            <TabsContent value="login" className="mt-6">
                                <form onSubmit={handleLogin} className="space-y-4">
                                    <div><Label htmlFor="email-login">Email</Label><Input id="email-login" type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required /></div>
                                    <div><Label htmlFor="password-login">Senha</Label><Input id="password-login" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required /></div>
                                    <div className="text-right"><Link to="/request-password-reset" className="text-sm text-primary hover:underline">Esqueceu a sua senha?</Link></div>
                                    <Button type="submit" size="lg" className="w-full" disabled={isLoading}>{isLoading ? 'A entrar...' : 'Entrar na Minha Conta'}</Button>
                                </form>
                            </TabsContent>
                         </Tabs>
                    </CardContent>
                </Card>
            </div>
        </motion.section>
    );
};

// --- Footer Component ---
const Footer = () => (
    <footer className="bg-card border-t">
        <div className="max-w-7xl mx-auto py-12 px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpenCheck className="w-8 h-8 text-primary" />
                        <span className="text-2xl font-bold text-foreground">Perfect English</span>
                    </div>
                    <p className="text-muted-foreground">A sua jornada para a fluência começa aqui.</p>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Navegação</h3>
                    <ul className="mt-4 space-y-2">
                         <li><a href="#solution" onClick={(e) => { e.preventDefault(); scrollToSection('solution'); }} className="text-muted-foreground hover:text-primary">O Método</a></li>
                         <li><a href="#benefits" onClick={(e) => { e.preventDefault(); scrollToSection('benefits'); }} className="text-muted-foreground hover:text-primary">Benefícios</a></li>
                         <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); scrollToSection('testimonials'); }} className="text-muted-foreground hover:text-primary">Depoimentos</a></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Legal</h3>
                    <ul className="mt-4 space-y-2">
                        <li><Link to="/policy" className="text-muted-foreground hover:text-primary">Política de Privacidade</Link></li>
                        <li><Link to="/policy" className="text-muted-foreground hover:text-primary">Termos de Uso</Link></li>
                        <li><Link to="/admin-login" className="text-muted-foreground hover:text-primary">Acesso de Administrador</Link></li>
                    </ul>
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">Siga-nos</h3>
                    <div className="flex mt-4 space-x-4">
                        <a href="#" className="text-muted-foreground hover:text-primary"><Instagram /></a>
                        <a href="#" className="text-muted-foreground hover:text-primary"><Linkedin /></a>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Perfect English. Todos os direitos reservados. CNPJ: XX.XXX.XXX/0001-XX</p>
            </div>
        </div>
    </footer>
);


const LandingPage = () => {
  return (
    <>
      <Helmet>
        <title>Perfect English - A sua fluência começa aqui</title>
        <meta name="description" content="Descubra um método exclusivo para aprender inglês com um cronograma estruturado, aulas gamificadas e suporte personalizado. Comece a sua jornada para a fluência hoje mesmo." />
      </Helmet>
      <div className="bg-background">
        <Header />
        <main>
          <HeroSection />
          <ProblemSolutionSection />
          <BenefitsSection />
          <SocialProofSection />
          <GuaranteeSection />
          <FAQSection />
          <LoginRegisterSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default LandingPage;
