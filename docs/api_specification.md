# 📡 API Specification — Code Breaker

> **Standar**: OpenAPI 3.0 | **Base URL**: `/api/v1` | **Versi**: 1.0 | **Tanggal**: 17 April 2026

---

## 1. Overview

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Protocol     | HTTPS (REST)                            |
| Format       | JSON (`application/json`)               |
| Auth         | Bearer JWT (`Authorization: Bearer <token>`) |
| Versioning   | URI-based (`/api/v1/...`)               |
| Rate Limit   | Global: 100 req/min/IP, Login: 5 req/min/IP |

### Standard Response Format

```json
// Success
{
  "success": true,
  "data": { /* payload */ },
  "meta": { "timestamp": "2026-04-17T12:00:00Z", "requestId": "req-abc" }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [{ "field": "guess", "message": "Must be 4 hex chars" }]
  },
  "meta": { "timestamp": "2026-04-17T12:00:00Z", "requestId": "req-abc" }
}
```

### Standard HTTP Status Codes

| Code | Meaning                | Usage                              |
|------|------------------------|------------------------------------|
| 200  | OK                     | Successful GET, PATCH              |
| 201  | Created                | Successful POST (create)           |
| 400  | Bad Request            | Validation error, invalid input    |
| 401  | Unauthorized           | Missing/invalid/expired JWT        |
| 403  | Forbidden              | Insufficient role (RBAC)           |
| 404  | Not Found              | Resource not found                 |
| 409  | Conflict               | Duplicate (username taken)         |
| 429  | Too Many Requests      | Rate limit exceeded                |
| 500  | Internal Server Error  | Unhandled server error             |

---

## 2. Endpoints — Authentication

### POST `/api/v1/auth/register`

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Auth         | ❌ None                                 |
| Rate Limit   | 100/min (global)                        |
| RBAC         | Public                                  |

