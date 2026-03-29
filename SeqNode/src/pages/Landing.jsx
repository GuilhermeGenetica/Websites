/**
 * pages/Landing.jsx — SeqNode-OS Presentation / Landing Page
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js';
import InteractiveDiagram from './InteractiveDiagram.jsx';

const FEATURES = [
    {
        icon: '🖱️',
        title: 'DAG Visual Pipeline Builder',
        desc: 'Design arbitrarily complex acyclic directed graphs with 7 specialized node types. Connect bioinformatics tools visually without touching YAML or shell scripts.',
    },
    {
        icon: '🔧',
        title: 'YAML Plugin Ecosystem',
        desc: 'Define any bioinformatics tool as a declarative YAML manifest specifying inputs, outputs, parameters, and command templates. Drop any .yaml file in the plugins/ directory — it appears instantly in the sidebar.',
    },
    {
        icon: '⚡',
        title: 'WebSocket Real-Time Execution',
        desc: 'Every node execution event — start, stdout/stderr lines, exit code, status transitions — is streamed directly to your browser via a persistent WebSocket connection. No polling, no page refreshes.',
    },
    {
        icon: '📂',
        title: 'Reference Genome Management',
        desc: 'Browse, download, checksum-verify, and index reference assemblies from Ensembl, UCSC, and NCBI FTP servers. Genome indices are tracked and made available to all pipelines.',
    },
    {
        icon: '🐍',
        title: 'Conda / Mamba Environment Isolation',
        desc: 'Each node can specify its own conda environment, enabling per-tool dependency isolation. SeqNode-OS wraps every command in `conda run` automatically.',
    },
    {
        icon: '🔀',
        title: 'Branching, Loops & Control Flow',
        desc: 'Condition nodes branch execution based on Python expressions evaluated against upstream outputs. Loop nodes iterate sub-graphs over sample lists. Pause nodes require manual approval — ideal for QC checkpoints.',
    },
    {
        icon: '🔗',
        title: 'SubWorkflow Composition',
        desc: 'Embed any saved workflow as a node inside another. Inputs and outputs are wired across parent-child boundaries. Build modular, reusable analysis blocks.',
    },
    {
        icon: '✨',
        title: 'AI Workflow Builder',
        desc: 'Describe your pipeline in plain English and let the AI generate a fully connected workflow in seconds. Supports any LLM provider (Claude, Gemini, GPT-4, Grok, Ollama). Missing plugins are auto-generated as YAML and installed on the fly. Navigation history lets you compare and refine generated results.',
    },
    {
        icon: '🤖',
        title: 'AI Agent-Assisted Analysis',
        desc: 'Attach an LLM agent (Claude, GPT-4) to any point in the pipeline. The agent receives execution context, log output, and result files, and can emit structured annotations or dynamic downstream commands.',
    },
    {
        icon: '🖥️',
        title: 'Multi-Runner Architecture',
        desc: 'Execute locally (system PATH), through a remote VPS FastAPI engine, via a SLURM job scheduler on an HPC cluster, or through the SeqNode Agent on any reachable Linux/macOS/Windows machine.',
    },
    {
        icon: '💾',
        title: 'Reproducible Workflow Serialization',
        desc: 'Every workflow serializes to a deterministic JSON document capturing the full graph topology, node configurations, and parameter values. Import, export, and version-control pipelines exactly like source code.',
    },
    {
        icon: '🔍',
        title: 'Dependency Pre-Flight Analysis',
        desc: 'Before execution, SeqNode-OS resolves every tool binary, reference file path, and conda environment. Color-coded results flag missing dependencies without launching a single job.',
    },
    {
        icon: '🔒',
        title: 'Secure Multi-User Platform',
        desc: 'JWT-based authentication with email verification, role-based user profiles, password reset, and per-session token management. LLM API keys and settings are encrypted in MySQL and persist across logins. PHP/SQL backend deployable on any shared hosting.',
    },
];

const PIPELINE_TYPES = [
    {
        icon: '🧬',
        label: 'WGS Germline',
        desc: 'Whole-genome sequencing variant calling from raw FASTQ to annotated VCF using BWA-MEM2 → GATK HaplotypeCaller → VQSR → VEP',
        tools: ['BWA-MEM2', 'GATK4', 'Picard', 'Ensembl VEP'],
    },
    {
        icon: '🔬',
        label: 'WES / Panel',
        desc: 'Whole-exome and targeted gene-panel sequencing with on-target coverage metrics, variant filtering, and pathogenicity annotation',
        tools: ['fastp', 'BWA-MEM2', 'GATK4', 'BCFtools', 'SnpEff'],
    },
    {
        icon: '🧪',
        label: 'Somatic Tumor–Normal',
        desc: 'Paired tumor/normal somatic variant calling, microsatellite instability detection, and mutational signature analysis',
        tools: ['Mutect2', 'CNVkit', 'BCFtools', 'AnnotSV'],
    },
    {
        icon: '📊',
        label: 'RNA-seq Expression',
        desc: 'Transcriptome quantification, differential expression analysis, and pathway enrichment from bulk RNA sequencing data',
        tools: ['STAR', 'HISAT2', 'featureCounts', 'MultiQC'],
    },
    {
        icon: '📈',
        label: 'CNV & SV Analysis',
        desc: 'Copy number variation segmentation, structural variant detection, and clinical annotation for germline and somatic samples',
        tools: ['CNVkit', 'Mosdepth', 'AnnotSV', 'ExomeDepth'],
    },
    {
        icon: '🔗',
        label: 'Long-Read / Oxford Nanopore',
        desc: 'Adaptive basecalling, structural variant detection and methylation calling from long-read sequencing data',
        tools: ['Minimap2', 'SAMtools', 'BCFtools', 'DeepVariant'],
    },
];

const TOOLS = [
    'BWA-MEM2', 'SAMtools', 'GATK4', 'BCFtools', 'BEDtools',
    'Ensembl VEP', 'SnpEff', 'fastp', 'FastQC', 'Trimmomatic',
    'Picard', 'CNVkit', 'Mosdepth', 'AnnotSV', 'Sambamba',
    'ExomeDepth', 'Minimap2', 'HISAT2', 'featureCounts', 'MultiQC',
    'DeepVariant', 'STAR', 'RSEM', 'Kallisto', 'LUMPY', 'Manta',
];

const STEPS = [
    {
        num: '01',
        title: 'Design the Graph',
        desc: 'Drag nodes from the sidebar onto the canvas. Connect tools in sequence, parallel, or branching topologies. Configure each step with exact parameters, file paths, and Conda environments.',
    },
    {
        num: '02',
        title: 'Validate & Inspect',
        desc: 'Run the built-in dependency analysis to verify tool binaries, reference files, and conda environments exist. The validator catches topology errors — missing required inputs, disconnected handles — before a single job is submitted.',
    },
    {
        num: '03',
        title: 'Execute & Stream',
        desc: 'Launch the workflow with a single click. SeqNode-OS orchestrates each node in topological order, respecting parallelism and data dependencies. Every log line is streamed to your dashboard in real time.',
    },
    {
        num: '04',
        title: 'Monitor & Reproduce',
        desc: 'Inspect per-node logs, execution times, and output paths. Export the workflow as a versioned JSON for reproducibility and sharing. Re-run any point in the graph by clearing downstream nodes.',
    },
];

const STATS = [
    { val: '26+',  lbl: 'Built-in Plugins' },
    { val: '7',    lbl: 'Node Types' },
    { val: 'WS',   lbl: 'Real-time Streaming' },
    { val: '100%', lbl: 'Open Source' },
];

const ARCH_TIERS = [
    {
        label: 'Tier 1 — Browser',
        items: ['React 19 SPA', '@xyflow/react DAG', 'Zustand State', 'WebSocket Client'],
    },
    {
        label: 'Tier 2 — Hosting',
        items: ['PHP 8 REST API', 'SQL (Auth / Users)', 'JWT Token Management', 'Hostinger / Shared Hosting'],
    },
    {
        label: 'Tier 3 — Execution Engine',
        items: ['Python FastAPI', 'WebSocket Server', 'Plugin Orchestrator', 'Oracle / AWS VPS'],
    },
    {
        label: 'Tier 4 — Compute',
        items: ['SeqNode Agent', 'Local Machine / Lab Server', 'HPC / SLURM Cluster', 'Conda / Mamba Runtime'],
    },
];

// --- CLINICAL WGS/WES PIPELINE (Vertical) ---
const heroNodes = [
    { id: '1', label: 'Clinical Specimen', icon: '🩸', desc: 'Blood / Saliva Collection', x: -200, y: 0, color: '#ec4899' },
    { id: '2', label: 'DNA Extraction', icon: '🧪', desc: 'Library Preparation', x: -180, y: 120, color: '#f59e0b' },
    { id: '3', label: 'Raw FASTQ', icon: '🧬', desc: 'Illumina NovaSeq Output', x: -160, y: 240, color: '#38bdf8' },
    { id: '4', label: 'fastp QC', icon: '✂️', desc: 'Adapter Trimming & QC', x: -140, y: 360, color: '#10b981' },
    { id: '5', label: 'BWA-MEM2', icon: '🧭', desc: 'Alignment to hg38', x: +180, y: 60, color: '#818cf8' },
    { id: '6', label: 'GATK HC', icon: '🧠', desc: 'Variant Calling (VCF)', x: +200, y: 180, color: '#8b5cf6' },
    { id: '7', label: 'VEP Annotation', icon: '📝', desc: 'Clinical Significance', x: +220, y: 300, color: '#3b82f6' },
    { id: '8', label: 'Genetic Counseling', icon: '⚕️', desc: 'Final Actionable Report', x: +240, y: 420, color: '#22c55e' },
];

const heroEdges = [
    { id: 'e1-2', source: '1', target: '2', color: '#f59e0b' },
    { id: 'e2-3', source: '2', target: '3', color: '#38bdf8' },
    { id: 'e3-4', source: '3', target: '4', color: '#10b981' },
    { id: 'e4-5', source: '4', target: '5', color: '#818cf8' },
    { id: 'e5-6', source: '5', target: '6', color: '#8b5cf6' },
    { id: 'e6-7', source: '6', target: '7', color: '#3b82f6' },
    { id: 'e7-8', source: '7', target: '8', color: '#22c55e' },
];

// --- MULTI-OMIC INTEGRATION PIPELINE (Tree with Horizontal End) ---
const largeNodes = [
    { id: 's1', label: 'Clinical Specimen', icon: '🩸', desc: 'Tissue Biopsy / Blood', x: 450, y: 0, color: '#ec4899' },
    
    // Omics Branches
    { id: 'wgs', label: 'DNA Sequencing', icon: '🧬', desc: 'WGS / WES Pipeline', x: 100, y: 150, color: '#38bdf8' },
    { id: 'rna', label: 'RNA Sequencing', icon: '🧬', desc: 'Transcriptomics', x: 333, y: 150, color: '#818cf8' },
    { id: 'epi', label: 'Methylation Array', icon: '🔬', desc: 'Epigenomics (Bisulfite)', x: 566, y: 150, color: '#8b5cf6' },
    { id: 'met', label: 'Mass Spectrometry', icon: '⚗️', desc: 'Metabolomics (LC-MS)', x: 800, y: 150, color: '#f59e0b' },
    
    // Core Analysis
    { id: 'var', label: 'Genomic Variants', icon: '🔍', desc: 'GATK / DeepVariant', x: 100, y: 300, color: '#38bdf8' },
    { id: 'exp', label: 'Expression Diff.', icon: '📊', desc: 'STAR / DESeq2', x: 333, y: 300, color: '#818cf8' },
    { id: 'dmr', label: 'DMR Analysis', icon: '📉', desc: 'Differentially Methylated Reg.', x: 566, y: 300, color: '#8b5cf6' },
    { id: 'spec', label: 'Metabolite Profiles', icon: '📈', desc: 'Spectral Annotation', x: 800, y: 300, color: '#f59e0b' },
    
    // Integration & Reporting Path (Horizontal Tree End)
    { id: 'int', label: 'Multi-Omic Integration', icon: '🧠', desc: 'Data Lake / MOFA+', x: 350, y: 450, color: '#10b981' },
    { id: 'acmg', label: 'Pathogenicity', icon: '⚖️', desc: 'ACMG Guidelines', x: 650, y: 450, color: '#f43f5e' },
    { id: 'rep', label: 'Clinical Report', icon: '📋', desc: 'Actionable Insights', x: 850, y: 450, color: '#22c55e' },
    { id: 'csl', label: 'Genetic Counseling', icon: '⚕️', desc: 'Therapeutic Decision Support', x: 1050, y: 450, color: '#22c55e' }
];

const largeEdges = [
    // Branches
    { id: 'e-s1-wgs', source: 's1', target: 'wgs', color: '#38bdf8' },
    { id: 'e-s1-rna', source: 's1', target: 'rna', color: '#818cf8' },
    { id: 'e-s1-epi', source: 's1', target: 'epi', color: '#8b5cf6' },
    { id: 'e-s1-met', source: 's1', target: 'met', color: '#f59e0b' },
    
    // Processing
    { id: 'e-wgs-var', source: 'wgs', target: 'var', color: '#38bdf8' },
    { id: 'e-rna-exp', source: 'rna', target: 'exp', color: '#818cf8' },
    { id: 'e-epi-dmr', source: 'epi', target: 'dmr', color: '#8b5cf6' },
    { id: 'e-met-spec', source: 'met', target: 'spec', color: '#f59e0b' },
    
    // Integration
    { id: 'e-var-int', source: 'var', target: 'int', color: '#10b981' },
    { id: 'e-exp-int', source: 'exp', target: 'int', color: '#10b981' },
    { id: 'e-dmr-int', source: 'dmr', target: 'int', color: '#10b981' },
    { id: 'e-spec-int', source: 'spec', target: 'int', color: '#10b981' },
    
    // Final Path
    { id: 'e-int-acmg', source: 'int', target: 'acmg', color: '#f43f5e' },
    { id: 'e-acmg-rep', source: 'acmg', target: 'rep', color: '#22c55e' },
    { id: 'e-rep-csl', source: 'rep', target: 'csl', color: '#22c55e' }
];

export default function Landing() {
    const navigate = useNavigate();

    const [theme, setTheme] = useState(() => localStorage.getItem('seqnode-theme') || 'dark');

    useEffect(() => {
        document.body.className = 'theme-' + theme;
        localStorage.setItem('seqnode-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const handleLaunch = () => {
        navigate(isAuthenticated() ? '/app' : '/login');
    };

    return (
        <div className="landing-root">

            {/* ── Navbar ── */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <span className="landing-logo">🧬 SeqNode-OS</span>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#architecture">Architecture</a>
                        <a href="#pipelines">Pipelines</a>
                        <a href="#tools">Tools</a>
                        <a href="#how">How It Works</a>
                        <button className="landing-btn-outline" onClick={() => navigate('/help')}>
                            Docs
                        </button>
                        <button className="landing-btn-primary" onClick={handleLaunch}>
                            {isAuthenticated() ? 'Open App' : 'Sign In'}
                        </button>
                        <button className="theme-toggler" onClick={toggleTheme} title="Toggle Theme">
                            {theme === 'dark' ? '☀️' : '🌙'}
                            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-hero-badge">Scientific Workflow Lifecycle Management</div>
                    
                    <h1 className="landing-hero-title">
                        Bioinformatics Pipeline<br />
                        Orchestration <span className="landing-accent">at Production Scale</span>
                    </h1>
                        <p className="landing-hero-sub">
                            SeqNode-OS is a visual execution framework engineered for the <strong>composition, validation, and deployment</strong> 
                            of large-scale computational pipelines. By providing a high-level abstraction over complex environments, 
                            it enables a seamless transition from <strong>raw sequence data to biological insights</strong> 
                            without the overhead of manual scripting or infrastructure management.
                        </p>
                    
                    {/* Correção de Espaçamento Aqui */}
                    <div className="landing-hero-badges" style={{ marginBottom: '2.5rem' }}>
                        <span className="landing-tech-badge">React 19</span>
                        <span className="landing-tech-badge">@xyflow/react</span>
                        <span className="landing-tech-badge">FastAPI</span>
                        <span className="landing-tech-badge">WebSocket</span>
                        <span className="landing-tech-badge">Conda/Mamba</span>
                        <span className="landing-tech-badge">SLURM</span>
                    </div>
                    
                    <div className="landing-hero-actions">
                        <button className="landing-btn-primary landing-btn-lg" onClick={handleLaunch}>
                            ▶ Launch Application
                        </button>
                        <button className="landing-btn-outline landing-btn-lg" onClick={() => navigate('/help')}>
                            📖 View Documentation
                        </button>
                    </div>
                    <div className="landing-hero-stats">
                        {STATS.map((s, i) => (
                            <React.Fragment key={i}>
                                {i > 0 && <div className="landing-stat-div" />}
                                <div className="landing-stat">
                                    <span className="landing-stat-val">{s.val}</span>
                                    <span className="landing-stat-lbl">{s.lbl}</span>
                                </div>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
                
                {/* Visual em Quadrado/Retângulo Fixo Adaptável */}
                <div className="landing-hero-visual" style={{ 
                    flex: '1', 
                    width: '100%', 
                    maxWidth: '500px', 
                    height: '100%',
                    maxHeight: '500px',
                    aspectRatio: '1 / 1', 
                    margin: '0 auto',
                    marginTop: '10px', 
                    display: 'flex' 
                }}>
                    <InteractiveDiagram nodes={heroNodes} edges={heroEdges} height="100%" orientation="vertical" />
                </div>
            </section>

            {/* ── Features ── */}
            <section className="landing-section" id="features">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Platform Features</span>
                        <h2>A complete research-grade<br />orchestration framework</h2>
                        <p>
                            Every component of SeqNode-OS is designed for production genomics workflows —
                            from interactive DAG construction to HPC-scale execution and reproducible reporting.
                        </p>
                    </div>
                    <div className="landing-features-grid">
                        {FEATURES.map((f, i) => (
                            <div className="landing-feature-card" key={i}>
                                <span className="landing-feature-icon">{f.icon}</span>
                                <h3>{f.title}</h3>
                                <p>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Architecture ── */}
            <section className="landing-section landing-section-alt" id="architecture">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">System Architecture</span>
                        <h2>Four-tier distributed design</h2>
                        <p>
                            SeqNode-OS separates concerns cleanly across browser, hosting, execution engine,
                            and compute layers — each independently deployable and scalable.
                        </p>
                    </div>
                    <div className="landing-arch-diagram">
                        {ARCH_TIERS.map((tier, i) => (
                            <div key={i} className="landing-arch-tier">
                                <div className="landing-arch-tier-label">{tier.label}</div>
                                {tier.items.map((item, j) => (
                                    <div className="landing-arch-item" key={j}>· {item}</div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <p className="landing-tools-note" style={{ marginTop: '2rem' }}>
                        The execution engine and agent are independently deployable — the browser frontend
                        communicates with each tier through REST and WebSocket protocols.
                    </p>
                </div>
            </section>

            {/* ── Pipeline Types ── */}
            <section className="landing-section" id="pipelines">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Supported Analysis Types</span>
                        <h2>End-to-end genomics<br />and transcriptomics workflows</h2>
                        <p>
                            Pre-validated pipeline patterns for the most common NGS analysis types,
                            ready to adapt and extend with the visual builder.
                        </p>
                    </div>
                    <div className="landing-pipeline-grid">
                        {PIPELINE_TYPES.map((p, i) => (
                            <div className="landing-pipeline-card" key={i}>
                                <div className="landing-pipeline-header">
                                    <span className="landing-pipeline-icon">{p.icon}</span>
                                    <h3>{p.label}</h3>
                                </div>
                                <p>{p.desc}</p>
                                <div className="landing-pipeline-tools">
                                    {p.tools.map((tool, j) => (
                                        <span className="landing-pipeline-tool" key={j}>{tool}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Tools ── */}
            <section className="landing-section landing-section-alt" id="tools">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Supported Tools</span>
                        <h2>26+ built-in YAML plugin integrations</h2>
                        <p>
                            Industry-standard bioinformatics tools are pre-configured as YAML plugin manifests.
                            Every tool is immediately available in the node sidebar — no installation scripts required.
                        </p>
                    </div>
                    <div className="landing-tools-grid">
                        {TOOLS.map((t, i) => (
                            <div className="landing-tool-badge" key={i}>{t}</div>
                        ))}
                    </div>
                    <p className="landing-tools-note">
                        + Any custom tool or in-house script via a single declarative YAML plugin file
                    </p>
                </div>
            </section>

            {/* ── How It Works ── */}
            <section className="landing-section" id="how">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">How It Works</span>
                        <h2>From design to reproducible results<br />in four steps</h2>
                    </div>
                    <div className="landing-steps">
                        {STEPS.map((s, i) => (
                            <div className="landing-step" key={i}>
                                <div className="landing-step-num">{s.num}</div>
                                <div className="landing-step-body">
                                    <h3>{s.title}</h3>
                                    <p>{s.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Interactive Workflow Explorer (Multi-Omic Vertical Tree) ── */}
            <section className="landing-section landing-section-alt">
                <div className="landing-section-inner">
                    <div className="landing-section-header">
                        <span className="landing-section-tag">Interactive Topology Explorer</span>
                        <h2>Visually Orchestrate Complex Multi-Omic Pipelines</h2>
                        <p>
                            Interact with the graph below. <strong>Click & Drag</strong> nodes to reposition them, drag the background to pan, and use the controls to zoom in and out.
                        </p>
                    </div>
                    <div style={{ marginTop: '2rem' }}>
                        {/* Diagrama maior configurado para vertical */}
                        <InteractiveDiagram nodes={largeNodes} edges={largeEdges} height="650px" orientation="vertical" />
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="landing-cta">
                <div className="landing-section-inner" style={{ textAlign: 'center' }}>
                    <h2>Built for Researchers, Clinicians, and Bioinformaticians</h2>
                    <p>
                        From academic genome centers to clinical diagnostic laboratories — SeqNode-OS scales
                        from a single workstation to distributed HPC environments.
                    </p>
                    <div className="landing-hero-actions" style={{ marginTop: '1.5rem', justifyContent: 'center' }}>
                        <button className="landing-btn-primary landing-btn-lg" onClick={handleLaunch}>
                            ▶ Launch Application
                        </button>
                        <button className="landing-btn-outline landing-btn-lg" onClick={() => navigate('/help')}>
                            📖 View Documentation
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="landing-section-inner landing-footer-inner">
                    <span className="landing-logo">🧬 SeqNode-OS</span>
                    <div className="landing-footer-links">
                        <button onClick={() => navigate('/help')}>Documentation</button>
                        <button onClick={() => navigate('/login')}>Login</button>
                        <button onClick={handleLaunch}>Application</button>
                    </div>
                    <span className="landing-footer-tagline">
                        Open-source bioinformatics pipeline orchestration — designed for precision genomics
                    </span>
                    <span className="landing-footer-copy">
                        &copy; {new Date().getFullYear()} SeqNode-OS — Open Source Bioinformatics Platform
                    </span>
                </div>
            </footer>

        </div>
    );
}