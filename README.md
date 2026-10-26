# BuildLink (Connect. Build. Grow.)

**Tagline:** Connect. Build. Grow.  
**Secondary Tagline:** Your Projects. Your Experts. One Community.  
**Supporting Message:** Building stronger communities for better homes.  
**Target Market:** Sri Lanka (Expandable globally)  
**Platform:** Next.js (App Router, Tailwind CSS, TypeScript), Express REST API (TypeScript, TypeORM), Microsoft SQL Server 2025 Express.

---

## 🏗️ Overview

BuildLink is a specialized digital platform that bridges homeowners, prospective builders, and construction enthusiasts with qualified and verified engineers and construction specialists.

### Core Pillars
1. **Construction Social Community:** Ask construction questions with photo uploads, share project milestones, discuss materials, and bookmark solutions.
2. **Verified Professional Directory:** Discover engineers by specialization, experience, language, and location with administrative credential verification.
3. **Consultations & Appointments:** Request 1-on-1 text, audio, video, or on-site consultations with scheduled appointments and review tracking.
4. **Knowledge Hub:** Curated, structured construction engineering guides, maintenance checklists, and regulatory references.

---

## 📁 Repository Structure

```text
buildlink/
├── apps/
│   ├── web/                        # Next.js 14+ App Router frontend
│   │   ├── app/                    # Layout, landing page, login, register
│   │   ├── components/             # Logo, Navbar, Footer
│   │   ├── public/                 # SVG logos, favicons
│   │   └── styles/                 # Tailwind & CSS design system
│   │
│   └── api/                        # Express TypeScript backend
│       └── src/
│           ├── config/             # Zod validated configuration
│           ├── database/           # TypeORM DataSource & entities
│           ├── middleware/         # Error handling, request logging
│           ├── routes/             # Health check, Swagger OpenAPI docs
│           └── server.ts           # Server bootstrap
│
├── packages/
│   └── shared/                     # Canonical DTOs, enums, constants
│
├── docs/                           # Architectural, DB, API & Security specs
├── package.json                    # Workspace orchestration
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v10.x or higher
- **Database:** Microsoft SQL Server 2025 Express (optional for initial offline/diagnostic mode; see [docs/deployment.md](docs/deployment.md)).

### 2. Installation
```bash
# Install all dependencies across workspaces
npm install
```

### 3. Build Shared Packages
```bash
npm run build --workspace=packages/shared
```

### 4. Run Development Servers
```bash
# Starts both Next.js Web and Express API
npm run dev

# Or run individually:
npm run dev:web  # Next.js frontend at http://localhost:3000
npm run dev:api  # Express REST API at http://localhost:5000/api/v1
```

### 5. Verify Health & OpenAPI Docs
- **API Health:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Interactive Swagger Docs:** [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)
- **Web Landing Page:** [http://localhost:3000](http://localhost:3000)
- **Login:** [http://localhost:3000/login](http://localhost:3000/login)
- **Registration:** [http://localhost:3000/register](http://localhost:3000/register)

---

## 🧪 Testing

```bash
# Run API integration and health tests
npm run test:api
```

---

## 🔒 Security Principles
- Passwords hashed with bcrypt / Argon2.
- Role-Based Access Control (USER, ENGINEER, ADMIN) strictly verified on the backend.
- Verification documents kept in non-public storage.
- Standard error envelope preventing stack trace leakage.
