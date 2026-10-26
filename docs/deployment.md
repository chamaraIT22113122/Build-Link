# BuildLink Deployment & Local Setup Guide

---

## 1. Prerequisites
- **Node.js:** v18.0.0 or higher (v24.x tested)
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
3. **Verify Connection:**
   - Update `apps/api/.env` with your SQL Server credentials (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`).

---

## 3. Running Locally (Development Mode)

```bash
# 1. Install root and workspace dependencies
npm install

# 2. Configure environment
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local

# 3. Start development servers concurrently
npm run dev
```

- **Frontend Web:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)
- **API Health Check:** [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health)
- **Interactive Swagger Docs:** [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs)
