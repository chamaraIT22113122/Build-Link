# BuildLink API Specification & Conventions

**Prefix:** `/api/v1`  
**Standard Documentation:** OpenAPI 3.0 / Swagger UI at `/api/v1/docs`  
**Format:** JSON  
**Security:** Helmet HTTP Headers, CORS Origin Whitelist, Express Rate Limiting (General & Auth)  

---

## 1. Response Envelope

All API responses strictly adhere to the unified standard envelope format:

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  },
  "timestamp": "2026-10-27T00:30:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "BAD_REQUEST",
    "message": "Invalid input provided.",
    "details": [
      {
        "field": "email",
        "message": "Invalid email address format"
      }
    ]
  },
  "timestamp": "2026-10-27T00:30:00.000Z"
}
```

---

## 2. Core Endpoint Catalog

### System & Health
- `GET /api/v1/health` — Reports API status, uptime, database connectivity, and environment metadata.
- `GET /api/v1/docs` — Swagger UI interactive OpenAPI documentation.

### Authentication & Profiles (`/api/v1/auth`) *(Protected with Auth Rate Limiter)*
- `POST /register` — Register a new user (`USER` homeowner/builder or `ENGINEER`).
- `POST /login` — Authenticate credentials and receive JWT bearer token.
- `POST /logout` — Graceful session termination.
- `GET /me` — Retrieve authenticated user profile, roles, and engineer profile details.
- `PUT /me` — Update personal profile details (first name, last name, phone, district, city).
- `PUT /me/engineer` — Update professional engineer profile (title, experience, consultation fee, bio, specializations).
- `POST /change-password` — Change password securely with current password validation.
- `POST /forgot-password` — Generate password reset token.
- `POST /reset-password` — Reset password using verified token.

### Engineers, Directory & Reviews (`/api/v1/engineers`)
- `GET /` — Public verified engineers directory with search, district, and specialization filters.
- `GET /:id` — Public profile of specific engineer with credentials, accreditation, and rating breakdown.
- `GET /:id/reviews` — List audited reviews and testimonials for this engineer.
- `POST /:id/reviews` — Authenticated client submits 1-5 star review with verified client badge.
- `POST /consultations` — Request a consultation (onsite inspection, video review, text structural advice, or phone).
- `GET /consultations/my` — List user's consultation requests and matching sessions.
- `PUT /consultations/:id/status` — Participant updates consultation status (`ACCEPTED`, `DECLINED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
- `GET /consultations/:id/messages` — Retrieve in-app consultation message thread.
- `POST /consultations/:id/messages` — Send in-app message with attachments to consultation thread.

### Verification & Audit (`/api/v1/verification`)
- `POST /upload` — Upload qualification certificate or license document (PDF/Image via `multer`).
- `POST /apply` — Submit professional verification application with credentials.
- `GET /admin/pending` — Admin console listing pending verification applications.
- `PUT /admin/:applicationId/review` — Admin approves, requests additional info, or rejects application.
- `GET /admin/audit-logs` — Immutable audit log trail of all credential submissions and reviews.

### Social Community Feed (`/api/v1/posts`)
- `GET /` — Community feed with category filtering (`GENERAL`, `QUESTION`, `PROJECT_UPDATE`, `PROFESSIONAL_ADVICE`, `TIP`, `MATERIAL_DISCUSSION`).
- `POST /` — Publish new community post with media attachments.
- `GET /:id` — Post details with comments hierarchy.
- `PUT /:id` — Author edits post.
- `DELETE /:id` — Author or admin deletes post.
- `POST /:id/like` — Toggle like idempotently.
- `POST /:id/comments` — Comment on post (automatically flags verified engineer comments as verified professional advice).
- `DELETE /:id/comments/:commentId` — Delete comment.

### Construction Q&A System (`/api/v1/qa`)
- `GET /unresolved` — Filter unresolved questions awaiting professional answers.
- `PUT /questions/:id/resolve` — Author marks question resolved with accepted solution comment.
- `PUT /questions/:id/unresolve` — Author reopens question.
- `POST /comments/:commentId/helpful` — Community members vote comment as helpful.

### Project Tracking & Milestone Sign-Off (`/api/v1/projects`)
- `POST /` — Create construction project and auto-scaffold 10 Sri Lankan stage milestones.
- `GET /` — List user's active projects with percentage completion metrics.
- `GET /:id` — Project workspace details with milestone checklist.
- `PUT /:id` — Owner updates project stage (`PLANNING` → `COMPLETED`), budget, and spent expenditure.
- `POST /:id/milestones` — Add custom construction milestone to project.
- `PUT /:id/milestones/:milestoneId` — Mark milestone as completed.
- `PUT /:id/milestones/:milestoneId/sign-off` — Verified engineer signs off and certifies milestone with professional notes stamp.

### Knowledge Hub & Standards (`/api/v1/knowledge`)
- `GET /` — Browse technical guides with authority filter (`SLS`, `CIDA`, `NBRO`, `UDA`) and category search.
- `GET /:slug` — Read full technical guide with statutory citations; increments view counter.
- `POST /` — Authenticated engineer or admin publishes new construction guide.
