# Architecture

```
 Web (Next.js) ──┐                          ┌── PostgreSQL  (users, courses, payments, enrollments)
                 ├── HTTPS ──► API (NestJS) ├── Redis       (login lockouts, rate limits, job queues)
 Android (Expo) ─┘                          ├── S3 / MinIO  (PDFs, slips — private bucket)
                                            ├── PayHere     (online payments + webhook)
                                            └── SMS / Email providers
 YouTube (Unlisted videos) ◄── played inside our player; video ID released only to enrolled students
```

The API is the only thing that talks to the database and storage. Web and mobile are clients.

## API modules (`apps/api/src/modules`)

| Module | Responsibility |
|---|---|
| `auth` | Email/password + Google sign-in, JWT access + rotating refresh tokens, device limits |
| `users` | Profiles for all roles |
| `courses` | Courses + units (grade / subject / medium) |
| `lessons` | Lessons with YouTube reference + materials |
| `video-access` | Short-lived playback tokens; releases video ID only to enrolled students |
| `materials` | PDFs / quizzes via signed URLs |
| `enrollments` | Who can access what — single source of truth for access |
| `payments` | PayHere (auto) + manual slip (admin review) |
| `storage` | S3-compatible wrapper |
| `notifications` | SMS + email, queued |
| `admin` | Slip approvals, user/teacher management, reports |
| `audit` | Append-only log of sensitive actions |
| `health` | Liveness/readiness check |

## Accounts and roles

| Role | Created by | Self sign-up |
|---|---|---|
| `SUPER_ADMIN` | `pnpm db:seed` only (from `SUPER_ADMIN_*` in `.env`) | No |
| `ADMIN` | Super admin (`POST /admin/users`) | No |
| `TEACHER` | Admin or super admin, or self sign-up | Yes |
| `STUDENT` | Admin or super admin, or self sign-up | Yes |

There is no approval or phone verification step: self-registered students and teachers can use
their account straight away.

**Self sign-up:** name, email, password, and Student or Teacher → dashboard.

**Created by an admin:** the admin gets a one-time temporary password to hand over → the person signs
in and must choose their own password → dashboard. Enforced by the global `AccountStatusGuard`
(`PASSWORD_CHANGE_REQUIRED`); `/auth/me` and `/auth/change-password` opt out with
`@AllowPendingPasswordChange()`.

**Forgot password:** an admin issues a new temporary password from the Users page
(`POST /admin/users/:id/reset-password`), which also signs the user out everywhere. Super admins can
reset admins. A self-service email or SMS reset can be added later.

## Payment flows

**Online (PayHere):** create `Payment(PENDING)` → redirect to PayHere → PayHere calls our notify URL →
verify signature + amount → in one DB transaction set `SUCCESS` and create `Enrollment`.

**Manual (bank slip):** student uploads slip → `Payment(PENDING_REVIEW)` → admin approves →
in one DB transaction set `SUCCESS`, create `Enrollment`, write audit log. Reject stores a reason.

## Web route areas (`apps/web/src/app`)

`(public)` catalogue · `(auth)` login/register/verify-phone/forgot-password/change-password · `student/*` · `teacher/*` · `admin/*` · `payments/*` gateway return pages.

## Mobile (`apps/mobile/app`)

Student-focused Android app: auth, browse, my courses, lesson player, checkout, slip upload.
Teacher and admin work is on the web app (can be added to mobile later).
