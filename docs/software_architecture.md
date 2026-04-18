# 🏗️ Software Architecture Document (SAD) — Code Breaker

> **Standar**: IEEE 1016 | **Versi**: 1.0 | **Tanggal**: 17 April 2026

---

## 1. Architectural Overview

**Style**: Layered Architecture (5-Tier) — strict dependency rule.

| Layer | Nama              | Teknologi                   | Tanggung Jawab                    |
|-------|-------------------|-----------------------------|-----------------------------------|
| L1    | Presentation      | React 18, Vite, Axios       | UI, routing, state management     |
| L2    | API Gateway       | Express.js middleware       | Auth, RBAC, rate limit, validate  |
| L3    | Business Logic    | Service classes             | Game logic, scoring, progression  |
| L4    | Data Access       | Prisma ORM                  | DB queries, transactions          |
| L5    | Infrastructure    | PostgreSQL, PM2, Winston    | Storage, runtime, logging         |

> 📎 **Architecture Diagram (SVG Interaktif)**: [architecture_diagram.html](file:///d:/Computer%20Science%20UGM/Metode%20Rekayasa%20Perangkat%20Lunak/vibeCoding/docs/architecture_diagram.html)

### Design Rationale

| Keputusan              | Alasan                                                  |
|------------------------|----------------------------------------------------------|
| Layered (bukan µsvc)   | Sederhana, cocok tim kecil & 20 CCU. Single deployable. |
| REST (bukan GraphQL)    | Data model straightforward. CRUD + game actions.        |
| CSR SPA (bukan SSR)     | No SEO needed (game). Mengurangi server load.           |
| Monorepo (client+server)| Satu repo, shared constants, simpler CI.               |

---

## 2. Technology Stack

### Frontend
| Tech          | Versi | Fungsi                |
|---------------|-------|-----------------------|
| React         | 18+   | UI library            |
| React Router  | 6+    | Client-side routing   |
| Axios         | 1.x   | HTTP client           |
| Vite          | 5+    | Build tool            |

### Backend
| Tech              | Versi | Fungsi              |
|-------------------|-------|----------------------|
| Node.js           | 18 LTS| Runtime             |
| Express.js        | 4.x   | Web framework       |
| Prisma            | 5+    | ORM + Migration     |
| bcrypt            | 5.x   | Password hashing    |
| jsonwebtoken      | 9.x   | JWT                 |
| helmet            | 7+    | Security headers    |
| express-rate-limit| 7+    | Rate limiting       |
| express-validator | 7+    | Input validation    |
| winston           | 3.x   | Structured logging  |
| dotenv            | 16+   | Env config          |

---

## 3. Git Workflow

### 3.1 Branching Strategy (Git Flow)

```mermaid
gitGraph
    commit id: "initial commit"
    branch develop
    checkout develop
    commit id: "project scaffold"

    branch feature/auth
    checkout feature/auth
    commit id: "auth service + routes"
    commit id: "auth tests"
    checkout develop
    merge feature/auth id: "merge auth"

    branch feature/game-classic
    checkout feature/game-classic
    commit id: "game engine + feedback"
    commit id: "game UI + board"
    checkout develop
    merge feature/game-classic id: "merge classic"

    branch feature/daily-cipher
    checkout feature/daily-cipher
    commit id: "daily + cipher modes"
    checkout develop
    merge feature/daily-cipher id: "merge modes"

    branch feature/leaderboard-progression
    checkout feature/leaderboard-progression
    commit id: "leaderboard + XP + badges"
    checkout develop
    merge feature/leaderboard-progression id: "merge lb+prog"

    branch feature/admin-panel
    checkout feature/admin-panel
    commit id: "admin CRUD + dashboard"
    checkout develop
    merge feature/admin-panel id: "merge admin"

    branch release/1.0
    checkout release/1.0
    commit id: "version bump + fixes"
    checkout main
    merge release/1.0 id: "v1.0.0" tag: "v1.0.0"
    checkout develop
    merge release/1.0 id: "back-merge"
```

### 3.2 Branch Naming & Commit Convention

| Tipe Branch | Format              | Contoh                        |
|-------------|---------------------|-------------------------------|
| Feature     | `feature/<name>`    | `feature/auth`                |
| Bugfix      | `bugfix/<desc>`     | `bugfix/score-calculation`    |
| Hotfix      | `hotfix/<desc>`     | `hotfix/jwt-expiry`           |
| Release     | `release/<ver>`     | `release/1.0`                 |

**Commits**: `<type>(<scope>): <desc>` — `feat(auth): implement login with JWT`

### 3.3 Merge Rules
- `main`, `develop`: no direct push. PR required.
- Feature → develop: squash merge.
- Release → main: merge commit (preserve history).
- CI checks (lint + test) must pass before merge.

---

## 4. Environment Strategy

| Env         | Database          | Config             | Purpose              |
|-------------|-------------------|---------------------|----------------------|
| Development | PG local          | `.env.development`  | Local dev            |
| Staging     | PG staging        | `.env.staging`      | Pre-prod, UAT        |
| Production  | PG production     | `.env.production`   | Live system          |

### Environment Variables (.env.example)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/codebreaker_dev
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d
BCRYPT_SALT_ROUNDS=10
RATE_LIMIT_MAX=100
LOGIN_RATE_LIMIT_MAX=5
DAILY_CHALLENGE_SECRET=<secret>
CORS_ORIGIN=http://localhost:5173
LOG_LEVEL=debug
```

---

## 5. Security Architecture — STRIDE Threat Model

```mermaid
graph LR
    subgraph "STRIDE Threats"
        S["🎭 Spoofing"]
        T["🔧 Tampering"]
        R["🙈 Repudiation"]
        I["🔍 Info Disclosure"]
        D["🚫 Denial of Service"]
        E["⬆️ Elevation of Privilege"]
    end
    subgraph "Mitigations"
        M1["JWT + bcrypt"]
        M2["Input Validation + ORM"]
        M3["Audit Logging"]
        M4["Security Headers + Error Masking"]
        M5["Rate Limiting"]
        M6["RBAC Middleware"]
    end
    S --> M1
    T --> M2
    R --> M3
    I --> M4
    D --> M5
    E --> M6
```

### STRIDE Detail

#### 🎭 Spoofing
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Login dengan credential curian  | bcrypt hashing, rate limit 5/min, JWT expiry| A07   |
| JWT dipalsukan                  | Signature verify (HS256 + strong secret)    | A07   |

#### 🔧 Tampering
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Manipulasi skor dari client     | Skor 100% server-side. Kode tidak ke client.| A04   |
| SQL Injection                   | Prisma ORM (prepared statements)             | A03   |
| XSS via nickname                | Output encoding. React auto-escapes. CSP.    | A03   |

#### 🙈 Repudiation
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Admin menyangkal perubahan      | `logger.audit({action, userId, timestamp})` | A09   |
| Tidak ada jejak login           | Log setiap login attempt (success/fail+IP)  | A09   |

#### 🔍 Information Disclosure
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Secret code bocor ke client     | Kode TIDAK di-response. Server-only.         | A01   |
| Stack trace di error response   | Production: generic error message only.      | A05   |
| .env ter-commit ke git          | `.gitignore`. Pre-commit hook check.         | A05   |

#### 🚫 Denial of Service
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Brute force login               | Rate limit 5 req/min/IP                      | A04   |
| API flood                       | Global rate limit 100/min/IP                 | A04   |
| Large payload                   | `express.json({limit:'10kb'})`               | A04   |

#### ⬆️ Elevation of Privilege
| Threat                          | Mitigasi                                    | OWASP |
|---------------------------------|---------------------------------------------|-------|
| Player akses admin endpoint     | RBAC middleware `requireRole('admin')`       | A01   |
| IDOR: akses data user lain      | Verify `req.user.id === resource.userId`     | A01   |

---

## 6. Security Middleware Pipeline

```
Request → helmet() → cors() → express.json({limit:10kb})
  → rateLimiter() → requestLogger() → router
    → [Protected: jwtAuth() → rbac()] → validate()
      → Controller → Service → Repository → DB
        → errorHandler() → Response
```

---

## 7. Deployment Architecture

```
┌─────────────────────────────────────────┐
│          VPS / Cloud Instance           │
│  ┌───────────────────────────────────┐  │
│  │  PM2 → Node.js (Express) :3000   │  │
│  │   └─ Static: React build output  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  PostgreSQL 14+ :5432             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  Cron: pg_dump hourly, log rotate │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 8. Project Folder Structure

```
code-breaker/
├── client/                     # React Frontend
│   ├── src/
│   │   ├── components/         # Shared UI components
│   │   ├── pages/              # Route pages
│   │   ├── contexts/           # Auth, Game context
│   │   ├── hooks/              # Custom hooks
│   │   ├── services/           # API client
│   │   ├── utils/              # Helpers
│   │   ├── constants/          # Badges, config
│   │   └── styles/             # CSS
│   └── package.json
├── server/                     # Node.js Backend
│   ├── src/
│   │   ├── config/             # Env loader
│   │   ├── middleware/         # JWT, RBAC, rate limit, validator
│   │   ├── routes/            # Express routes
│   │   ├── controllers/       # Request handlers (thin)
│   │   ├── services/          # Business logic (thick)
│   │   ├── repositories/     # Prisma queries
│   │   ├── utils/             # FeedbackEngine, ScoreCalc
│   │   ├── errors/            # Custom error classes
│   │   └── constants/         # Badges, game config
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.js
│   └── package.json
├── .gitignore
└── README.md
```

---

> **Status: DRAFT — Menunggu Review & Approval**
