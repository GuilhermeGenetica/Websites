// src/lib/translations.js
import { Microscope, Dna, HeartPulse, Brain, Baby, Shield, Pill, TestTube, Users, Activity } from 'lucide-react';

export const translations = {
  en: {
    nav: {
      about: "About",
      publications: "Publications",
      platform: "Platform",
      faq: "FAQs",
      contact: "Contact",
      blog: "GuideLines",
      login: "Workbench"
    },
    hero: {
      role: "Clinical Geneticist | Medical Generalist | Researcher",
      bio: "Specialist in Medical Genetics focused on the etiological diagnosis of hereditary conditions, congenital malformations, familial disorders, and metabolic diseases. I integrate advanced genomic methods such as NGS and LRS with detailed clinical phenotyping, machine learning, and quantum computing frameworks for data processing and interpretation. My practice is guided by the principles of 4P Medicine and grounded in a humanistic approach from a Catholic ethical perspective."
    },
    about: {
      title: "Academic Formation & Precision Health Practice",
      desc: "The integration of genomic methodologies, molecular epidemiology, and deep clinical phenotyping establishes evidence-based frameworks for individualized intervention strategies in both hereditary and acquired genetic conditions.",
      cards: [
        {
          title: "Academic & Professional Trajectory",
          text: "Medical degree from Faculdade de Medicina de Petrópolis with degree equivalence certified by Universidade do Porto. Completed Medical Genetics Residency at Instituto Fernandes Figueira (IFF/Fiocruz), a premier reference center for rare diseases and dysmorphology. Master's in Medicine Research from Instituto Oswaldo Cruz (Fiocruz)."
        },
        {
          title: "4P Medicine Protocols & NGS Analysis",
          text: "Structuring clinical workflows that integrate predictive, preventive, personalized, and participatory approaches. Expertise in the analysis and interpretation of NGS data, including WES and WGS, with a focus on phenotype–genotype correlation and the evaluation of germline and somatic variants (including VUS). Application of pharmacogenomic protocols for therapeutic optimization."
        },
        {
          title: "Multicenter Research & Clinical Ethics",
          text: "Coordination of collaborative research focusing on genomic association studies, population screening for rare diseases, and precision oncology. Research interests include systems genetics, polygenic risk scoring (PRS), and quantum-ML optimization. Deeply committed to Catholic Medical Ethics applied to clinical practice, reproductive counseling, and therapeutic decision-making."
        }
      ],
      btnCv: "View Academic Curriculum",
      cvSubtext: "Comprehensive academic and professional documentation"
    },
    publications: {
      title: "Books & Publications: The Future of Medicine",
      desc: "Methodological research integrating new frameworks with clinical and genetic prediction algorithms. This two-volume monograph synthesizes the latest technological updates in medicine, proposing advanced models applicable to accurate diagnostics, complex disease processes, and therapeutic interventions.",
      bookTitle: "Quantum Precision Medicine in Clinical Practice",
      vol1: {
        title: "Volume I: Theoretical Foundations",
        text: "Systematic elucidation of pharmacogenomic principles and quantum algorithm applications in molecular simulations. Explores coherence phenomena in cell signaling pathways and entanglement in enzymatic reactions, laying the groundwork for computational biology integration."
      },
      vol2: {
        title: "Volume II: Clinical Protocols & Applications",
        text: "Translation of theoretical frameworks into evidence-based clinical protocols. Includes case studies in Cardiology (arrhythmia prediction), Oncology (tumor heterogeneity), and Neurology, integrating computational complexity models with conventional clinical decision-making."
      },
      btnBuy: "Buy on Amazon",
      resumenotes: "Comprehensive publication, academic and professional documentation described on Workbench",
    },
    platform: {
      title: "Digital Workbench Environment",
      desc: "Interactive Clinical Decision Support System (CDSS) with integrated access to genetic analysis scripts, risk calculators, and bioinformatics pipelines. Designed for professionals requiring advanced computational tools for genomic interpretation.",
      interface: {
        title: "Operational Architecture",
        text: "Emulated desktop environment for modular workflows. Enables parallel execution of variant annotation, pathway analysis, and clinical correlation, with direct access to global reference databases."
      },
      tools: {
        title: "Bioinformatics Toolkit",
        text: "Comprehensive suite of computational utilities including NGS pipelines (QC, alignment, calling), pathogenicity predictors, and clinical calculators for polygenic risk and pharmacogenetic dosing."
      },
      btnExplore: "Access Digital Workbench"
    },
    faq: {
      title: "Understanding Medical Genetics",
      subtitle: "Learn how Medical Genetics and its subspecialties drive etiological investigation, prognostic stratification, and personalized therapy.",
      items: [
        {
          icon: null,
          question: "What is Medical Genetics and who should seek this specialty?",
          answer: "Medical Genetics is a medical specialty focused on the diagnosis, management, and counseling related to hereditary conditions and genetic disorders. It encompasses the study of chromosomal abnormalities, single-gene (Mendelian) disorders, and complex multifactorial diseases.\n You should seek a clinical geneticist if you have a personal or family history of congenital malformations, intellectual disability, multiple miscarriages, hereditary cancers, or any condition where a genetic etiology is suspected. Early genetic evaluation is also critical for newborns with abnormal screening results."
        },
        {
          icon: null,
          question: "What are the core subspecialties within Medical Genetics?",
          answer: "The field is broadly divided into: Clinical Genetics (dysmorphology, syndrome diagnosis), Molecular Genetics (DNA-level analysis, NGS, gene panels), Cytogenetics (chromosomal analysis via karyotype, FISH, Chromosomal Microarray), Biochemical Genetics (inborn errors of metabolism, enzyme assays), and Cancer Genetics (hereditary cancer syndromes, somatic tumor profiling).\n Each subspecialty uses distinct diagnostic tools but they are increasingly integrated through comprehensive genomic platforms that provide a unified clinical picture."
        },
        {
          icon: null,
          question: "How does Genomic Analysis (NGS) revolutionize diagnosis?",
          answer: "Next-Generation Sequencing (NGS) allows for the simultaneous analysis of thousands of genes, drastically reducing diagnostic odysseys. Key applications include:\n(1) Whole Exome Sequencing (WES): Analyzes the protein-coding regions of all ~20,000 genes.\n(2) Whole Genome Sequencing (WGS): Provides a complete view, including non-coding regulatory regions.\n(3) Gene Panels: Targeted analysis of specific gene sets related to particular conditions (e.g., cardiomyopathy panels, epilepsy panels).\nThe interpretation pipeline involves variant calling, annotation against databases (ClinVar, gnomAD), and careful phenotype-genotype correlation."
        },
        {
          icon: null,
          question: "What role does Epigenetics play in clinical practice?",
          answer: "Epigenetics studies heritable changes in gene expression that do not involve alterations to the DNA sequence itself. Key mechanisms include DNA methylation, histone modification, and non-coding RNA regulation.\n Clinically, epigenetic signatures are used to diagnose imprinting disorders (e.g., Prader-Willi, Angelman syndromes), classify tumors based on their methylation profiles, and understand how environmental factors (diet, stress, toxins) can influence gene expression across generations. It bridges the gap between genotype and phenotype."
        },
        {
          icon: null,
          question: "What is the approach to Prenatal and Reproductive Genetics?",
          answer: "This subspecialty focuses on genetic risk assessment during family planning and pregnancy. Tools include Non-Invasive Prenatal Testing (NIPT), carrier screening, and invasive diagnostics (Chorionic Villus Sampling/Amniocentesis).\n Our approach is deeply guided by Catholic Medical Ethics, respecting the sanctity of life while providing parents with comprehensive, transparent medical information to support informed clinical decisions and adequate preparation."
        },
        {
          icon: null,
          question: "How does Pharmacogenomics personalize drug therapy?",
          answer: "Pharmacogenomics uses your unique genetic profile (specifically CYP450 system enzymes) to predict drug metabolism. This ensures the right drug at the right dose is selected.\n This approach is critical in Psychiatry (antidepressants), Cardiology (anticoagulants), and Oncology. It moves medical practice away from the 'trial and error' model, significantly reducing Adverse Drug Reactions (ADRs) and improving therapeutic efficacy."
        },
        {
          icon: null,
          question: "What advanced therapeutic interventions are available?",
          answer: "Modern Medical Genetics extends well beyond diagnosis into active treatment. We manage advanced modalities including:\n(1) Gene Therapy: Use of viral vectors or CRISPR to correct genetic defects;\n(2) Chaperone Therapy: Stabilizing misfolded proteins to restore function;\n(3) Small Molecule Therapies: Agents designed to bypass nonsense mutations (read-through therapy) or modulate RNA splicing.\nThese interventions represent the vanguard of translational medicine."
        },
        {
          icon: null,
          question: "What is Precision Preventive Medicine and the concept of 'Previvorship'?",
          answer: "This marks a paradigm shift from reactive treatment to proactive risk mitigation. 'Previvors' are individuals with a genetic predisposition who have not yet developed the disease.\n By utilizing Polygenic Risk Scores (PRS) alongside traditional clinical factors, we quantify susceptibility to complex conditions (like heart disease or diabetes). This allows us to create individualized surveillance and lifestyle protocols to prevent or delay disease onset."
        },
        {
          icon: null,
          question: "How do research and subspecialization enhance patient care?",
          answer: "The integration of academic research—including Quantum Precision Medicine, Machine Learning, and Systems Genetics—directly improves patient outcomes. It allows for advanced predictive modeling and access to novel diagnostic technologies.\n Subspecialization ensures that therapeutic strategies are optimized based on the latest evidence. This synergy between clinical expertise and computational science delivers truly personalized care tailored to each patient's unique genetic architecture."
        }
      ],
      closingTitle: "Integrated Approach to Genetic Medicine",
      closingText: "The practice of Medical Genetics uniquely integrates molecular diagnostics, clinical medicine, and ethical counseling. By synthesizing clinical expertise with cutting-edge computational science, we deliver individualized care strategies that optimize outcomes for patients with both hereditary and acquired genetic conditions."
    },
    contact: {
      title: "Professional Contact",
      desc: "For clinical consultations, academic collaborations, or institutional inquiries, please use the form below or schedule a consultation directly.",
      labels: {
        name: "Full Name",
        email: "Email Address",
        subject: "Subject",
        message: "Message",
        send: "Send Message"
      },
      success: "Message sent successfully.",
      error: "Error sending message. Please try again.",
      scheduleTitle: "Schedule Clinical Consultation",
      scheduleDesc: "Book appointments for genetic counseling or diagnostic evaluation. Consultations involve comprehensive medical history, family pedigree analysis, and diagnostic planning.",
      btnSchedule: "Schedule Appointment"
    }
  },

  pt: {
    nav: {
      about: "Sobre",
      publications: "Publicações",
      platform: "Plataforma",
      faq: "FAQs",
      contact: "Contato",
      blog: "GuideLines",
      login: "Workbench"
    },
    hero: {
      role: "Médico Geneticista | Clínico Geral | Investigador",
      bio: "Especialista em Genética Médica focado no diagnóstico etiológico de condições hereditárias, malformações congênitas e doenças metabólicas. Integramos métodos genômicos avançados (NGS, LRS) com fenotipagem clínica detalhada, aprendizado de máquina e arquiteturas de computação quântica para interpretação de dados. Minha prática é orientada pelos princípios da Medicina 4P e fundamentada numa abordagem humanista na perspetiva ética católica."
    },
    about: {
      title: "Formação Acadêmica e Prática em Saúde de Precisão",
      desc: "A integração de metodologias genômicas, epidemiologia molecular e fenotipagem profunda estabelece marcos baseados em evidências para intervenções individualizadas em condições genéticas hereditárias e adquiridas.",
      cards: [
        {
          title: "Trajetória Acadêmica e Profissional",
          text: "Graduação em Medicina pela Faculdade de Medicina de Petrópolis com equivalência de grau pela Universidade do Porto. Residência em Genética Médica pelo Instituto Fernandes Figueira (IFF/Fiocruz), centro de referência em doenças raras e dismorfologia. Mestrado em Pesquisa Clínica pelo Instituto Oswaldo Cruz (Fiocruz)."
        },
        {
          title: "Protocolos 4P e Análise de NGS",
          text: "Estruturação de fluxos clínicos baseados nos pilares preditivo, preventivo, personalizado e participativo. Expertise na interpretação de dados de sequenciamento (WES e WGS), com foco em correlação fenótipo-genótipo e avaliação de variantes germinativas e somáticas (incluindo VUS)."
        },
        {
          title: "Pesquisa Multicêntrica e Ética Clínica",
          text: "Coordenação de projetos colaborativos em estudos de associação genômica e oncologia de precisão. Interesses em genética de sistemas, escores de risco poligênico (PRS) e otimização via computação quântica. Compromisso com a Ética Médica Católica aplicada ao aconselhamento reprodutivo e decisões terapêuticas complexas."
        }
      ],
      btnCv: "Ver Currículo Acadêmico",
      cvSubtext: "Documentação acadêmica e profissional completa"
    },
    publications: {
      title: "Livros & Publicações: A Medicina do Futuro",
      desc: "Pesquisa metodológica que integra novas estruturas com algoritmos de predição clínica e genética. Esta monografia em dois volumes sintetiza as mais recentes atualizações tecnológicas em medicina, propondo modelos avançados aplicáveis ​​a diagnósticos precisos, processos de doenças complexas e intervenções terapêuticas.",
      bookTitle: "Medicina de Precisão Quântica na Prática Clínica",
      vol1: {
        title: "Volume I: Fundamentos Teóricos",
        text: "Elucidação sistemática de princípios farmacogenômicos e aplicações de algoritmos quânticos em simulações moleculares. Explora fenômenos de coerência em vias de sinalização celular e entrelaçamento em reações enzimáticas, estabelecendo a base para a integração com a biologia computacional."
      },
      vol2: {
        title: "Volume II: Protocolos Clínicos e Aplicações",
        text: "Tradução de marcos teóricos em protocolos clínicos baseados em evidências. Inclui estudos de caso em Cardiologia (predição de arritmias), Oncologia (heterogeneidade tumoral) e Neurologia, integrando modelos de complexidade computacional à tomada de decisão clínica convencional."
      },
      btnBuy: "Comprar na Amazon",
      resumenotes: "Publicações completas, documentação académica e profissional descrita no Workbench", 
    },
    platform: {
      title: "Ambiente Digital Workbench",
      desc: "Sistema Interativo de Suporte à Decisão Clínica (CDSS) com acesso integrado a scripts de análise genética, calculadoras de risco e pipelines bioinformáticas. Projetado para profissionais que necessitam de ferramentas computacionais avançadas para interpretação genômica.",
      interface: {
        title: "Arquitetura Operacional",
        text: "Ambiente desktop emulado para fluxos de trabalho modulares. Permite execução paralela de anotação de variantes, análise de vias e correlação clínica, com acesso direto a bancos de dados de referência globais."
      },
      tools: {
        title: "Toolkit Bioinformático",
        text: "Conjunto completo de utilitários computacionais incluindo pipelines NGS (QC, alinhamento, calling), preditores de patogenicidade e calculadoras clínicas para risco poligênico e dosagem farmacogenética."
      },
      btnExplore: "Acessar o Workbench Digital"
    },
    faq: {
      title: "Compreendendo a Genética Médica",
      subtitle: "Descubra como a Genética Médica e suas subespecialidades impulsionam a investigação etiológica, a estratificação prognóstica e a terapia personalizada.",
      items: [
        {
          icon: null,
          question: "O que é Genética Médica e quem deve procurar essa especialidade?",
          answer: "A Genética Médica é uma especialidade médica focada no diagnóstico, manejo e aconselhamento de condições hereditárias e doenças genéticas. Abrange anomalias cromossômicas, doenças monogênicas (mendelianas) e doenças multifatoriais complexas.\n Você deve procurar um geneticista clínico se tiver histórico pessoal ou familiar de malformações congênitas, deficiência intelectual, abortos de repetição, cânceres hereditários ou qualquer condição com suspeita de etiologia genética."
        },
        {
          icon: null,
          question: "Quais são as principais subespecialidades da Genética Médica?",
          answer: "O campo divide-se em: Genética Clínica (dismorfologia, diagnóstico sindrômico), Genética Molecular (análise de DNA, NGS, painéis genéticos), Citogenética (análise cromossômica via cariótipo, FISH, Microarray), Genética Bioquímica (erros inatos do metabolismo) e Genética do Câncer (síndromes hereditárias, perfil tumoral somático).\n Cada subespecialidade utiliza ferramentas diagnósticas distintas, mas são cada vez mais integradas por plataformas genômicas abrangentes."
        },
        {
          icon: null,
          question: "Como a Análise Genômica (NGS) revoluciona o diagnóstico?",
          answer: "O Sequenciamento de Nova Geração (NGS) permite a análise simultânea de milhares de genes, reduzindo drasticamente as odisseias diagnósticas. Aplicações incluem:\n(1) WES: Analisa as regiões codificadoras de todos os ~20.000 genes.\n(2) WGS: Visão completa incluindo regiões regulatórias não codificantes.\n(3) Painéis Genéticos: Análise direcionada de conjuntos específicos de genes.\nO pipeline de interpretação envolve chamada de variantes, anotação contra bancos de dados (ClinVar, gnomAD) e correlação fenótipo-genótipo."
        },
        {
          icon: null,
          question: "Qual o papel da Epigenética na prática clínica?",
          answer: "A Epigenética estuda mudanças hereditárias na expressão gênica sem alterar a sequência de DNA. Mecanismos incluem metilação do DNA, modificação de histonas e regulação por RNA não codificante.\n Clinicamente, assinaturas epigenéticas diagnosticam distúrbios de imprinting (Prader-Willi, Angelman), classificam tumores por perfil de metilação e explicam como fatores ambientais influenciam a expressão gênica entre gerações."
        },
        {
          icon: null,
          question: "Qual a abordagem para Genética Pré-natal e Reprodutiva?",
          answer: "Esta subespecialidade foca na avaliação de risco genético durante planejamento familiar e gravidez. Ferramentas incluem NIPT, triagem de portadores e diagnósticos invasivos (biópsia de vilo corial/amniocentese).\n Nossa abordagem é guiada pela Ética Médica Católica, respeitando a sacralidade da vida e fornecendo informações médicas completas e transparentes para decisões clínicas informadas."
        },
        {
          icon: null,
          question: "Como a Farmacogenômica personaliza a terapia medicamentosa?",
          answer: "A farmacogenômica utiliza seu perfil genético único (enzimas do sistema CYP450) para prever o metabolismo de medicamentos, garantindo o medicamento certo na dose correta.\n Essa abordagem é crítica em Psiquiatria (antidepressivos), Cardiologia (anticoagulantes) e Oncologia. Afasta a prática médica do modelo de 'tentativa e erro', reduzindo significativamente Reações Adversas a Medicamentos (RAM)."
        },
        {
          icon: null,
          question: "Quais intervenções terapêuticas avançadas estão disponíveis?",
          answer: "A Genética Médica moderna vai além do diagnóstico para o tratamento ativo, incluindo:\n(1) Terapia Gênica: Uso de vetores virais ou CRISPR para corrigir defeitos genéticos;\n(2) Terapia com Chaperonas: Estabilização de proteínas mal dobradas;\n(3) Terapias com Pequenas Moléculas: Agentes que ultrapassam mutações nonsense ou modulam o splicing de RNA.\nEstas intervenções representam a vanguarda da medicina translacional."
        },
        {
          icon: null,
          question: "O que é Medicina Preventiva de Precisão e o conceito de 'Previvor'?",
          answer: "Isso marca uma mudança de paradigma do tratamento reativo para a mitigação proativa de riscos. 'Previventes' são indivíduos com predisposição genética que ainda não desenvolveram a doença.\n Ao utilizar Escores de Risco Poligênico (PRS) junto a fatores clínicos tradicionais, quantificamos a suscetibilidade a condições complexas (como doenças cardíacas ou diabetes). Isso nos permite criar protocolos de vigilância e estilo de vida individualizados para prevenir ou adiar o início da doença."
        },
        {
          icon: null,
          question: "Como a pesquisa e a subespecialização aprimoram o cuidado ao paciente?",
          answer: "A integração da pesquisa acadêmica — incluindo Medicina de Precisão Quântica, Aprendizado de Máquina e Genética de Sistemas — melhora diretamente os desfechos dos pacientes. Ela permite modelagem preditiva avançada e acesso a tecnologias diagnósticas inéditas.\n A subespecialização garante que as estratégias terapêuticas sejam otimizadas com base nas evidências mais recentes. Essa sinergia entre expertise clínica e ciência computacional define o futuro da medicina personalizada, adaptada à arquitetura genética única de cada paciente."
        }
      ],
      closingTitle: "Abordagem Integrada à Medicina Genética",
      closingText: "A prática da Genética Médica integra de forma única o diagnóstico molecular, a medicina clínica e o aconselhamento ético. Ao sintetizar a expertise clínica com a ciência computacional de ponta, entregamos estratégias de cuidado individualizadas que otimizam os resultados para pacientes com condições genéticas hereditárias e adquiridas."
    },
    contact: {
      title: "Contato Profissional",
      desc: "Para consultas clínicas, colaborações acadêmicas ou consultas institucionais, utilize o formulário abaixo ou agende diretamente.",
      labels: {
        name: "Nome Completo",
        email: "Endereço de E-mail",
        subject: "Assunto",
        message: "Mensagem",
        send: "Enviar Mensagem"
      },
      success: "Mensagem enviada com sucesso.",
      error: "Erro ao enviar mensagem. Tente novamente.",
      scheduleTitle: "Agendar Consulta Clínica",
      scheduleDesc: "Agendamento para aconselhamento genético ou avaliação diagnóstica. As consultas incluem análise de heredograma e planejamento genômico.",
      btnSchedule: "Agendar Consulta"
    }
  },

  it: {
    nav: {
      about: "Formazione",
      publications: "Pubblicazioni",
      platform: "Piattaforma",
      faq: "FAQs",
      contact: "Contatti",
      blog: "GuideLines",
      login: "Workbench"
    },
    hero: {
      role: "Clinico Genetista | Medico di Base | Ricercatore",
      bio: "Specialista in Genetica Medica focalizzato sulla diagnosi eziologica di condizioni ereditarie, malformazioni congenite e malattie metaboliche. Integriamo metodi genomici avanzati (NGS, LRS) con una fenotipizzazione clinica dettagliata, machine learning e framework di computazione quantistica per l'interpretazione dei dati. La mia pratica è guidata dai principi della medicina 4P e fondata su un approccio umanistico da una prospettiva etica cattolica."
    },
    about: {
      title: "Formazione Accademica e Pratica della Salute di Precisione",
      desc: "L'integrazione di metodologie genomiche, epidemiologia molecolare e fenotipizzazione clinica profonda stabilisce framework basati sull'evidenza per strategie di intervento individualizzate in condizioni genetiche ereditarie e acquisite.",
      cards: [
        {
          title: "Percorso Accademico e Professionale",
          text: "Laurea in Medicina presso la Faculdade de Medicina de Petrópolis con equivalenza certificata dall'Universidade do Porto. Specializzazione in Genetica Medica presso l'Istituto Fernandes Figueira (IFF/Fiocruz), centro di eccellenza per le malattie rare e la dismorfologia. Master in Ricerca Medica presso l'Istituto Oswaldo Cruz (Fiocruz)."
        },
        {
          title: "Protocolli 4P e Analisi NGS",
          text: "Strutturazione di flussi di lavoro clinici basati sui pilastri predittivo, preventivo, personalizzato e partecipativo. Esperienza nell'interpretazione di dati NGS (WES e WGS), con focus sulla correlazione fenotipo-genotipo e sulla valutazione di varianti germinali e somatiche (incluse le VUS)."
        },
        {
          title: "Ricerca Multicentrica ed Etica Clinica",
          text: "Coordinamento di ricerche su studi di associazione genomica e oncologia di precisione. Interessi di ricerca in genetica dei sistemi, punteggi di rischio poligenico (PRS) e ottimizzazione tramite calcolo quantistico. Impegno nei principi di Etica Medica Cattolica applicati alla consulenza riproduttiva e alle decisioni terapeutiche complesse."
        }
      ],
      btnCv: "Visualizza Curriculum Accademico",
      cvSubtext: "Documentazione accademica e professionale completa"
    },
    publications: {
      title: "Libri & Pubblicazioni: La Medicina del Futuro",
      desc: "Ricerca metodologica che integra nuovi framework con algoritmi di predizione clinica e genetica. Questa monografia in due volumi sintetizza gli ultimi aggiornamenti tecnologici in medicina, proponendo modelli avanzati applicabili a diagnosi accurate, processi patologici complessi e interventi terapeutici.",
      bookTitle: "Medicina di Precisione Quantistica nella Pratica Clinica",
      vol1: {
        title: "Volume I: Fondamenti Teorici",
        text: "Analisi sistematica dei principi farmacogenomici e delle applicazioni di algoritmi quantistici nelle simulazioni molecolari. Il volume esplora la coerenza nelle vie di segnalazione cellulare e l'entanglement nelle reazioni enzimatiche, fornendo le basi per l'integrazione con la biologia computazionale."
      },
      vol2: {
        title: "Volume II: Protocolli Clinici e Applicazioni",
        text: "Traduzione dei framework teorici in protocolli clinici basati sull'evidenza. Include studi di caso in Cardiologia (predizione di aritmie), Oncologia (eterogeneità tumorale) e Neurologia, integrando modelli di complessità computazionale con il processo decisionale clinico convenzionale."
      },
      btnBuy: "Acquista su Amazon",
      resumenotes: "Pubblicazione completa, documentazione accademica e professionale descritta in Workbench",
      
    },
    platform: {
      title: "Ambiente Digital Workbench",
      desc: "Sistema Interattivo di Supporto alle Decisioni Cliniche (CDSS) con accesso integrato a script di analisi genetica, calcolatori di rischio e pipeline bioinformatiche. Progettato per professionisti che richiedono strumenti computazionali avanzati per l'interpretazione genomica.",
      interface: {
        title: "Architettura Operativa",
        text: "Ambiente desktop emulato per flussi di lavoro modulari. Permette l'esecuzione parallela di annotazione delle varianti, analisi dei pathway e correlazione clinica, con accesso diretto a database di riferimento globali."
      },
      tools: {
        title: "Toolkit Bioinformatico",
        text: "Suite completa di utility computazionali inclusi pipeline NGS (QC, allineamento, calling), predittori di patogenicità e calcolatori clinici per il rischio poligenico e il dosaggio farmacogenetico."
      },
      btnExplore: "Accedi al Workbench Digitale"
    },
    faq: {
      title: "Comprendere la Genetica Medica",
      subtitle: "Scopri come la Genetica Medica e le sue sottospecialità guidano l'indagine eziologica, la stratificazione prognostica e la terapia personalizzata.",
      items: [
        {
          icon: null,
          question: "Cos'è la Genetica Medica e chi dovrebbe rivolgersi a questa specialità?",
          answer: "La Genetica Medica è una specialità medica focalizzata sulla diagnosi, gestione e consulenza relative a condizioni ereditarie e disturbi genetici. Comprende anomalie cromosomiche, disturbi monogenici (mendeliani) e malattie multifattoriali complesse.\n Dovresti consultare un genetista clinico se hai un'anamnesi personale o familiare di malformazioni congenite, disabilità intellettiva, aborti ripetuti, tumori ereditari o qualsiasi condizione con sospetta eziologia genetica."
        },
        {
          icon: null,
          question: "Quali sono le principali sottospecialità della Genetica Medica?",
          answer: "Il campo si divide in: Genetica Clinica (dismorfologia, diagnosi sindromica), Genetica Molecolare (analisi del DNA, NGS, pannelli genici), Citogenetica (analisi cromosomica tramite cariotipo, FISH, Microarray), Genetica Biochimica (errori congeniti del metabolismo) e Genetica Oncologica (sindromi tumorali ereditarie, profilazione somatica).\n Ogni sottospecialità utilizza strumenti diagnostici distinti, ma sono sempre più integrate attraverso piattaforme genomiche complete."
        },
        {
          icon: null,
          question: "Come l'Analisi Genomica (NGS) rivoluziona la diagnosi?",
          answer: "Il Sequenziamento di Nuova Generazione (NGS) permette l'analisi simultanea di migliaia di geni, riducendo drasticamente le odissee diagnostiche. Le applicazioni principali includono:\n(1) WES: Analizza le regioni codificanti di tutti i ~20.000 geni.\n(2) WGS: Fornisce una visione completa, incluse le regioni regolatorie non codificanti.\n(3) Pannelli Genici: Analisi mirata di set specifici di geni.\nIl pipeline di interpretazione prevede il calling delle varianti, l'annotazione contro i database (ClinVar, gnomAD) e un'attenta correlazione fenotipo-genotipo."
        },
        {
          icon: null,
          question: "Quale ruolo gioca l'Epigenetica nella pratica clinica?",
          answer: "L'Epigenetica studia i cambiamenti ereditabili nell'espressione genica che non coinvolgono alterazioni della sequenza del DNA. I meccanismi chiave includono la metilazione del DNA, la modificazione degli istoni e la regolazione da parte di RNA non codificante.\n Clinicamente, le firme epigenetiche sono utilizzate per diagnosticare disturbi dell'imprinting (Prader-Willi, Angelman), classificare i tumori in base ai loro profili di metilazione e comprendere come i fattori ambientali influenzano l'espressione genica tra le generazioni."
        },
        {
          icon: null,
          question: "Qual è l'approccio alla Genetica Prenatale e Riproduttiva?",
          answer: "Questa sottospecialità si concentra sulla valutazione del rischio genetico durante la pianificazione familiare e la gravidanza. Gli strumenti includono il Test Prenatale Non Invasivo (NIPT), lo screening dei portatori e la diagnostica invasiva (Villocentesi/Amniocentesi).\n Il nostro approccio è profondamente guidato dall'Etica Medica Cattolica, rispettando la sacralità della vita e fornendo ai genitori informazioni mediche complete e trasparenti per supportare decisioni cliniche informate e una preparazione adeguata."
        },
        {
          icon: null,
          question: "In che modo la Farmacogenomica personalizza la terapia farmacologica?",
          answer: "La farmacogenomica utilizza il tuo profilo genetico unico (specificamente gli enzimi del sistema CYP450) per prevedere il metabolismo dei farmaci. Ciò garantisce la selezione del farmaco giusto al dosaggio corretto.\n Questo approccio è fondamentale in Psichiatria (antidepressivi), Cardiologia (anticoagulanti) e Oncologia. Sposta la pratica medica lontano dal modello 'tentativo ed errore', riducendo significativamente le Reazioni Avverse ai Farmaci (ADR) e migliorando l'efficacia terapeutica."
        },
        {
          icon: null,
          question: "Quali interventi terapeutici avanzati sono disponibili?",
          answer: "La moderna Genetica Medica si estende ben oltre la diagnosi, entrando nel campo del trattamento attivo. Gestiamo modalità avanzate tra cui:\n(1) Terapia Genica: Uso di vettori virali o CRISPR per correggere i difetti genetici;\n(2) Terapia con Chaperoni: Stabilizzazione delle proteine mal ripiegate per ripristinarne la funzione;\n(3) Terapie con Piccole Molecole: Agenti progettati per bypassare le mutazioni nonsense (terapia di read-through) o modulare lo splicing dell'RNA.\nQuesti interventi rappresentano la vanguarda della medicina traslazionale."
        },
        {
          icon: null,
          question: "Cos'è la Medicina Preventiva di Precisione e il concetto di 'Previvorship'?",
          answer: "Ciò segna un cambio di paradigma dal trattamento reattivo alla mitigazione proattiva del rischio. I 'Previvors' sono individui con una predisposizione genetica che non hanno ancora sviluppato la malattia.\n Utilizzando i Polygenic Risk Scores (PRS) insieme ai tradizionali fattori clinici, quantifichiamo la suscettibilità a condizioni complesse (come malattie cardiache o diabete). Questo ci permette di creare protocolli di sorveglianza e stili di vita individualizzati per prevenire o ritardare l'insorgenza della patologia."
        },
        {
          icon: null,
          question: "In che modo la ricerca e la sottospecializzazione migliorano la cura del paziente?",
          answer: "L'integrazione della ricerca accademica — inclusa la Medicina di Precisione Quantistica, il Machine Learning e la Genetica dei Sistemi — migliora direttamente gli esiti dei pazienti. Permette la modellazione predittiva avanzata e l'accesso a tecnologie diagnostiche innovative.\n La sottospecializzazione garantisce che le strategie terapeutiche siano ottimizzate sulla base delle evidenze più recenti. Questa sinergia tra expertise clinica e scienza computazionale offre una cura veramente personalizzata, adattata all'architettura genetica unica di ogni paziente."
        }
      ],
      closingTitle: "Approccio Integrato alla Medicina Genetica",
      closingText: "La pratica della Genetica Medica integra in modo unico la diagnostica molecolare, la medicina clinica e la consulenza etica. Sintetizzando l'esperienza clinica con la scienza computazionale all'avanguardia, forniamo strategie di cura individualizzate che ottimizzano i risultati per i pazienti con condizioni genetiche ereditarie e acquisite."
    },
    contact: {
      title: "Contatto Professionale",
      desc: "Per consultazioni cliniche, collaborazioni accademiche o richieste istituzionali, utilizzare il modulo sottostante o prenotare direttamente una consultazione.",
      labels: {
        name: "Nome Completo",
        email: "Indirizzo Email",
        subject: "Oggetto",
        message: "Messaggio",
        send: "Invia Messaggio"
      },
      success: "Messaggio inviato con successo.",
      error: "Errore nell'invio del messaggio. Riprova.",
      scheduleTitle: "Prenotare Consultazione Clinica",
      scheduleDesc: "Prenotazione per consulenza genetica o valutazione diagnostica. Le consultazioni includono anamnesi completa, analisi del pedigree e pianificazione diagnostica.",
      btnSchedule: "Prenota Appuntamento"
    }
  }
};