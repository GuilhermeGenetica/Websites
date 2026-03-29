/**
 * pages/Help.jsx — SeqNode-OS Full Documentation & Help Page
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth.js';

/* ──────────────────────────────────────────────────────────
   Sidebar sections
   ────────────────────────────────────────────────────────── */
const SECTIONS = [
    { id: 'overview',     label: '🏠 Overview',            group: null },
    { id: 'quickstart',   label: '⚡ Quick Start',          group: null },
    { id: 'canvas',       label: '🖼 Canvas',               group: 'Workflow Builder' },
    { id: 'nodes',        label: '🧩 Node Types',           group: 'Workflow Builder' },
    { id: 'plugins',      label: '🔧 YAML Plugins',         group: 'Workflow Builder' },
    { id: 'props',        label: '📋 Properties Panel',     group: 'Workflow Builder' },
    { id: 'aibuilder',   label: '🤖 AI Workflow Builder',  group: 'Workflow Builder' },
    { id: 'execution',    label: '▶ Execution',             group: 'Running Pipelines' },
    { id: 'logs',         label: '📋 Execution Logs',       group: 'Running Pipelines' },
    { id: 'agent',        label: '🤖 Agent Installation',   group: 'Running Pipelines' },
    { id: 'depanalysis',  label: '🔍 Dep. Analysis',        group: 'Running Pipelines' },
    { id: 'settings',     label: '⚙ Settings',             group: 'Configuration' },
    { id: 'references',   label: '🧬 References',           group: 'Configuration' },
    { id: 'shortcuts',    label: '⌨ Shortcuts',            group: 'Reference' },
    { id: 'deployment',   label: '🚀 Deployment',           group: 'Reference' },
    { id: 'faq',          label: '❓ Troubleshooting',      group: 'Reference' },
];

const SHORTCUTS = [
    { key: 'Ctrl + A',           action: 'Select all nodes' },
    { key: 'Del / Backspace',    action: 'Delete selected node(s) or edge(s)' },
    { key: 'Ctrl + C',           action: 'Copy selected node(s) with all properties' },
    { key: 'Ctrl + V',           action: 'Paste copied node(s) onto canvas' },
    { key: 'Scroll Wheel',       action: 'Zoom in / out on canvas' },
    { key: 'Click + Drag (bg)',  action: 'Pan the canvas view' },
    { key: 'Click + Drag (node)','action': 'Move node position' },
    { key: 'Lasso Drag',         action: 'Multi-select nodes by area' },
];

const NODE_TYPES = [
    { name: 'Plugin Node',      icon: '🧩', color: '#6366f1',
      desc: 'Runs a bioinformatics tool defined by a YAML plugin (BWA, GATK, SAMtools, BCFtools, BEDtools, SnpEff, VEP, etc.). Configured via the properties panel on the right.' },
    { name: 'Shell Node',       icon: '💻', color: '#0ea5e9',
      desc: 'Executes arbitrary bash (or shell) commands. Supports multi-line scripts, environment variable substitution, and upstream input references.' },
    { name: 'Condition Node',   icon: '🔀', color: '#f59e0b',
      desc: 'Branches the pipeline based on a Python expression. Has two outputs: true (left) and false (right). Access upstream values via the expression context.' },
    { name: 'Loop Node',        icon: '🔁', color: '#10b981',
      desc: 'Iterates over a list of samples or files, running the downstream sub-graph once for each element. Outputs are collected into a merged list.' },
    { name: 'Pause Node',       icon: '⏸', color: '#8b5cf6',
      desc: 'Pauses execution and waits for manual approval in the interface before continuing. Useful for QC checkpoints.' },
    { name: 'SubWorkflow Node', icon: '📂', color: '#64748b',
      desc: 'Embeds and executes another saved workflow as a sub-process. Inputs and outputs are forwarded between the parent and child workflows.' },
    { name: 'AI Agent Node',    icon: '🤖', color: '#ec4899',
      desc: 'Integrates a large-language model (LLM) for analysis, annotation interpretation or dynamic command generation. Configure the provider in Settings → Auth.' },
];

const SETTINGS_TABS = [
    { tab: '📁 Directories',      desc: 'Configure server-side paths: plugins, workflows, references, working, output, temp, logs and state directories.' },
    { tab: '⚙ Execution',         desc: 'Resource limits (threads, memory), shell path, timeout, retry policy, and conda environment.' },
    { tab: '🚀 Runner',           desc: 'Select local or SLURM runner, state backend (JSON or SQLite), and SLURM cluster parameters.' },
    { tab: '🎨 Interface',        desc: 'Theme (dark/light), canvas grid, snap-to-grid, auto-save interval, minimap toggle, and log line limit.' },
    { tab: '🧩 Plugin Paths',     desc: 'Per-plugin binary paths and reference library directories (overrides PATH detection).' },
    { tab: '🔧 Plugin Defaults',  desc: 'Global parameter value overrides for specific plugins.' },
    { tab: '🧬 References',       desc: 'Manage reference genome catalogue — browse, download and track reference files.' },
    { tab: '🔑 Auth',             desc: 'LLM provider configuration (API Key, model, base URL) for AI features. Keys are encrypted in MySQL and persist across sessions.' },
    { tab: '👤 Profile',          desc: 'User profile, institution info, contact details and password change.' },
    { tab: '🤖 Agent',            desc: 'Agent token management, connected agents, and installation instructions.' },
];

