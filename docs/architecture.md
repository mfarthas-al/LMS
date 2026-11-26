# Architecture

```
 Web (Next.js) ──┐                          ┌── PostgreSQL  (users, courses, payments, enrollments)
                 ├── HTTPS ──► API (NestJS) ├── Redis       (OTP, rate limits, job queues)
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
| `otp` | SMS OTP to verify phone number (mandatory for every account) |
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

## Sign-up flow

1. Register with **email + password** or **Google**.
2. Add a **Sri Lankan mobile number** → receive SMS OTP → verify.
3. Only then can the student buy or watch anything (`PhoneVerifiedGuard`).

## Payment flows

**Online (PayHere):** create `Payment(PENDING)` → redirect to PayHere → PayHere calls our notify URL →
verify signature + amount → in one DB transaction set `SUCCESS` and create `Enrollment`.

**Manual (bank slip):** student uploads slip → `Payment(PENDING_REVIEW)` → admin approves →
in one DB transaction set `SUCCESS`, create `Enrollment`, write audit log. Reject stores a reason.

## Web route areas (`apps/web/src/app`)

`(public)` catalogue · `(auth)` login/register/verify-phone · `student/*` · `teacher/*` · `admin/*` · `payments/*` gateway return pages.

## Mobile (`apps/mobile/app`)

Student-focused Android app: auth, browse, my courses, lesson player, checkout, slip upload.
Teacher and admin work is on the web app (can be added to mobile later).
