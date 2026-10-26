# BuildLink API Specification & Conventions

**Prefix:** `/api/v1`  
**Standard Documentation:** OpenAPI 3.0 / Swagger UI at `/api/v1/docs`  
**Format:** JSON  

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
  "timestamp": "2026-10-26T16:30:00.000Z"
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
  "timestamp": "2026-10-26T16:30:00.000Z"
}
```

---

## 2. Core Endpoint Catalog

### System & Health
- `GET /api/v1/health` — Reports API status, uptime, database connectivity, environment.
- `GET /api/v1/docs` — Swagger UI interactive OpenAPI documentation.

### Authentication (`/api/v1/auth`)
- `POST /register` — Register new user (Homeowner or Engineer).
- `POST /login` — Authenticate and receive JWT cookie / token.
- `POST /logout` — Invalidate session / clear cookie.
- `GET /me` — Retrieve authenticated user profile and roles.
- `POST /forgot-password` — Trigger password reset link.
- `POST /reset-password` — Update password using reset token.

### Engineers & Directory (`/api/v1/engineers`)
- `GET /` — Search and filter verified engineers (category, city, experience, rating).
- `GET /:id` — Detailed public profile, credentials, reviews, consultation options.
- `POST /verify/apply` — Submit professional credentials & documents.

### Community & Q&A (`/api/v1/posts`, `/api/v1/questions`)
- `GET /posts` — Community feed with filtering (Latest, For You, Questions).
- `POST /posts` — Publish post with attachments and category.
- `GET /posts/:id` — Post details with comments tree.
- `POST /posts/:id/like` — Toggle post like (idempotent, prevents duplicates).
- `POST /posts/:id/comments` — Add comment or reply.

### Consultations (`/api/v1/consultations`)
- `POST /` — Request a consultation with an engineer.
- `GET /` — List user's consultation requests and scheduled sessions.
- `PUT /:id/status` — Accept, decline, reschedule, or cancel.
- `POST /:id/review` — Submit review upon consultation completion.

### Knowledge Hub (`/api/v1/articles`)
- `GET /` — Browse educational construction articles with category filters.
- `GET /:slug` — Read full knowledge article.
- `POST /admin/articles` — Create/publish article (Admin only).
