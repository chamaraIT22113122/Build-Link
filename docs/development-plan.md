# BuildLink Phased Development Roadmap

**Methodology:** Incremental, test-driven, modular architecture with continuous verification.

---

## Phase Status Summary

| Phase | Description | Status |
|---|---|---|
| **Phase 1** | Foundation, UI Design System, Branding & Architecture | **COMPLETED** |
| **Phase 2** | Authentication, JWT, Roles & Profile Management | **COMPLETED** |
| **Phase 3** | Professional Registration, Credential Verification & Audit | **COMPLETED** |
| **Phase 4** | Social Community Feed, Media, Likes & Comments | **COMPLETED** |
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

---

## Phase 4 Deliverables (Completed)
1. **Domain Model & Entities**:
   - `Post` entity with author relation, category, post type, media attachment URLs JSON, likes counter, comments counter, and resolution flag.
   - `PostLike` entity with unique composite index on `(postId, userId)` for idempotent toggles.
   - `Comment` entity with parent comment relation, verified professional answer flag, and helpful indicator.
2. **Community Feed & Post Management API**:
   - `POST /api/v1/posts`: Validates title, category, type, and content; persists post.
   - `GET /api/v1/posts`: Feed with category, post type, author, and search term filters with chronological order.
   - `GET /api/v1/posts/:id`: Details with author profile and user's like state (`isLikedByMe`).
   - `PUT /api/v1/posts/:id`: Author-only editing.
   - `DELETE /api/v1/posts/:id`: Author or admin deletion.
   - `POST /api/v1/posts/upload`: Site photo and media upload endpoint.
3. **Likes & Verified Professional Comments**:
   - `POST /api/v1/posts/:id/like`: Idempotent like toggle.
   - `POST /api/v1/posts/:id/comments`: Comment creation with automatic verification badge detection (`isProfessionalAnswer = true` when commenter is a verified engineer).
   - `GET /api/v1/posts/:id/comments`: Chronological comments thread with author badges.
   - `DELETE /api/v1/posts/comments/:commentId`: Comment deletion.
4. **Interactive Next.js Community Feed Portal**:
   - Responsive feed at `/feed` with sidebar filters (Post Type & Construction Category), discussion search, and composer modal with site photo uploads.
   - Post cards with author initials avatar, verified engineer badges, image galleries, and live like counter.
   - Expandable comment threads highlighting verified engineer answers in dedicated styling.
5. **Comprehensive Automated Test Suite**:
   - 8 new integration tests in `apps/api/src/tests/post.test.ts` (bringing total test suite to 33 passing tests).

---

## Phase 5 Deliverables (Completed)
1. **Domain Model & Entities**:
   - `Post` entity extended with `acceptedAnswerId?: string`, `isQuestion: boolean`, `urgency: string`.
   - `Comment` entity extended with `helpfulCount: number` and `isAcceptedSolution: boolean`.
   - In-memory fallback stores updated for testing and offline resilience with idempotent helpful voting.
2. **Q&A System & Resolution API**:
   - `GET /api/v1/posts/questions/catalog`: Filter questions by resolution status (`resolved=true|false`), category, urgency, and search keywords.
   - `PUT /api/v1/posts/:id/resolve`: Author-authenticated marking of an answer comment as the accepted solution; updates both post and comment states.
   - `PUT /api/v1/posts/:id/unresolve`: Author-authenticated reopening of a resolved question.
   - `POST /api/v1/posts/comments/:commentId/helpful`: Toggle helpful vote on advice comments and track counters.
3. **Interactive Frontend Q&A Interfaces**:
   - `/questions`: Dedicated Questions Hub with status tabs ("All Questions", "Needs Answer", "Solved & Accepted"), urgency filters ("Standard", "Urgent", "Emergency"), category list, and question cards.
   - `/questions/ask`: Structured question submission workflow with title, construction category, urgency level, site city/location, detailed problem description, and photo uploader.
   - `/feed`: Enhanced comment threads displaying Accepted Solution gold/emerald banners, author "Mark as Solution" / "Reopen" buttons, and "Helpful" counter buttons.
4. **Comprehensive Automated Test Suite**:
   - 5 new integration tests in `apps/api/src/tests/qa.test.ts` (bringing total test suite to 38 passing tests).
   - Production Next.js build validated with all 12 routes statically pre-rendered.

---

## Phase 6 Deliverables (Completed)
1. **Domain Model & Entities**:
   - `Consultation` entity with client relation (`User`), engineer relation (`EngineerProfile`), consultation type (`ONSITE`, `VIDEO`, `TEXT`, `AUDIO`), status (`REQUESTED`, `ACCEPTED`, `COMPLETED`, `CANCELLED`), and scheduled date.
   - Dual-mode support for in-memory and TypeORM MS SQL Server queries with comprehensive joins.
2. **Professional Directory & Consultation API**:
   - `GET /api/v1/engineers`: Search by keyword, filter by Sri Lankan district, filter by engineering specialization, filter by verified status, and sort by rating/experience/fee.
   - `GET /api/v1/engineers/:id`: Public profile details with professional credentials, IESL membership, verified status, and ratings.
   - `POST /api/v1/engineers/consultations`: Homeowner-authenticated booking of technical consultations with consultation type, preferred schedule date, and problem description.
   - `GET /api/v1/engineers/consultations/my`: Multi-role consultation dashboard feed for both homeowners and engineers.
   - `PUT /api/v1/engineers/consultations/:id/status`: Participant-authenticated state machine updates (`ACCEPTED`, `COMPLETED`, `CANCELLED`) with strict authorization guards.
3. **Interactive Frontend Directory & Booking Interfaces**:
   - `/engineers`: Responsive directory grid with search, district dropdown (all 25 Sri Lankan districts), specialization pills, rating badges, experience counters, and consultation fees.
   - `/engineers/[id]`: Detailed public profile page highlighting verified badges, IESL registration credentials, technical specializations, experience bio, and interactive consultation booking modal.
4. **Comprehensive Automated Test Suite**:
   - 8 new integration tests in `apps/api/src/tests/engineers.test.ts` (bringing total test suite to 46 passing tests).
   - Production Next.js build validated with all 13 routes compiled and statically pre-rendered.

---

## Phase 7: Project Tracking, Construction Milestones & Collaboration (Next Phase)
1. **Project Domain Model & Entities**:
   - `Project` entity: Owner (`User`), Assigned Engineer (`EngineerProfile`), title, location, budget, estimated timeline, stage (`PLANNING`, `DESIGN`, `APPROVALS`, `FOUNDATION`, `STRUCTURAL_WORK`, `ROOFING`, `FINISHING`, `COMPLETED`).
   - `ProjectMilestone` entity: Project relation, milestone title, target date, completion status, engineer sign-off flag, inspection notes, photos.
2. **Project Collaboration API**:
   - `POST /api/v1/projects`: Create a new construction project.
   - `GET /api/v1/projects`: List user's active projects (homeowner or assigned engineer).
   - `GET /api/v1/projects/:id`: Project details with timeline and milestones.
   - `POST /api/v1/projects/:id/milestones`: Add milestones and inspection steps.
   - `PUT /api/v1/projects/:id/milestones/:milestoneId/sign-off`: Verified engineer milestone certification.
3. **Interactive Frontend Portal**:
   - `/projects`: Projects hub with stage timeline progress bars, budget tracking, and status indicators.
   - `/projects/[id]`: Project workspace with stage milestone checklists, inspection sign-offs, and engineer collaboration notes.