const FAQ = [
    { q: 'The workflow executes but nothing happens / nodes stay PENDING',
      a: 'Check the VPS connection: the toolbar shows "☁ VPS Server" if no agent is connected. Ensure the FastAPI server is running on the VPS and the WebSocket port (8000) is open in the firewall.' },
    { q: 'WebSocket disconnects frequently',
      a: 'This is usually a proxy timeout. If using nginx in front of the VPS, add proxy_read_timeout 3600 and proxy_send_timeout 3600 to the WebSocket location block.' },
    { q: 'I get "VPS offline" warnings in settings',
      a: 'UI preferences (theme, etc.) are always saved to MySQL (Hostinger). Full engine settings are saved to the VPS — these warnings are safe to ignore if the VPS is temporarily down.' },
    { q: 'The agent connects but execution still runs on VPS',
      a: 'Make sure the agent token in Settings → Agent matches the token configured in agent.py. Check agent status with python agent.py status and confirm the toolbar shows your hostname.' },
    { q: 'pip install websockets psutil fails',
      a: 'Ensure Python 3.10+ is installed. On some systems use pip3 instead of pip. If pip is not found, install it with: python -m ensurepip --upgrade.' },
    { q: 'Email verification link is not arriving',
      a: 'Check spam / junk folder. Ensure MAIL_HOST, MAIL_PORT, MAIL_USERNAME and MAIL_PASSWORD are correctly configured in public/api/.env. For Gmail, use smtp.gmail.com:587 with an App Password (not your login password).' },
    { q: 'Plugins are not showing in the sidebar',
      a: 'Click ⚙ Settings → Agent → Token tab to confirm the VPS is reachable. Try reloading plugins from Settings → Plugin Paths → Sync. Check that the YAML files exist in the configured plugins directory.' },
    { q: 'Reset password link expired',
      a: 'Reset links expire after 1 hour. Request a new one from the /forgot-password page.' },
    { q: 'AI Workflow Builder returns 503 "AI builder module unavailable"',
      a: 'The Python AI builder module failed to import at server startup — usually a missing dependency or a syntax error in api/ai_workflow_builder.py. Redeploy the latest api/ai_workflow_builder.py and core/server.py to the VPS and restart the server. Check the server log with: tail -f seqnode_engine.log' },
    { q: 'AI Builder is stuck on "Generating…" indefinitely',
      a: 'Requests time out automatically after 90 seconds. If this happens, check that your LLM API key and model are correctly configured in Settings → Auth. Use the diagnose_ai.php diagnostic tool to test direct LLM connectivity. Complex prompts to slower models (Opus, GPT-4o) can take 30–60 s.' },
    { q: 'LLM API key disappears after re-login',
      a: 'LLM settings (API key, provider, model) are now stored encrypted in Hostinger MySQL and restored on every login. Make sure you click Apply & Save after entering your key, and that the updated UserSettingsController.php has been deployed to Hostinger.' },
    { q: 'Verification email not received — I deleted it from spam',
      a: 'Go to the /login page and click "Resend verification email" (bottom-left of the login form). Enter your email address and a fresh 24-hour verification link will be sent. You can request up to 3 resends per hour.' },
];

/* ──────────────────────────────────────────────────────────
   Sub-components
   ────────────────────────────────────────────────────────── */

function Code({ children, lang }) {
    return (
        <pre className="help-code">
            <code>{children}</code>
        </pre>
    );
}

function InfoBox({ icon = '💡', title, children }) {
    return (
        <div className="help-info-box">
            <strong>{icon} {title}</strong>
            <div style={{ marginTop: 8 }}>{children}</div>
        </div>
    );
}

function WarnBox({ icon = '⚠️', title, children }) {
    return (
        <div className="help-warning-box">
            <strong>{icon} {title}</strong>
            <div style={{ marginTop: 8 }}>{children}</div>
        </div>
    );
}

