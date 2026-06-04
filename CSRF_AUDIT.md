# CSRF Audit — June 4, 2026

## Summary
Selah.fm uses Supabase SSR cookie-based authentication. CSRF protection relies on SameSite cookies (`Lax` by default). No explicit CSRF tokens are used. This is acceptable because:

- All state-changing endpoints (POST/PUT/DELETE) check the session cookie
- SameSite=Lax prevents cross-site POST requests from external origins
- No authenticated GET requests mutate state

## Endpoints Audited

### Auth
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/auth/callback` | GET | None (redirect) | 🟢 None (GET, no mutation) |
| `POST /api/support` | POST | None (public AI) | 🟢 None (public, no auth) |
| `POST /api/support/log` | POST | None (public) | 🟢 None (public, fire-and-forget) |

### Payments
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/stripe/webhook` | POST | Stripe signature | 🟢 None (Stripe signature verification) |
| `/api/stripe` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/campaigns/[id]/support` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/artists/[slug]/fund` | POST | Session cookie | 🟢 SameSite=Lax |

### Campaigns
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/campaigns` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/campaigns` | GET | None (public) | 🟢 None (GET) |
| `/api/campaigns/[id]` | PATCH | Session cookie | 🟢 SameSite=Lax |
| `/api/campaigns/[id]` | GET | None (public) | 🟢 None (GET) |

### Artists
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/artists/[slug]` | PATCH | Session cookie | 🟢 SameSite=Lax |
| `/api/artists/[slug]/follow` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/artists/me` | GET | Session cookie | 🟢 None (GET) |

### Submissions
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/submissions` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/submissions/[id]` | PATCH | Session cookie | 🟢 SameSite=Lax |
| `/api/submissions/[id]/react` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/submissions/[id]/dispute` | POST | Session cookie | 🟢 SameSite=Lax |

### Social
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/comments` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/comments/[id]` | DELETE | Session cookie | 🟢 SameSite=Lax |
| `/api/comments/[id]/like` | POST | Session cookie | 🟢 SameSite=Lax |
| `/api/reviews` | POST | Session cookie | 🟢 SameSite=Lax |

### Profile & Settings
| Endpoint | Method | Auth Check | CSRF Risk |
|----------|--------|------------|-----------|
| `/api/auth/me` | PATCH | Session cookie | 🟢 SameSite=Lax |
| `/api/artists/[slug]/tracks` | POST | Session cookie | 🟢 SameSite=Lax |

## Conclusion

**No CSRF vulnerabilities found.** All state-changing endpoints are protected by Supabase's SameSite=Lax session cookies. No endpoints accept auth via query params or headers alone without cookie verification.

## Recommendations (Low Priority)
- Add `SameSite=Strict` for critical endpoints (payments, campaign budget changes)
- Add idempotency keys for payment endpoints (belt-and-suspenders)
