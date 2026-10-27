# BuildLink Deployment & Local Setup Guide

---

## 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v20+ recommended)
- **Package Manager:** npm v10.x or higher
- **Database Engine:** Microsoft SQL Server 2025 Express Edition (or Docker / Azure SQL / local instance)

---

## 2. Setting Up Microsoft SQL Server 2025 Express Locally

1. **Download & Install:**
   - Download Microsoft SQL Server Express from Microsoft's official portal.
   - Choose the "Basic" or "Custom" installation.
   - Ensure the SQL Server Browser and TCP/IP protocol are enabled in SQL Server Configuration Manager (default port: `1433`).
2. **Create Database:**
   - Connect via SQL Server Management Studio (SSMS) or Azure Data Studio.
   - Run:
     ```sql
     CREATE DATABASE BuildLinkDB COLLATE Latin1_General_100_CI_AS_SC_UTF8;
     ```
3. **Dual-Mode Persistence Architecture:**
   - BuildLink features dual-mode persistence: when MS SQL Server is connected, TypeORM manages entities and relations in the database.
   - In environments where SQL Server is offline or during isolated unit testing, synchronized in-memory fallback stores guarantee zero runtime disruption.

---

## 3. Running Locally (Development Mode)

```bash
# 1. Install root and workspace dependencies
npm install

# 2. Build shared workspace package
npm --workspace=@buildlink/shared run build

# 3. Start development servers concurrently
npm run dev
```

- **Frontend Web Portal:** [http://localhost:3005](http://localhost:3005)
- **Backend Express API:** [http://localhost:5050/api/v1](http://localhost:5050/api/v1)
- **API Health & Metadata Check:** [http://localhost:5050/api/v1/health](http://localhost:5050/api/v1/health)
- **Interactive Swagger Docs:** [http://localhost:5050/api/v1/docs](http://localhost:5050/api/v1/docs)

---

## 4. Running Automated Tests

```bash
# Run all 10 automated test suites (76 tests across auth, verification, posts, qa, engineers, projects, knowledge, reviews, security, health)
npm --workspace=@buildlink/api test
```

---

## 5. Production Build & Deployment

```bash
# 1. Build shared package
npm --workspace=@buildlink/shared run build

# 2. Compile TypeScript API
npm --workspace=@buildlink/api run build

# 3. Create Next.js optimized production bundle
npm --workspace=@buildlink/web run build

# 4. Start production services
npm --workspace=@buildlink/api run start
npm --workspace=@buildlink/web run start
```
