# GuiDeCode — Personal Portfolio & Clinical WorkBench

> Personal website and subscription-based clinical platform of **Dr. Guilherme de Macedo Oliveira**, Medical Geneticist and Precision Medicine researcher.

[![Version](https://img.shields.io/badge/version-2.0.0-gold)](https://guilherme.onnetweb.com)
[![React](https://img.shields.io/badge/React-18-blue)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev)
[![PHP](https://img.shields.io/badge/Backend-PHP%208-777bb4)](https://php.net)
[![License](https://img.shields.io/badge/license-All%20Rights%20Reserved-red)](#license)

---

## Overview

This project is a full-stack web application composed of two layers:

1. **Landing Page / Portfolio** — A multilingual (English, Portuguese, Italian) personal website presenting academic background, research publications, a medical FAQ, and a contact form.
2. **WorkBench** — A subscription-gated, browser-based desktop environment designed for clinical and research workflows. Think: a windowed OS running in the browser, purpose-built for medicine and genetics.

---

## Live Demo

[https://guilherme.onnetweb.com](https://guilherme.onnetweb.com)

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 18 (SPA with lazy loading) |
| Build tool | Vite 5 |
| Styling | Tailwind CSS + custom CSS variables |
| Routing | React Router v6 |
| UI Components | shadcn/ui, Radix UI primitives |
| Icons | Lucide React |
| 3D Rendering | Three.js + react-force-graph-3d |
| Rich Text | Tiptap (ProseMirror-based editor) |
| Payments | Stripe.js |
| SEO | react-helmet |

### Backend
| Layer | Technology |
|---|---|
| Language | PHP 8 (REST API) |
| Database | MySQL / PDO |
| Auth | JWT tokens (Bearer) |
| Payments | Stripe Webhooks |
| Hosting | Apache + `.htaccess` routing |

---

## Features

### Landing Page
- **Multilingual** — full i18n in English, Portuguese, and Italian, switchable in one click
- **Dark/Light theme** — persisted preference via React Context
- **Academic CV modal** — inline curriculum with Lattes link
- **Publications section** — research output listing
- **FAQ section** — clinical and platform questions
- **Contact form** — routed to a PHP mailer backend
- **Responsive** — mobile-first, with animated scroll reveals

### WorkBench — Browser Desktop Environment
The WorkBench is a fully windowed desktop experience accessible at `/workbench`. Windows are draggable, resizable, minimizable, and maximizable.

#### Applications

| App | Group | Access |
|---|---|---|
| ⚙️ Settings | System | Free |
| 👤 Contacts | System | Free |
| 📋 Curriculum Vitae | System | Free |
| 📖 GuideLines | Medical | Free |
| 📝 Sticky Notes | System | Basic+ |
| 📁 File Manager | Tools | Basic+ |
| 🌐 Grapho MAP 3D | Research | Basic+ |
| 📅 Appointments | Medical | Basic+ |
| 🧮 Medical Calc | Medical | Basic+ |
| ✍️ Blog Manager | Admin | Admin only |
| 🗄️ DB Editor | Tools | Admin only |
| 📜 Script Viewer | Tools | Complete |
| 💻 Terminal | Tools | Basic+ |

#### Medical Calculator Library (`MedCalc`)
Over **90 validated clinical calculators**, organised by medical specialty:

- Cardiovascular / Vascular — CHA₂DS₂-VASc, GRACE, HEART Score, HAS-BLED, TIMI, Killip, QTc, Shock Index…
- Critical Care / ICU — SOFA, APACHE II, SAPS 2, RASS, CIWA-Ar, GCS, NUTRIC…
- Respiratory / Pulmonology — CURB-65, PSI, ROX Index, RSBI, SMART-COP, sPESI, PERC, Wells PE…
- Neurology / Stroke — NIHSS, ASPECTS, ABCD², ICH Score…
- Nephrology / Fluids — CKD-EPI (2021), Cockcroft-Gault, FENA, FEUrea, Anion Gap, Free Water Deficit, Bicarbonate Replacement…
- Gastroenterology / Hepatology — Child-Pugh, MELD-Na, FIB-4, Ranson, BISAP, R-Factor…
- Surgery / Trauma / Emergency — ISS, Alvarado, Parkland, NEXUS C-Spine, PECARN, Scorten…
- Clinical Genetics — ACMG/AMP 2015, CNV Classification, Hardy-Weinberg, Bayesian Penetrance, NIPT PPV, Gail Model, HAL Calculator…
- Pharmacology — Vancomycin Dosing, Heparin Infusion, Warfarin Pharmacogenetics, Vasopressor Converter…
- Psychiatry — PHQ-9, GAD-7, MMRC…
- Obstetrics — Bishop Score, Twin MOM Adjustment, Cohen-Daniel Viability, Post-Trisomy Recurrence…
- Pediatrics / Neonatology — APGAR, ETT Size, Maintenance Fluids, GIR…
- Nutrition — Harris-Benedict, NUTRIC, BED/EQD2…
- Clinical Utilities — BMI, BSA DuBois, Unit Converter, Dose by Weight/BSA, IV Drip Rate…

#### Grapho MAP 3D
An interactive 3D knowledge-graph editor for conceptual mapping. Supports custom node shapes (sphere, box, cone, torus, octahedron…), colours, rich-text annotations via Tiptap, edge styling, and presentation/animation modes.

#### GuideLines
A browsable library of clinical guidelines and medical reference documents.

#### File Manager
A sandboxed file explorer for browsing and downloading shared files, with path traversal protection.

#### Terminal
A web-based interactive terminal for executing server-side commands (restricted to authenticated subscribers).

---

## Architecture

```
/
├── src/                    # React frontend (Vite)
│   ├── landing/            # Homepage sections (Hero, About, FAQ…)
│   ├── pages/              # Route-level pages
│   ├── workbench/          # Desktop environment shell
│   │   ├── apps/           # Individual windowed applications
│   │   │   └── medcalc/    # Calculator engine + 90+ calculator definitions
│   │   └── workbench.css   # Desktop theming
│   ├── contexts/           # Auth, Theme, Workbench state
│   ├── services/           # API client functions
│   └── lib/                # i18n translations, utilities
│
├── api/                    # PHP REST backend
│   ├── config.php          # ⚠️ NOT in repository — see Environment Setup
│   ├── auth.php            # JWT login / register / profile
│   ├── blog.php            # Article CRUD
│   ├── workbench.php       # Notes, files, user preferences
│   ├── contact.php         # Contact form mailer
│   ├── terminal.php        # Shell command proxy
│   ├── stickernotes.php    # Sticky notes persistence
│   ├── stripe_webhook.php  # Stripe event handler
│   └── middleware.php      # Auth guards
│
├── public/                 # Static assets
└── index.html              # SPA entry point
```

---

## Subscription Plans

| Feature | Free | Basic ($3.90/mo) | Complete ($9.90/mo) |
|---|:---:|:---:|:---:|
| Landing page & CV | ✓ | ✓ | ✓ |
| GuideLines library | ✓ | ✓ | ✓ |
| Contacts app | ✓ | ✓ | ✓ |
| Sticky Notes | — | ✓ | ✓ |
| File Manager | — | ✓ | ✓ |
| Grapho MAP 3D | — | ✓ | ✓ |
| Appointments | — | ✓ | ✓ |
| Medical Calculators | — | — | ✓ |
| Terminal & Script Viewer | — | — | ✓ |
| All future apps | — | — | ✓ |

Payments are processed via **Stripe**. Subscription state is verified server-side on every protected API call.

---

## Environment Variables

Create a `.env` file at the project root (never commit this file):

```env
# API base URL (leave as /api for same-origin deployments)
VITE_API_URL=/api

# Site metadata
VITE_SITE_URL=https://your-domain.com
VITE_APP_NAME=WorkBench

# Stripe (publishable key only — safe for frontend)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

The backend `api/config.php` (not tracked by git) must define:

```php
// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'your_db');
define('DB_USER', 'your_user');
define('DB_PASS', 'your_password');

// JWT secret
define('JWT_SECRET', 'a-long-random-secret');

// Stripe secret key
define('STRIPE_SECRET_KEY', 'sk_live_...');
define('STRIPE_WEBHOOK_SECRET', 'whsec_...');

// Mailer credentials
define('SMTP_HOST', '...');
define('SMTP_USER', '...');
define('SMTP_PASS', '...');
```

---

## Security Notes

- `api/config.php` is excluded from version control and must never be committed.
- All API endpoints validate JWT tokens server-side via `middleware.php`.
- The File Manager enforces `realpath()` checks to prevent directory traversal.
- The Terminal is restricted to authenticated subscribers and sandboxed to a specific working directory.
- Stripe webhooks verify the `Stripe-Signature` header before processing any event.
- Admin-only apps (Blog Manager, DB Editor) are blocked at both the UI and API layers.

---

## Adding a New Calculator

Each calculator is a single self-contained `.js` file in `src/workbench/apps/medcalc/calculators/`. It exports a default object following the schema defined in `CALCULATOR_TEMPLATE.js`. The registry auto-discovers all files in that directory at build time — no manual registration required.

```js
// src/workbench/apps/medcalc/calculators/my_score.js
export default {
  id: 'my_score',
  name: 'My Clinical Score',
  shortDescription: 'Brief one-line description',
  system: 'cardiovascular',           // key from SYSTEMS in registry.js
  specialty: ['Cardiology'],
  tags: ['keyword1', 'keyword2'],
  fields: [
    { id: 'age', label: 'Age', type: 'number', unit: 'years', min: 0, max: 120 },
    // ...
  ],
  calculate(inputs) {
    // return { score, interpretation, risk, details }
  },
  references: ['Author et al. Journal. Year.'],
}
```

---

## Internationalisation

The app supports three languages switchable at runtime:

| Code | Language |
|---|---|
| `en` | English (default) |
| `pt` | Português |
| `it` | Italiano |

All UI strings live in `src/lib/translations.js`. To add a language, extend the `translations` object with a new key and add it to `SUPPORTED_LANGUAGES` in `config.js`.

---

## Author

**Dr. Guilherme de Macedo Oliveira**
Medical Geneticist · Precision Medicine Researcher

- 🌐 [guilherme.onnetweb.com](https://guilherme.onnetweb.com)
- 🎓 [Lattes CV](http://lattes.cnpq.br/5775056717193759)
- 🔬 [ResearchGate](https://www.researchgate.net/profile/Guilherme-Oliveira-113)

*MD — Faculdade de Medicina de Petrópolis · MSc Medicine Research — Instituto Oswaldo Cruz (Fiocruz) · Medical Genetics Residency — Instituto Fernandes Figueira (IFF/Fiocruz) · Degree Equivalence — Universidade do Porto*

---

## License

© 2025 Dr. Guilherme de Macedo Oliveira. All rights reserved.

This repository is made public for portfolio purposes. The source code may not be copied, modified, redistributed, or used commercially without explicit written permission from the author.

---

<p align="center"><sub>ΙΧΘΥΣ</sub></p>