**Request Body:**
```json
{
  "username": "hexmaster",     // 3-20 alphanumeric, required
  "password": "securePass8",   // min 8 chars, required
  "nickname": "HexMaster42"   // 3-16 alphanumeric, required
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "username": "hexmaster", "nickname": "HexMaster42", "role": "player", "level": 1 },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Errors:** `400` validation, `409` username taken.

---

### POST `/api/v1/auth/login`

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Auth         | ❌ None                                 |
| Rate Limit   | **5/min/IP** (brute-force protection)   |
| RBAC         | Public                                  |

**Request:** `{ "username": "...", "password": "..." }`

**Response 200:** `{ "data": { "user": {...}, "accessToken": "...", "refreshToken": "..." } }`

**Errors:** `401` invalid credentials, `429` rate limited.

---

### POST `/api/v1/auth/refresh`

| Auth | Rate Limit | RBAC |
|------|-----------|------|
| ✅ Refresh Token | 100/min | Authenticated |

**Request:** `{ "refreshToken": "eyJ..." }`

**Response 200:** `{ "data": { "accessToken": "...", "refreshToken": "..." } }`

---

### POST `/api/v1/auth/guest`

| Auth | Rate Limit | RBAC |
|------|-----------|------|
| ❌ None | 100/min | Public |

**Request:** `{ "nickname": "GuestPlayer" }`

**Response 200:** `{ "data": { "sessionToken": "...", "nickname": "GuestPlayer" } }`

---

## 3. Endpoints — Game

### POST `/api/v1/games/start`

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Auth         | ✅ Bearer JWT / Guest session token     |
| Rate Limit   | 100/min                                 |
| RBAC         | Player / Guest                          |

**Request:**
```json
{
  "mode": "classic"  // "classic" | "daily" | "cipher"
  // jika cipher: "puzzleId": "uuid"
}
```

**Response 201:**
```json
{
  "data": {
    "sessionId": "uuid",
    "mode": "classic",
    "maxAttempts": 8,
    "attemptsUsed": 0,
    // cipher only:
    "ciphertext": "F846",
    "cipherMethod": "caesar_hex",
    "hint": "Think about shifting..."  // nullable
  }
}
```

> ⚠️ **SECURITY**: `secretCode` TIDAK pernah ada di response.

**Errors:** `400` invalid mode, `400` daily already completed (registered), `404` puzzle not found.

---

### POST `/api/v1/games/:sessionId/guess`

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Auth         | ✅ Bearer JWT / Guest session           |
| Rate Limit   | 100/min                                 |
| RBAC         | Owner of session only                   |

**Request:**
```json
{ "guess": "A3F1" }  // 4 hex chars, case-insensitive
```

**Response 200:**
```json
{
  "data": {
    "attemptNumber": 3,
    "attemptsRemaining": 5,
    "feedback": [
      { "position": 0, "digit": "A", "status": "correct" },
      { "position": 1, "digit": "3", "status": "misplaced" },
      { "position": 2, "digit": "F", "status": "wrong" },
      { "position": 3, "digit": "1", "status": "correct" }
    ],
    "status": "in_progress",
    // only when game ends:
    "score": null,
    "correctCode": null   // shown only on game over
  }
}
```

**Game Won Response:**
```json
{
  "data": {
    "feedback": [{"status":"correct"},{"status":"correct"},{"status":"correct"},{"status":"correct"}],
    "status": "won",
    "score": 600,
    "correctCode": "A3F1",
    "progression": {
      "xpEarned": 600,
      "totalXp": 6500,
      "level": 7,
      "leveledUp": false,
      "streakCount": 5,
      "newBadges": [{ "id": "B-02", "name": "Code Master" }]
    }
  }
}
```

**Errors:** `400` invalid hex, `400` game already completed, `404` session not found.

---

### POST `/api/v1/games/:sessionId/hint`

| Auth | Rate Limit | RBAC | Mode |
|------|-----------|------|------|
| ✅ JWT | 100/min | Session owner | Cipher only |

**Response 200:** `{ "data": { "hint": "The shift is between 3-7", "hintsUsed": 1, "scorePenalty": "50%" } }`

---

### GET `/api/v1/games/:sessionId`

| Auth | Rate Limit | RBAC |
|------|-----------|------|
| ✅ JWT/Guest | 100/min | Session owner |

**Response 200:** Full session state (guesses, feedback, status).

---

## 4. Endpoints — Leaderboard

### GET `/api/v1/leaderboard/:mode`

| Field        | Detail                                  |
|--------------|-----------------------------------------|
| Auth         | ❌ None (public)                        |
| Rate Limit   | 100/min                                 |
| RBAC         | Public                                  |
| Params       | `:mode` = `classic`, `daily`, `cipher`  |
| Query        | `?limit=50` (default 50, max 100)       |

**Response 200:**
```json
{
  "data": {
    "mode": "classic",
    "entries": [
      { "rank": 1, "nickname": "CryptoKing", "score": 800, "level": 12 },
      { "rank": 2, "nickname": "HexWizard", "score": 700, "level": 9 }
    ],
    "ownRank": {  // only if authenticated
      "rank": 12, "nickname": "You", "score": 300
    },
    "total": 156
  }
}
```

---

## 5. Endpoints — Profile & Progress

### GET `/api/v1/profile`

| Auth | RBAC |
|------|------|
| ✅ JWT | Registered Player |

**Response 200:**
```json
{
  "data": {
    "user": { "id":"uuid", "username":"hexmaster", "nickname":"HexMaster42", "role":"player", "level":7, "totalXp":6500 },
    "stats": { "classicPlayed":20, "classicWon":16, "classicBest":800, "dailyPlayed":10, "dailyWon":8, "totalPlayed":42, "totalWon":33 },
    "streak": { "current": 5, "longest": 12, "lastPlayedDate": "2026-04-17" },
    "badges": [
      { "id":"B-01", "name":"First Blood", "unlockedAt":"2026-04-10T..." },
      { "id":"B-02", "name":"Code Master", "unlockedAt":"2026-04-12T..." }
    ]
  }
}
```

---

### PATCH `/api/v1/profile`

| Auth | RBAC |
|------|------|
| ✅ JWT | Self only |

**Request:** `{ "nickname": "NewName", "currentPassword": "...", "newPassword": "..." }`

**Errors:** `400` validation, `401` wrong current password.

---

### GET `/api/v1/achievements`

| Auth | RBAC |
|------|------|
| ✅ JWT | Registered Player |

**Response 200:**
```json
{
  "data": [
    { "id":"B-01", "name":"First Blood", "desc":"Complete your first game", "unlocked":true, "unlockedAt":"..." },
    { "id":"B-02", "name":"Code Master", "desc":"Solve in 1-3 attempts", "unlocked":true },
    { "id":"B-03", "name":"Perfectionist", "desc":"Score 800 in Classic", "unlocked":false }
  ]
}
```

---

## 6. Endpoints — Admin

> **Semua admin endpoint**: Auth ✅ JWT + RBAC `admin` + Rate Limit 100/min

### GET `/api/v1/admin/dashboard`

**Response 200:**
```json
{
  "data": {
    "totalPlayers": 156,
    "totalPuzzles": 12,
    "puzzlesByStatus": { "draft":3, "published":7, "archived":2 },
    "gamesToday": 45
  }
}
```

---

### GET `/api/v1/admin/puzzles`

**Query:** `?status=draft&page=1&limit=20`

**Response 200:** `{ "data": { "puzzles": [...], "total": 12, "page": 1 } }`

---

### POST `/api/v1/admin/puzzles`

**Request:**
```json
{
  "title": "Hex Shift #1",       // max 100 chars
  "plaintext": "A3F1",           // 4 hex chars
  "shiftValue": 5,               // 0-15
  "hint": "Think about mod 16"  // optional
}
```

**Response 201:** Server computes `ciphertext` = Caesar(plaintext, shift).
```json
{ "data": { "id":"uuid", "title":"Hex Shift #1", "plaintext":"A3F1", "ciphertext":"F846", "shiftValue":5, "status":"draft" } }
```

---

### PATCH `/api/v1/admin/puzzles/:id`

**Request:** `{ "status": "published" }` or `{ "title": "...", "hint": "..." }`

**Rules:** Draft→Published ✅ | Published→Archived ✅ | Archived→* ❌ (400)

---

### DELETE `/api/v1/admin/puzzles/:id`

Only **Draft** puzzles can be deleted. Published/Archived → `400`.

---

## 7. Security Summary per Endpoint

| Endpoint                    | Auth     | RBAC     | Rate Limit     | Input Validation       |
|-----------------------------|----------|----------|----------------|------------------------|
| POST /auth/register         | ❌       | Public   | 100/min        | username, password, nickname |
| POST /auth/login            | ❌       | Public   | **5/min/IP**   | username, password     |
| POST /auth/refresh          | ✅ Refresh| Auth    | 100/min        | refreshToken           |
| POST /auth/guest            | ❌       | Public   | 100/min        | nickname               |
| POST /games/start           | ✅ JWT   | Player   | 100/min        | mode, puzzleId         |
| POST /games/:id/guess       | ✅ JWT   | Owner    | 100/min        | guess (4 hex)          |
| POST /games/:id/hint        | ✅ JWT   | Owner    | 100/min        | —                      |
| GET /leaderboard/:mode      | ❌       | Public   | 100/min        | mode param             |
| GET /profile                | ✅ JWT   | Self     | 100/min        | —                      |
| PATCH /profile              | ✅ JWT   | Self     | 100/min        | nickname, passwords    |
| GET /achievements           | ✅ JWT   | Player   | 100/min        | —                      |
| GET /admin/dashboard        | ✅ JWT   | **Admin**| 100/min        | —                      |
| GET /admin/puzzles          | ✅ JWT   | **Admin**| 100/min        | query params           |
| POST /admin/puzzles         | ✅ JWT   | **Admin**| 100/min        | title, plaintext, shift|
| PATCH /admin/puzzles/:id    | ✅ JWT   | **Admin**| 100/min        | status, fields         |
| DELETE /admin/puzzles/:id   | ✅ JWT   | **Admin**| 100/min        | —                      |
| GET /health                 | ❌       | Public   | —              | —                      |

---

## 8. Versioning Strategy

### 8.1 URI-Based Versioning

```
/api/v1/games/start     ← Current (active)
/api/v2/games/start     ← Future version (when needed)
```

| Aspek                  | Policy                                              |
|------------------------|------------------------------------------------------|
| Version Format         | `/api/v{major}/...`                                  |
| Breaking Change        | Increment major version → new URI prefix             |
| Non-Breaking Change    | Add fields to response (backward compatible in v1)   |
| Max Supported Versions | 2 concurrent versions (current + previous)           |

### 8.2 Backward Compatibility Rules

| ✅ Backward Compatible               | ❌ Breaking Change                    |
|---------------------------------------|---------------------------------------|
| Add new optional field to response    | Remove/rename existing response field |
| Add new optional query parameter      | Change field data type                |
| Add new endpoint                      | Remove endpoint                       |
| Add new enum value                    | Change URL structure                  |
| Relax input validation                | Tighten input validation              |

### 8.3 Deprecation Policy

| Phase        | Action                                                  | Duration    |
|--------------|----------------------------------------------------------|-------------|
| **Announce** | Add `Sunset` header + `Deprecation` header to responses | —           |
| **Grace**    | Both v1 and v2 supported. Log v1 usage metrics.         | 3 months    |
| **Sunset**   | Return `410 Gone` for deprecated endpoints.              | After grace |

**Deprecation Headers:**
```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 17 Jul 2026 00:00:00 GMT
Link: </api/v2/games/start>; rel="successor-version"
```

---

## 9. Health Check

### GET `/health`

```json
{
  "status": "ok",
  "timestamp": "2026-04-17T12:00:00Z",
  "version": "1.0.0",
  "database": "connected",
  "uptime": 86400
}
```

---

> **Status: DRAFT — Menunggu Review & Approval**
