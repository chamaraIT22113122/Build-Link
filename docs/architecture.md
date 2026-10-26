# BuildLink System Architecture

**Application Name:** BuildLink  
**Primary Tagline:** Connect. Build. Grow.  
**Secondary Tagline:** Your Projects. Your Experts. One Community.  
**Primary Market:** Sri Lanka (Expandable globally)  
**Platform:** Next.js (Web), Express REST API (Backend), Microsoft SQL Server 2025 Express (Database)

---

## 1. High-Level Architectural Overview

BuildLink is engineered as a decoupled full-stack platform comprising:
1. **Frontend (`apps/web`):** Next.js 14+ App Router application with React, TypeScript, Tailwind CSS, Lucide icons, and accessible component patterns.
2. **Backend API (`apps/api`):** Express REST API in TypeScript utilizing TypeORM, Zod input validation, rate limiting, and OpenAPI/Swagger documentation.
3. **Database:** Microsoft SQL Server 2025 Express with ACID transactions, relational integrity, migrations, and indexed foreign keys.
4. **Shared Types & Constants (`packages/shared`):** Canonical DTOs, enums, validation schemas, and constants shared between web and mobile clients.

```
                            +--------------------------------------------------+
                            |                   BUILDLINK                      |
                            +--------------------------------------------------+
                                                     |
                         +---------------------------+-------------------------+
                         |                                                     |
             +-----------------------+                             +-----------------------+
             |    Next.js Web App    |                             |  Future Mobile Apps   |
             |   (React, Tailwind)   |                             |   (React Native/iOS)  |
             +-----------------------+                             +-----------------------+
                         |                                                     |
                         +---------------------------+-------------------------+
                                                     | HTTPS / REST
                                                     v
                                     +-------------------------------+
                                     |       Express REST API        |
                                     |     (/api/v1/health, docs)    |
                                     +-------------------------------+
                                     |  Auth, Validation, Modules    |
                                     +-------------------------------+
                                                     |
                                                     v
                                     +-------------------------------+
                                     |            TypeORM            |
                                     |         (mssql driver)        |
                                     +-------------------------------+
                                                     |
                                                     v
                                     +-------------------------------+
                                     | Microsoft SQL Server 2025     |
                                     | Express Edition (Relational)  |
                                     +-------------------------------+
```

---

## 2. Monorepo Organization

```text
buildlink/
├── apps/
│   ├── web/                        # Next.js App Router frontend
│   │   ├── app/                    # Pages, layouts, metadata
│   │   ├── components/             # Reusable UI components & branding
│   │   ├── features/               # Feature-specific components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API client, utilities
│   │   ├── public/                 # Static assets, SVG logos, favicons
│   │   └── styles/                 # Global Tailwind & design system CSS
│   │
│   └── api/                        # Express TypeScript backend
│       └── src/
│           ├── config/             # Environment, database, auth config
│           ├── database/           # TypeORM DataSource, entities, migrations
│           ├── modules/            # Domain modules (auth, engineers, posts, etc.)
│           ├── middleware/         # Auth, validation, error handler, rate limiter
│           ├── common/             # Standard API response, error definitions
│           ├── routes/             # Unified route registration
│           └── server.ts           # Server bootstrap and lifecycle
│
├── packages/
│   └── shared/                     # Shared DTOs, enums, schemas
│
├── docs/                           # Architecture, DB, API, security documentation
├── .env.example                    # Template environment variables
├── package.json                    # Workspace orchestration
└── README.md                       # Setup and developer guide
```

---

## 3. Communication Patterns

- **Synchronous REST:** All client-to-server operations occur over HTTPS using standard JSON payloads under the `/api/v1` namespace.
- **Stateless Authentication:** JSON Web Tokens (JWT) with HttpOnly cookies for web browsers and Bearer token headers for API/mobile clients.
- **Unified Errors:** Standard error payload shape across all endpoints:
  ```json
  {
    "success": false,
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Human readable summary",
      "details": []
    },
    "timestamp": "2026-10-26T16:30:00.000Z"
  }
  ```
- **Realtime (Future Phase):** Socket.IO abstraction for live notifications and active consultation chat.

---

## 4. Key Design Decisions

1. **Next.js Server & Client Components:** Public discovery pages (Landing page, Engineer directory, Knowledge Hub articles, public questions) leverage Next.js SSR for SEO and fast initial paint. Interactive forms and feeds use Client Components (`'use client'`).
2. **Microsoft SQL Server 2025 Express with TypeORM:** Relational rigor with typed entities, indexed foreign keys, constraints against duplicate likes/reviews, and transactions for multi-step consultation bookings.
3. **Dedicated Asset Storage:** Relational DB stores metadata and URLs; binary assets (images, consultation attachments, verification documents) reside in dedicated local/object storage.
