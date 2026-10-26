# BuildLink Phased Development Roadmap

**Methodology:** Incremental, test-driven, modular architecture with continuous verification.

---

## Phase Status Summary

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Foundation, UI Design System, Branding & Architecture | **COMPLETED** |
| **Phase 2** | Authentication, JWT, Roles & Profile Management | **COMPLETED** |
| **Phase 3** | Professional Registration, Credential Verification & Audit | **COMPLETED** |
| **Phase 4** | Social Community Feed, Media, Likes & Comments | Planned |
| **Phase 5** | Construction Question & Answer System & Resolution | Planned |
| **Phase 6** | Professional Directory, Search, Filters & Matching | Planned |
| **Phase 7** | Consultation Requests, Scheduling & Private Messaging | Planned |
| **Phase 8** | Construction Projects & Knowledge Hub | Planned |
| **Phase 9** | Administration Dashboard, Moderation & Audit Logs | Planned |
| **Phase 10** | End-to-End QA, Security Hardening & Release Preparation | Planned |
| **Phase 11** | Mobile Apps & Advanced Future Integrations | Future |

---

## Phase 1 Deliverables
1. Monorepo structure with `apps/web`, `apps/api`, `packages/shared`, `docs/`.
2. Next.js 14+ responsive UI shell with BuildLink design system, custom SVG logos, responsive desktop/mobile headers, landing page, and authentication pages.
3. Express REST API with TypeScript, TypeORM database configuration for Microsoft SQL Server 2025 Express, resilient health endpoint, OpenAPI docs, and error handling middleware.
4. Core shared types in `packages/shared`.
5. Automated test suite verifying health endpoint and system contracts.

---

## Phase 2 Deliverables (Completed)
1. **Security & Cryptography**: Secure salted password hashing (`bcryptjs`) and signed JWT token issuance with validation (`jsonwebtoken`).
2. **Authentication API**:
   - `POST /api/v1/auth/register`: Validates user inputs, handles duplicate checking, securely hashes password, creates User, UserProfile, and EngineerProfile.
   - `POST /api/v1/auth/login`: Authenticates credentials, checks account suspension, issues signed JWT token with user metadata.
   - `GET /api/v1/auth/me`: Authenticated endpoint returning user profile with relations.
   - `POST /api/v1/auth/logout`: Clears active session.
   - `POST /api/v1/auth/change-password`: Validates current password, applies new password hash.
   - `POST /api/v1/auth/forgot-password` & `POST /api/v1/auth/reset-password`: Reset request workflows.
3. **Role-Based Access Control (RBAC) & Middleware**:
   - `authenticateJwt`: Bearer token parsing and validation middleware.
   - `requireRoles`: Enforces role access (`USER`, `ENGINEER`, `ADMIN`).
4. **Profile Management API**:
   - `PUT /api/v1/users/profile`: Update personal info (name, bio, location, district, contact).
   - `PUT /api/v1/users/engineer-profile`: Protected endpoint for engineers to manage professional title, years of experience, registration body/number, consultation rates, availability, and specializations.
5. **Resilient Data Architecture**:
   - Live TypeORM repository support for Microsoft SQL Server 2025 Express with transactional integrity.
   - Built-in resilient store fallback for offline and continuous integration environments.
6. **Next.js Frontend Integration**:
   - `AuthContext` / `useAuth` provider managing token, localStorage sync, cookie hydration, and user state.
   - Responsive `Navbar` with initials avatar, role badge, profile drawer, and sign-out controls.
   - Interactive `/profile` page with Personal Info, Engineer Credentials, Security, and Account Status tabs.
   - Connected `/login` and `/register` flows.
7. **Comprehensive Automated Test Suite**:
   - 17 automated unit and integration tests passing in `apps/api/src/tests/auth.test.ts`.

---

## Phase 3 Deliverables (Completed)
1. **Document Upload Pipeline**:
   - Secure `multer` upload handler validating MIME types (`application/pdf`, `image/png`, `image/jpeg`, `image/webp`) with 10MB limits.
   - Endpoint: `POST /api/v1/verification/upload`.
2. **Engineer Credential Submission API**:
   - `POST /api/v1/verification/apply`: Protected endpoint allowing engineers to submit regulatory body (IESL, CIBSE, SOE), license number, cover notes, and attached documents.
   - `GET /api/v1/verification/status`: Retrieves real-time audit assessment status, reviewer notes, and submitted proof files.
3. **Administrative Verification & Compliance Console API**:
   - `GET /api/v1/verification/admin/applications`: Filter by status (`PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `ADDITIONAL_INFO_REQUIRED`).
   - `PUT /api/v1/verification/admin/applications/:id/review`: Approves or rejects applications, updates `EngineerProfile.verificationStatus`, and logs reviewer notes.
   - `GET /api/v1/verification/admin/audit-logs`: Retrieves immutable audit log events.
4. **Audit Trail Logging Engine**:
   - `AuditLog` TypeORM entity and schema specification.
   - Automatic audit recording for `VERIFICATION_APPLICATION_SUBMITTED` and `VERIFICATION_APPLICATION_REVIEWED` with IP tracking and actor details.
5. **Interactive Next.js Frontend Portals**:
   - `/verify`: Interactive applicant portal for engineers with multi-file attachment, document category selector, cover note input, and live assessment status tracking.
   - `/admin/verification`: Administrative console featuring status filter pills, applicant inspector modal with attached document viewers, determination decision buttons, and immutable audit logs table.
6. **Automated Verification Test Suite**:
   - 8 new integration tests in `apps/api/src/tests/verification.test.ts` (bringing the total test suite to 25 passing tests).