function Table({ headers, rows }) {
    return (
        <table className="help-table">
            <thead>
                <tr>{headers.map((h, i) => <th key={i}>{h}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((row, i) => (
                    <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
                ))}
            </tbody>
        </table>
    );
}

/* ──────────────────────────────────────────────────────────
   Main Help page
   ────────────────────────────────────────────────────────── */

export default function Help() {
    const navigate    = useNavigate();
    const [active,    setActive]    = useState('overview');
    const [menuOpen,  setMenuOpen]  = useState(false);
    const contentRef  = useRef(null);

    const [theme, setTheme] = useState(() => localStorage.getItem('seqnode-theme') || 'dark');

    useEffect(() => {
        document.body.className = 'theme-' + theme;
        localStorage.setItem('seqnode-theme', theme);
    }, [theme]);

    const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

    const scrollTo = (id) => {
        setActive(id);
        setMenuOpen(false);
        document.getElementById('help-sec-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* Group sidebar sections */
    const sidebarGroups = [];
    const _SENTINEL = {};          // unique reference — never equals null or any string
    let currentGroup = _SENTINEL;
    for (const s of SECTIONS) {
        if (s.group !== currentGroup) {
            currentGroup = s.group;
            sidebarGroups.push({ group: s.group, items: [s] });
        } else {
            sidebarGroups[sidebarGroups.length - 1].items.push(s);
        }
    }

    return (
        <div className="help-root">

            {/* ── Navbar ── */}
            <nav className="landing-nav">
                <div className="landing-nav-inner">
                    <span className="landing-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
                        🧬 SeqNode-OS
                    </span>
                    <div className="landing-nav-links">
                        
                        <button className="landing-btn-outline" onClick={() => navigate('/')}>← Home</button>
                        <button className="landing-btn-primary"
                            onClick={() => navigate(isAuthenticated() ? '/app' : '/login')}>
                            {isAuthenticated() ? 'Open App' : 'Sign In'}
                        </button>
                        <button className="help-menu-toggle" onClick={() => setMenuOpen(v => !v)}>☰</button>
                        <button className="theme-toggler" onClick={toggleTheme} title="Theme Toggle">
                            {theme === 'dark' ? '☀️' : '🌙'}
                            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Layout ── */}
            <div className="help-layout">

                {/* Sidebar */}
                <aside className={'help-sidebar' + (menuOpen ? ' help-sidebar-open' : '')}>
                    <div className="help-sidebar-title">Documentation</div>
                    <nav className="help-sidebar-nav">
                        {sidebarGroups.map((g, gi) => (
                            <div key={gi}>
                                {g.group && (
                                    <div style={{
                                        padding: '10px 16px 4px',
                                        fontSize: 10,
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.8px',
                                        color: 'var(--text-disabled, #555)',
                                    }}>
                                        {g.group}
                                    </div>
                                )}
                                {g.items.map(s => (
                                    <button key={s.id}
                                        className={'help-sidebar-item' + (active === s.id ? ' help-sidebar-active' : '')}
                                        onClick={() => scrollTo(s.id)}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="help-main">
                    <div className="help-content" ref={contentRef}>

                        {/* ═══════════════════════════════════════════════════
                            OVERVIEW
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-overview" className="help-section">
                            <h2>🏠 Overview</h2>
                            <p>
                                <strong>SeqNode-OS</strong> is an open-source platform for the visual
                                orchestration of bioinformatics pipelines. Build, configure and execute
                                complex analysis workflows — from quality control to variant annotation —
                                directly in your browser, without writing scripts or YAML by hand.
                            </p>

                            <h3>Architecture</h3>
                            <InfoBox title="System Components">
                                <ul>
                                    <li>
                                        <strong>React Frontend</strong> — Visual interface hosted as a
                                        static site on Hostinger (or any static server / CDN).
                                    </li>
                                    <li>
                                        <strong>PHP Backend</strong> — Thin layer on Hostinger handling
                                        authentication (JWT), user profiles (MySQL) and proxying API
                                        calls to the VPS. All routes under <code>/api/</code>.
                                    </li>
                                    <li>
                                        <strong>Python FastAPI (VPS)</strong> — Execution engine running
                                        on an Oracle / AWS / Hetzner VPS. Handles workflow validation,
                                        node execution, plugin management, file system operations and
                                        reference genome downloads.
                                    </li>
                                    <li>
                                        <strong>WebSocket</strong> — Direct connection from the browser
                                        to the VPS (<code>wss://api.seqnode.onnetweb.com/ws</code>).
                                        Delivers real-time logs and node status updates without polling.
                                    </li>
                                    <li>
                                        <strong>SeqNode Agent</strong> — Optional Python daemon that
                                        runs on your local workstation or lab server. It opens a secure
                                        outbound WebSocket to the VPS, allowing your local machine to
                                        execute pipelines without exposing any ports.
                                    </li>
                                </ul>
                            </InfoBox>

                            <h3>Supported Bioinformatics Tools</h3>
                            <p>SeqNode-OS ships with pre-built YAML plugins for 14+ tools:</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
                                {['BWA-MEM2','SAMtools','GATK','BCFtools','BEDtools','SnpEff','VEP (Ensembl)','Trimmomatic','FastQC','Minimap2','DeepVariant','HISAT2','featureCounts','MultiQC'].map(t => (
                                    <span key={t} style={{
                                        padding: '4px 10px', borderRadius: 5, fontSize: 12,
                                        background: 'rgba(99,102,241,.12)', color: '#818cf8',
                                        border: '1px solid rgba(99,102,241,.25)',
                                    }}>{t}</span>
                                ))}
                            </div>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                Additional tools can be added as custom YAML plugins — see the
                                <button style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 13 }}
                                    onClick={() => scrollTo('plugins')}>YAML Plugins</button> section.
                            </p>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            QUICK START
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-quickstart" className="help-section">
                            <h2>⚡ Quick Start</h2>

                            <h3>1. Sign In</h3>
                            <ol>
                                <li>Go to <strong>seqnode.onnetweb.com/login</strong> and sign in with your credentials.</li>
                                <li>If you don't have an account, click <strong>Create Account</strong> and verify your email.</li>
                            </ol>

                            <h3>2. Build Your First Workflow</h3>
                            <ol>
                                <li>Click <strong>📄 New</strong> in the toolbar to start a blank workflow.</li>
                                <li>Browse the left sidebar and <strong>drag a plugin</strong> (e.g. BWA-MEM2) onto the canvas.</li>
                                <li>Click the node to select it — its parameters appear in the <strong>right Properties panel</strong>.</li>
                                <li>Fill in required inputs (files, parameters). Use the 📂 browse button to select server-side files.</li>
                                <li>Drag more nodes and <strong>connect them</strong>: drag from an output handle (right side) to an input handle (left side) of the next node.</li>
                                <li>Click <strong>✔ Validate</strong> to check for missing inputs or configuration errors.</li>
                                <li>Click <strong>▶ Execute</strong> to run the pipeline.</li>
                            </ol>

                            <h3>3. Monitor Execution</h3>
                            <p>
                                The <strong>Execution Log</strong> panel at the bottom streams real-time output.
                                Each node on the canvas changes colour to reflect its status:
                                grey (pending) → blue (running) → green (completed) → red (failed).
                            </p>

                            <WarnBox title="WebSocket connection">
                                <p>
                                    The WebSocket (<code>wss://api.seqnode.onnetweb.com/ws</code>) connects
                                    <em> directly</em> from your browser to the VPS — it is not proxied through PHP.
                                    If you see "IDLE" in the status badge but execution does not start, check that
                                    the VPS is reachable and port 8000 is open.
                                </p>
                            </WarnBox>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            CANVAS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-canvas" className="help-section">
                            <h2>🖼 Canvas</h2>
                            <p>
                                The canvas is the central workspace where you visually design pipelines
                                by placing and connecting nodes.
                            </p>

                            <h3>Navigation</h3>
                            <Table
                                headers={['Action', 'How to']}
                                rows={[
                                    ['Pan',             'Click and drag on the canvas background'],
                                    ['Zoom in/out',     'Scroll wheel, or use the +/– controls (bottom-left)'],
                                    ['Add node',        'Drag a plugin from the left sidebar onto the canvas'],
                                    ['Connect nodes',   'Drag from a right output handle → to a left input handle'],
                                    ['Disconnect edge', 'Click the edge to select it, then press Del'],
                                    ['Multi-select',    'Lasso drag on empty canvas, or Ctrl + A to select all'],
                                    ['Move nodes',      'Drag selected nodes to reposition'],
                                    ['Fit view',        'Press the ⊞ Fit button in the bottom-left controls'],
                                ]}
                            />

                            <h3>Toolbar Buttons</h3>
                            <Table
                                headers={['Button', 'Function']}
                                rows={[
                                    ['📄 New',         'Clear the canvas and start a new blank workflow'],
                                    ['💾 Save',        'Save the current workflow to the server'],
                                    ['📂 Load',        'Open a previously saved workflow'],
                                    ['⬇ Export',       'Download the workflow as a JSON file'],
                                    ['🔍 Dep. Analysis','Check whether all required tools and references are available'],
                                    ['⚙ Settings',     'Open the settings panel'],
                                    ['ℹ Info',         'Show system information (VPS resources, versions)'],
                                    ['✔ Validate',     'Validate workflow connectivity and required inputs before running'],
                                    ['▶ Execute',      'Execute the validated workflow'],
                                    ['■ Cancel',       'Cancel a running execution'],
                                ]}
                            />

                            <h3>Status Badge</h3>
                            <Table
                                headers={['Badge', 'Meaning']}
                                rows={[
                                    ['IDLE',      'No workflow is running'],
                                    ['RUNNING',   'Pipeline is executing'],
                                    ['COMPLETED', 'All nodes finished successfully'],
                                    ['FAILED',    'One or more nodes failed — check the log'],
                                    ['CANCELLED', 'Execution was stopped manually'],
                                ]}
                            />

                            <h3>Execution Target Badge</h3>
                            <p>
                                To the left of the status badge, a coloured pill shows where execution will run:
                            </p>
                            <ul>
                                <li><strong style={{ color: '#22c55e' }}>🖥 hostname</strong> — a SeqNode Agent is connected on your machine</li>
                                <li><strong style={{ color: '#f59e0b' }}>☁ VPS Server</strong> — no agent connected; executes on the VPS directly</li>
                            </ul>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            NODE TYPES
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-nodes" className="help-section">
                            <h2>🧩 Node Types</h2>
                            <p>
                                Each node represents one step in the pipeline. Nodes are dragged from
                                the sidebar — plugins appear under their category; special nodes appear
                                below the plugin list.
                            </p>
                            <div className="help-nodes-grid">
                                {NODE_TYPES.map((n, i) => (
                                    <div className="help-node-card" key={i}
                                        style={{ borderLeft: `3px solid ${n.color}` }}>
                                        <span className="help-node-icon" style={{ fontSize: 28 }}>{n.icon}</span>
                                        <div>
                                            <strong style={{ color: n.color }}>{n.name}</strong>
                                            <p style={{ margin: '4px 0 0', fontSize: 13 }}>{n.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h3>Node Handles</h3>
                            <p>
                                Each node has coloured handles on its left (inputs) and right (outputs) edges.
                                Drag from an output handle to an input handle of a downstream node to create a
                                connection (edge). Edges carry data — the output value of an upstream node
                                becomes the input value of the downstream node.
                            </p>
                            <InfoBox title="Upstream references">
                                <p>
                                    In string and command fields, you can reference the output of an upstream
                                    node using the syntax <code>$nodeId.outputKey</code>. These are resolved
                                    automatically at execution time.
                                </p>
                            </InfoBox>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            YAML PLUGINS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-plugins" className="help-section">
                            <h2>🔧 YAML Plugins</h2>
                            <p>
                                Each plugin is a <code>.yaml</code> file that defines a bioinformatics tool.
                                Plugins live in the <code>plugins/</code> directory on the VPS.
                                Custom plugins are fully supported — place any valid YAML file in that directory
                                and click <strong>Reload Plugins</strong> in the sidebar.
                            </p>

                            <h3>Plugin YAML Structure</h3>
                            <Code>{`id: bwa_mem
name: BWA-MEM2 Alignment
category: Alignment
description: Aligns paired FASTQ reads against a reference genome using BWA-MEM2

inputs:
  - id: fastq_r1
    label: FASTQ R1
    type: file
    required: true
    extensions: .fastq,.fastq.gz,.fq,.fq.gz
  - id: fastq_r2
    label: FASTQ R2
    type: file
    required: false
  - id: reference
    label: Reference FASTA
    type: file
    required: true

outputs:
  - id: bam
    label: Aligned BAM
    type: file

params:
  - id: threads
    label: Threads
    type: int
    default: 8
  - id: extra_flags
    label: Extra flags
    type: string
    default: ""

command: >
  bwa-mem2 mem
    -t {threads}
    {extra_flags}
    {reference}
    {fastq_r1} {fastq_r2}
  | samtools sort -@ {threads} -o {bam}
  && samtools index {bam}`}</Code>

                            <h3>Field Types</h3>
                            <Table
                                headers={['Type', 'Description', 'UI Control']}
                                rows={[
                                    ['file',      'Path to a single file',                        'Browse button + text input'],
                                    ['directory', 'Path to a directory',                          'Browse button + text input'],
                                    ['string',    'Free text value',                              'Text input'],
                                    ['int',       'Integer number',                               'Number input'],
                                    ['float',     'Decimal number',                               'Number input'],
                                    ['boolean',   'True / False',                                 'Toggle checkbox'],
                                    ['select',    'One option from a predefined list',            'Dropdown select'],
                                ]}
                            />

                            <h3>Personal Plugins (My Plugins)</h3>
                            <p>
                                If you have the SeqNode Agent running, you can configure a <em>local plugins
                                directory</em> in Settings → Directories → My Plugins Directory. YAML files
                                in that folder are shown in the sidebar tagged with a blue
                                <span style={{ fontSize: 10, padding: '1px 5px', background: 'rgba(74,158,255,.2)', color: '#4a9eff', borderRadius: 3, marginLeft: 4 }}>MY</span> badge.
                            </p>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            PROPERTIES PANEL
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-props" className="help-section">
                            <h2>📋 Properties Panel</h2>
                            <p>
                                Click any node on the canvas to open its properties in the right-hand panel.
                            </p>
                            <Table
                                headers={['Section', 'Description']}
                                rows={[
                                    ['Node Label',    'Rename the node for readability. Does not affect execution.'],
                                    ['Inputs',        'Set file paths, directories, or reference upstream node outputs ($nodeId.key).'],
                                    ['Parameters',    'Configure tool-specific settings (threads, flags, thresholds, etc.).'],
                                    ['Outputs',       'Define output file paths. Use auto-output badges to inherit from the working directory.'],
                                    ['Conda Env',     'Override the global conda environment for this specific node.'],
                                    ['Notes',         'Free-text annotation for documentation purposes.'],
                                ]}
                            />

                            <h3>File Browser</h3>
                            <p>
                                Click the 📂 browse button next to any file or directory field to open the
                                server-side filesystem browser. This browser navigates the VPS (or agent)
                                filesystem and returns absolute paths — unlike the native browser file dialog,
                                it gives you real server-side paths.
                            </p>

                            <h3>Input Badges</h3>
                            <p>
                                Input fields may show coloured badges explaining how the value is resolved:
                            </p>
                            <ul>
                                <li><strong>DIR</strong> — expects a directory path (not a file)</li>
                                <li><strong>AUTO</strong> — path is auto-generated in the working directory</li>
                                <li><strong>↑ upstream</strong> — value is pulled from an upstream node's output</li>
                                <li><strong>MULTI</strong> — accepts a list of files (e.g. batch processing)</li>
                            </ul>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            AI WORKFLOW BUILDER
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-aibuilder" className="help-section">
                            <h2>🤖 AI Workflow Builder</h2>
                            <p>
                                The <strong>AI Workflow Builder</strong> converts a natural-language description
                                of your analysis into a fully connected SeqNode-OS workflow in seconds.
                                Open it by clicking <strong>🤖 Build with AI</strong> in the toolbar — it opens
                                in the right-hand properties panel.
                            </p>

                            <InfoBox title="LLM configuration required">
                                Configure your LLM provider in <strong>Settings → Auth</strong> before using
                                the builder. Supported providers: Anthropic (Claude), Google Gemini, OpenAI,
                                xAI Grok, Ollama (local), and any OpenAI-compatible endpoint. Your API key
                                is encrypted in MySQL and persists across logins.
                            </InfoBox>

                            <h3>Generating a Workflow</h3>
                            <ol>
                                <li>Describe your pipeline in plain English (e.g. <em>"Align paired-end reads with BWA-MEM, sort with SAMtools, call variants with GATK HaplotypeCaller"</em>).</li>
                                <li>Optionally list input file paths — the LLM uses them to configure input fields.</li>
                                <li>Click <strong>✨ Generate Workflow</strong>.</li>
                                <li>A progress log shows elapsed time; requests time out automatically after 90 seconds.</li>
                                <li>Review the summary — workflow name, node count, edge count, and validation messages.</li>
                                <li>Click <strong>📥 Load into Canvas</strong>.</li>
                            </ol>

                            <h3>Plugin Resolution</h3>
                            <p>
                                If the generated workflow references tools that are not yet installed,
                                a <strong>Plugin Resolution</strong> panel appears for each missing tool:
                            </p>
                            <Table
                                headers={['Option', 'What happens']}
                                rows={[
                                    ['➕ Create YAML', 'The LLM generates a SeqNode-OS plugin YAML for the tool, writes it to your agent\'s plugins directory, scans it, and adds the node to the canvas automatically.'],
                                    ['🐚 Shell Cmd',  'Replaces the missing plugin with a Shell Command node containing a descriptive placeholder bash command you can edit.'],
                                ]}
                            />

                            <h3>Navigation History</h3>
                            <p>
                                Use the ← / → arrows at the top of the panel to navigate between previously
                                generated results without losing them. A <em>1/3</em> badge shows your
                                position in the history stack. You can also refine any result in the history
                                by typing a feedback instruction and clicking <strong>🔄 Refine Workflow</strong>.
                            </p>

                            <h3>Tips for Better Results</h3>
                            <ul>
                                <li>Name tools explicitly (BWA-MEM2, GATK HaplotypeCaller, SAMtools sort).</li>
                                <li>Mention the data type (WGS, WES, RNA-seq, long-read).</li>
                                <li>Specify the reference genome (hg38, GRCh37, GRCm39) if applicable.</li>
                                <li>Provide sample input file paths for automatic input wiring.</li>
                                <li>Larger/slower models (Opus, GPT-4o) produce more accurate workflows but may take 30–60 s.</li>
                            </ul>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            EXECUTION
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-execution" className="help-section">
                            <h2>▶ Execution</h2>

                            <h3>Running a Workflow</h3>
                            <ol>
                                <li>Click <strong>✔ Validate</strong> — fix any reported errors first.</li>
                                <li>Click <strong>▶ Execute</strong>.</li>
                                <li>Watch nodes change colour in real time and follow the log panel below.</li>
                                <li>Click <strong>■ Cancel</strong> to stop a running execution.</li>
                            </ol>

                            <h3>Execution Modes</h3>
                            <Table
                                headers={['Mode', 'Description']}
                                rows={[
                                    ['System',   'Tools must be available in the server PATH. Default mode.'],
                                    ['Conda',    'Every command is wrapped in conda run -n <env>. Configure the environment in Settings → Execution.'],
                                    ['SLURM',    'Submits each node as a SLURM job on an HPC cluster. Configure in Settings → Runner.'],
                                ]}
                            />

                            <h3>Node Status Colours</h3>
                            <Table
                                headers={['Colour', 'Status']}
                                rows={[
                                    ['Grey',  'PENDING — not yet started'],
                                    ['Blue',  'RUNNING — currently executing'],
                                    ['Green', 'COMPLETED — finished successfully'],
                                    ['Red',   'FAILED — check the log for the error message'],
                                    ['Yellow','SKIPPED — condition node sent execution down the other branch'],
                                ]}
                            />

                            <h3>Pause Nodes</h3>
                            <p>
                                When a <strong>Pause Node</strong> is reached, execution stops and a dialog
                                appears asking for manual approval. Review the log output, then click
                                <strong> Continue</strong> or <strong>Abort</strong>.
                            </p>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            EXECUTION LOGS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-logs" className="help-section">
                            <h2>📋 Execution Logs</h2>
                            <p>
                                The log panel at the bottom of the screen streams real-time output from
                                every tool. Drag the resizer bar up to expand it.
                            </p>

                            <Table
                                headers={['Control', 'Action']}
                                rows={[
                                    ['📜 Full / 📢 Compact', 'Toggle between showing all log lines or only command output and errors'],
                                    ['Clear',               'Clear all log lines from the current session'],
                                    ['⊞',                   'Expand the log panel to full screen'],
                                    ['▼ / ▲',               'Collapse or expand the log panel'],
                                    ['Drag resizer',        'Resize the log panel height by dragging the line above it'],
                                ]}
                            />

                            <InfoBox title="Log sources">
                                <p>
                                    Each log line is prefixed with its source: <code>[system]</code>,
                                    <code>[engine]</code>, <code>[node-id]</code>, <code>[refs]</code>, etc.
                                    ERROR lines appear in red, WARN in orange, and INFO in the default colour.
                                </p>
                            </InfoBox>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            AGENT INSTALLATION
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-agent" className="help-section">
                            <h2>🤖 Agent Installation</h2>
                            <p>
                                The SeqNode Agent is a Python daemon that runs on your local workstation
                                or lab server. It establishes an outbound WebSocket connection to
                                <code> wss://api.seqnode.onnetweb.com/ws/agent</code> — no open ports or
                                firewall rules are needed on your machine.
                            </p>

                            <InfoBox title="Get your Agent Token first">
                                <p>
                                    Go to <strong>⚙ Settings → Agent → Token</strong> tab inside the app,
                                    generate a token and copy it. You will need it in the init step below.
                                </p>
                            </InfoBox>

                            <h3>Option A — Python Script (Linux / macOS)</h3>
                            <Code>{`# 1. Install dependencies
pip install websockets psutil

# 2. Navigate to the agent folder
cd /path/to/SEQNODE/agent

# 3. Initialize (replace YOUR_TOKEN with the token from Settings → Agent)
python agent.py init \\
  --server wss://api.seqnode.onnetweb.com/ws/agent \\
  --token YOUR_TOKEN \\
  --workspace ~/seqnode-workspace \\
  --label "My Linux Machine"

# 4. Start (foreground — see logs)
python agent.py start

# 4b. Start as background daemon (Linux/macOS only)
python agent.py start --daemon

# Check status
python agent.py status

# Stop background daemon
python agent.py stop`}</Code>

                            <h3>Option A — Python Script (Windows)</h3>
                            <Code>{`:: 1. Install dependencies
pip install websockets psutil

:: 2. Navigate to the agent folder (adjust path as needed)
cd C:\\path\\to\\SEQNODE\\agent

:: 3. Initialize (replace YOUR_TOKEN)
python agent.py init --server wss://api.seqnode.onnetweb.com/ws/agent ^
  --token YOUR_TOKEN --workspace %USERPROFILE%\\seqnode-workspace ^
  --label "My Windows PC"

:: 4. Start (foreground)
python agent.py start

:: 4b. Start minimised in a new window (background on Windows)
start /min python agent.py start

:: Startup on login via Task Scheduler
schtasks /create /tn "SeqNodeAgent" /tr "python C:\\path\\to\\SEQNODE\\agent\\agent.py start" /sc onlogon /ru %USERNAME% /f`}</Code>

                            <h3>Option B — Standalone Executable (No Python needed)</h3>
                            <p>
                                Pre-built single-file executables are available for download.
                                Build them with:
                            </p>
                            <Code>{`# From the frontend/ root directory:
npm run build:agent
# Or directly:
cd agent && bash build.sh
# Copies binaries to public/downloads/agent/ automatically`}</Code>
                            <p>
                                Then download the binary for your platform from the
                                <strong> Settings → Agent → Installation</strong> tab inside the app and
                                follow the post-download instructions shown there.
                            </p>

                            <h3>How the Agent Works</h3>
                            <Table
                                headers={['Feature', 'Details']}
                                rows={[
                                    ['Reverse connection', 'Agent connects outbound — no open ports needed on your machine'],
                                    ['HMAC security',      'Every command from the server is cryptographically signed'],
                                    ['Workspace sandbox',  'Commands can only read/write inside the configured workspace path'],
                                    ['Log streaming',      'stdout/stderr of every tool is streamed line-by-line to the dashboard'],
                                    ['Auto-reconnect',     'Exponential backoff reconnect if the connection drops; local processes continue'],
                                ]}
                            />
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            DEPENDENCY ANALYSIS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-depanalysis" className="help-section">
                            <h2>🔍 Dependency Analysis</h2>
                            <p>
                                Click <strong>🔍 Dep. Analysis</strong> in the toolbar to check that all
                                required tools, reference genomes and conda environments are available
                                before running the workflow.
                            </p>

                            <Table
                                headers={['Check', 'What it validates']}
                                rows={[
                                    ['Tool binaries',      'Checks that each plugin\'s executable is in PATH or the configured binary path. Falls back to searching all conda environments automatically.'],
                                    ['Reference files',    'Verifies that referenced genome FASTA/index files exist at the configured paths'],
                                    ['Conda environments', 'Auto-detects the actual environment where the tool was found (via conda env list), overriding the YAML hint.'],
                                    ['Input file paths',   'Warns if input files pointed to in node properties do not exist'],
                                ]}
                            />

                            <p>
                                Results are shown as a colour-coded list:
                                ✅ available, ⚠️ warning (non-blocking), ❌ error (will prevent execution).
                            </p>
                            <InfoBox title="Automatic conda environment detection">
                                Dep. Analysis no longer relies on hardcoded environment names from plugin
                                YAML files. It runs <code>conda env list</code> on the agent machine and
                                searches every available environment for the required binary. The detected
                                environment name is reported in the results so you can verify it.
                            </InfoBox>
                            <InfoBox title="Tip">
                                <p>Run Dep. Analysis after installing new tools or before every important run to catch problems early.</p>
                            </InfoBox>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            SETTINGS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-settings" className="help-section">
                            <h2>⚙ Settings</h2>
                            <p>
                                Open settings via <strong>⚙ Settings</strong> in the toolbar (moved from the
                                sidebar footer). Settings are organised into tabs:
                            </p>
                            <Table
                                headers={['Tab', 'What you configure']}
                                rows={SETTINGS_TABS.map(s => [<strong>{s.tab}</strong>, s.desc])}
                            />

                            <h3>Saving Settings</h3>
                            <ul>
                                <li><strong>Apply &amp; Save</strong> — saves UI preferences, LLM config, directories, and auth settings to MySQL (always available) <em>and</em> full engine settings to the VPS (if online).</li>
                                <li><strong>Force Save (Admin Override)</strong> — skips directory access warnings and saves unconditionally.</li>
                                <li><strong>Reset Dirs</strong> — reverts all directory paths to their default values.</li>
                            </ul>

                            <InfoBox title="Per-user persistent settings">
                                LLM API keys, directory paths, and authentication tokens are stored
                                encrypted in Hostinger MySQL and restored automatically at every login —
                                even if the VPS is offline. You never need to re-enter your API key.
                            </InfoBox>

                            <WarnBox title="VPS offline warning">
                                <p>
                                    If the VPS is offline when you save, UI preferences, LLM config, and
                                    directories are still saved to MySQL (always accessible). Engine-only
                                    settings (execution config, conda paths) are only saved to the VPS.
                                    A warning is shown but this is non-critical.
                                </p>
                            </WarnBox>

                            <h3>Runner Tab — SQLite State Backend</h3>
                            <p>
                                SeqNode-OS supports two execution-state backends:
                            </p>
                            <Table
                                headers={['Backend', 'Description']}
                                rows={[
                                    ['JSON (default)', 'Each run state is stored as a .json file in the state directory. Simple, no setup required.'],
                                    ['SQLite',         'All run state is stored in a single seqnode.db file. Better for high-volume runs and concurrent access.'],
                                ]}
                            />
                            <p>
                                To switch to SQLite:
                            </p>
                            <ol>
                                <li>Set <strong>State Backend → sqlite</strong> in Settings → Runner.</li>
                                <li>Click <strong>🗃 Create SQLite Database</strong> — this initialises the schema.</li>
                                <li>Optionally click <strong>📦 JSON → SQLite</strong> to migrate existing run history.</li>
                                <li>Click <strong>Apply &amp; Save</strong>.</li>
                            </ol>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            REFERENCES
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-references" className="help-section">
                            <h2>🧬 Reference Genomes</h2>
                            <p>
                                SeqNode-OS includes a reference genome catalogue. Access it via
                                <strong> Settings → References</strong>.
                            </p>
                            <Table
                                headers={['Feature', 'Description']}
                                rows={[
                                    ['Browse catalogue',     'View available reference genomes (hg38, hg19, GRCm39, T2T-CHM13, etc.)'],
                                    ['Download',             'Click Download on any reference — progress is streamed to the log and a progress bar'],
                                    ['Track progress',       'Live progress bar per reference, updated via WebSocket'],
                                    ['Custom references',    'Copy FASTA + index files to the references directory and they appear as available'],
                                ]}
                            />
                            <p>
                                After a download completes, the reference is immediately available for use
                                in plugin nodes that require a reference FASTA.
                            </p>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            SHORTCUTS
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-shortcuts" className="help-section">
                            <h2>⌨ Keyboard Shortcuts</h2>
                            <Table
                                headers={['Key(s)', 'Action']}
                                rows={SHORTCUTS.map(s => [
                                    <kbd className="help-kbd">{s.key}</kbd>,
                                    s.action,
                                ])}
                            />
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            DEPLOYMENT
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-deployment" className="help-section">
                            <h2>🚀 Deployment Guide</h2>

                            <h3>Requirements</h3>
                            <Table
                                headers={['Component', 'Requirements']}
                                rows={[
                                    ['Hostinger (frontend + PHP)',  'PHP 8.0+, mod_rewrite enabled, cURL, MySQL'],
                                    ['VPS (Python backend)',        'Python 3.10+, pip, ports 8000 open (TCP)'],
                                    ['Domain / SSL',               'HTTPS required for WSS WebSocket; use Let\'s Encrypt + nginx'],
                                ]}
                            />

                            <h3>Step-by-step Deployment</h3>
                            <Code>{`# 1. Build the frontend (from the frontend/ root):
npm run build
# Generates the dist/ folder with all static assets + PHP backend

# 2. Upload dist/ to Hostinger public_html via FTP or hPanel File Manager

# 3. Edit public_html/api/.env on Hostinger:
APP_URL=https://yourdomain.com
DB_HOST=localhost
DB_NAME=your_db
DB_USER=your_user
DB_PASS=your_password
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=you@gmail.com
MAIL_PASSWORD=your-app-password    # Gmail App Password (16 chars)

# 4. On the VPS, install and start the Python backend:
pip install -r requirements.txt
python run_server.py
# Or with systemd / screen / nohup for production`}</Code>

                            <h3>Build Agent Executables (Option B)</h3>
                            <Code>{`# Build the agent binary for the current platform (Linux):
npm run build:agent
# Output: public/downloads/agent/seqnode-agent-<version>-linux-x86_64

# Then run npm run build to include the binary in dist/
npm run build
# Upload dist/ to Hostinger — downloads are served from /downloads/agent/`}</Code>

                            <h3>nginx Reverse Proxy (VPS)</h3>
                            <Code>{`# /etc/nginx/sites-available/seqnode-api
server {
    listen 443 ssl;
    server_name api.seqnode.onnetweb.com;

    ssl_certificate     /etc/letsencrypt/live/api.seqnode.onnetweb.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.seqnode.onnetweb.com/privkey.pem;

    location / {
        proxy_pass         http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade    $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host       $host;
        proxy_read_timeout  3600;
        proxy_send_timeout  3600;
    }
}`}</Code>

                            <InfoBox title="CORS / HTTPS">
                                <p>
                                    The frontend domain must be listed in <code>CORS_ALLOWED_ORIGINS</code> in
                                    <code> public/api/.env</code>. When using HTTPS on the frontend, the VPS
                                    must also serve WSS (not plain WS) — use nginx with a valid SSL certificate.
                                </p>
                            </InfoBox>
                        </section>

                        {/* ═══════════════════════════════════════════════════
                            FAQ / TROUBLESHOOTING
                            ═══════════════════════════════════════════════════ */}
                        <section id="help-sec-faq" className="help-section">
                            <h2>❓ Troubleshooting</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {FAQ.map((item, i) => (
                                    <details key={i} style={{
                                        background: 'var(--bg-tertiary, #1a1a2e)',
                                        border: '1px solid var(--border)',
                                        borderRadius: 8,
                                        padding: '14px 18px',
                                    }}>
                                        <summary style={{
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: 14,
                                            color: 'var(--text-primary)',
                                            userSelect: 'none',
                                        }}>
                                            {item.q}
                                        </summary>
                                        <p style={{
                                            margin: '12px 0 0',
                                            fontSize: 14,
                                            lineHeight: 1.65,
                                            color: 'var(--text-secondary)',
                                        }}>
                                            {item.a}
                                        </p>
                                    </details>
                                ))}
                            </div>

                            <h3 style={{ marginTop: 32 }}>Getting Support</h3>
                            <p>
                                If you encounter a problem not listed here:
                            </p>
                            <ul>
                                <li>Check the <strong>Execution Log</strong> panel — error messages are usually detailed.</li>
                                <li>Open <strong>ℹ Info</strong> in the toolbar to check VPS system resources and connectivity.</li>
                                <li>Run <code>python agent.py status</code> on your machine to confirm agent configuration.</li>
                                <li>Check the VPS log: <code>tail -f seqnode_engine.log</code></li>
                            </ul>
                        </section>

                    </div>
                </main>
            </div>
        </div>
    );
}
