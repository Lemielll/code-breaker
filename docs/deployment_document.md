# 🚀 Deployment Document — Code Breaker

> **Versi**: 1.0 | **Tanggal**: 17 April 2026 | **Target**: Production (VPS/Cloud)

---

## 1. Pre-Deployment Checklist

### 1.1 Code & Quality Gates

| #  | Item                                              | Status | Verified By |
|----|---------------------------------------------------|--------|-------------|
| 1  | Git tag `v1.0.0` dibuat pada commit release       | ☐      | _________   |
| 2  | Branch `release/1.0` merged ke `main`             | ☐      | _________   |
| 3  | ESLint: zero errors (`npm run lint`)               | ☐      | _________   |
| 4  | Unit test coverage ≥ 80% (`npm test`)              | ☐      | _________   |
| 5  | Integration tests: 100% pass                       | ☐      | _________   |
| 6  | Security tests: 100% pass (10/10)                  | ☐      | _________   |
| 7  | Performance: P95 ≤ 500ms at 20 VU (k6)            | ☐      | _________   |
| 8  | UAT: ≥95% pass, zero S1/S2, sign-off diperoleh    | ☐      | _________   |
| 9  | `npm audit` — zero critical/high vulnerabilities   | ☐      | _________   |
| 10 | No `console.log` in production code                | ☐      | _________   |

### 1.2 Configuration & Secrets

| #  | Item                                              | Status | Verified By |
|----|---------------------------------------------------|--------|-------------|
| 11 | `.env.production` file configured on server        | ☐      | _________   |
| 12 | `JWT_ACCESS_SECRET` — random ≥ 32 chars            | ☐      | _________   |
| 13 | `JWT_REFRESH_SECRET` — random ≥ 32 chars (≠ access)| ☐      | _________   |
| 14 | `DAILY_CHALLENGE_SECRET` — random secret set       | ☐      | _________   |
| 15 | `ADMIN_PASSWORD` — strong, changed from default    | ☐      | _________   |
| 16 | `DATABASE_URL` — pointing to production DB         | ☐      | _________   |
| 17 | `CORS_ORIGIN` — set to production domain           | ☐      | _________   |
| 18 | `NODE_ENV=production`                              | ☐      | _________   |
| 19 | `BCRYPT_SALT_ROUNDS=12` (production)               | ☐      | _________   |
| 20 | `.env` files NOT in Git (`git ls-files .env*`)     | ☐      | _________   |

### 1.3 Infrastructure

| #  | Item                                              | Status | Verified By |
|----|---------------------------------------------------|--------|-------------|
| 21 | PostgreSQL 14+ running and accessible              | ☐      | _________   |
| 22 | Production database `codebreaker_prod` created     | ☐      | _________   |
| 23 | Node.js 18 LTS installed                           | ☐      | _________   |
| 24 | PM2 installed globally (`npm i -g pm2`)             | ☐      | _________   |
| 25 | Firewall: only port 80/443 exposed                 | ☐      | _________   |
| 26 | Backup cron job configured (pg_dump hourly)        | ☐      | _________   |
| 27 | Log directory created with write permissions       | ☐      | _________   |
| 28 | SSL/TLS certificate configured (HTTPS)             | ☐      | _________   |

---

## 2. Deployment Steps

```bash
# === STEP 1: Backup Current State ===
pg_dump -U postgres codebreaker_prod > backup_$(date +%Y%m%d_%H%M%S).sql

# === STEP 2: Pull Release Code ===
cd /var/www/code-breaker
git fetch origin
git checkout v1.0.0

# === STEP 3: Install Dependencies ===
cd src/server
npm ci --production

# === STEP 4: Run Database Migrations ===
npx prisma migrate deploy

# === STEP 5: Seed Admin (first deploy only) ===
node prisma/seed.js

# === STEP 6: Build Frontend ===
cd ../client
npm ci
npm run build

# === STEP 7: Start/Restart with PM2 ===
cd ../server
pm2 start server.js --name code-breaker --env production
# atau restart: pm2 restart code-breaker

# === STEP 8: Verify ===
curl http://localhost:3000/health
# Expected: {"status":"ok","version":"1.0.0"}

# === STEP 9: Post-Deployment Smoke Test ===
# Manual: test login, play 1 game, check leaderboard
```

---

## 3. Rollback Procedure

### 3.1 Kapan Rollback?

| Kondisi                                    | Keputusan     |
|---------------------------------------------|---------------|
| Health check fail setelah deploy            | **Rollback**  |
| Error rate > 5% dalam 15 menit pertama     | **Rollback**  |
| Critical bug ditemukan saat smoke test      | **Rollback**  |
| P95 > 1000ms sustained                     | **Investigate, rollback jika perlu** |
| Minor UI issue                              | Hotfix, no rollback |

### 3.2 Rollback Steps

```bash
# === STEP 1: Stop Current Version ===
pm2 stop code-breaker

# === STEP 2: Revert Code ===
cd /var/www/code-breaker
git checkout v0.9.0   # previous stable tag

# === STEP 3: Restore Database (jika migration ada breaking change) ===
psql -U postgres codebreaker_prod < backup_YYYYMMDD_HHMMSS.sql

# === STEP 4: Reinstall Dependencies ===
cd src/server
npm ci --production

# === STEP 5: Restart ===
pm2 restart code-breaker

# === STEP 6: Verify ===
curl http://localhost:3000/health

# === STEP 7: Notify Team ===
echo "ROLLBACK COMPLETE — v0.9.0 restored. Investigate root cause."
```

### 3.3 Rollback Timeline

| Fase        | Durasi Target |
|-------------|---------------|
| Detection   | ≤ 5 menit     |
| Decision    | ≤ 5 menit     |
| Execution   | ≤ 15 menit    |
| Verification| ≤ 5 menit     |
| **Total**   | **≤ 30 menit**|

---

## 4. Runbook Operasional

### 4.1 Metrik Dashboard yang Dipantau

| Metrik                  | Tool / Command                    | Threshold Normal | Alert Condition    |
|-------------------------|-----------------------------------|-------------------|--------------------|
| Health status           | `GET /health`                     | `status: ok`      | ≠ ok atau timeout  |
| P95 response time       | PM2 metrics / application logs   | ≤ 500ms           | > 500ms (5 min)    |
| Error rate (5xx)        | Log analysis / grep              | ≤ 1%              | > 1% (5 min)       |
| CPU usage               | `pm2 monit` / `top`              | < 80%             | ≥ 80% sustained    |
| Memory usage            | `pm2 monit` / `free -m`          | < 85%             | ≥ 85% sustained    |
| DB connections          | `pg_stat_activity`               | < 15 active       | ≥ 15 active        |
| Disk usage              | `df -h`                          | < 80%             | ≥ 80%              |
| PM2 process status      | `pm2 status`                     | `online`          | `errored`/`stopped`|

### 4.2 Troubleshooting Guide

#### 🔴 Application Not Starting

```bash
# 1. Check PM2 logs
pm2 logs code-breaker --lines 50

# 2. Common causes:
#    - Missing .env.production → CONFIG error
#    - DB not reachable → Prisma connection error
#    - Port already in use → kill conflicting process

# 3. Fix & restart
pm2 restart code-breaker
```

#### 🔴 Database Connection Failed

```bash
# 1. Check PostgreSQL status
sudo systemctl status postgresql

# 2. Check connection
psql -U postgres -h localhost -d codebreaker_prod -c "SELECT 1;"

# 3. Check connection pool
psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='codebreaker_prod';"

# 4. Restart PostgreSQL if needed
sudo systemctl restart postgresql
```

#### 🟡 High Response Time (P95 > 500ms)

```bash
# 1. Check slow queries
psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC LIMIT 5;"

# 2. Check missing indexes
# Compare with indexing strategy in database_design.md

# 3. Check PM2 memory
pm2 monit

# 4. If memory leak suspected:
pm2 restart code-breaker
```

#### 🟡 Error Rate Spike

```bash
# 1. Check recent errors in log
grep '"level":"error"' logs/app.log | tail -20

# 2. Check 5xx by endpoint
grep '"statusCode":5' logs/app.log | jq '.path' | sort | uniq -c | sort -rn

# 3. If specific endpoint failing, check that service
```

#### 🔴 Disk Full

```bash
# 1. Check log sizes
du -sh logs/

# 2. Rotate logs (manual)
pm2 flush
truncate -s 0 logs/app.log

# 3. Clean old backups
find /backups -name "*.sql" -mtime +7 -delete
```

### 4.3 Backup Verification

```bash
# Monthly: test restore to staging DB
createdb codebreaker_restore_test
pg_restore -d codebreaker_restore_test latest_backup.sql

# Verify row counts
psql -d codebreaker_restore_test -c "SELECT 'users', count(*) FROM users
UNION ALL SELECT 'game_sessions', count(*) FROM game_sessions;"

# Cleanup
dropdb codebreaker_restore_test
```

### 4.4 Cron Jobs

```bash
# /etc/crontab additions:
# Hourly DB backup
0 * * * * pg_dump -U postgres codebreaker_prod | gzip > /backups/hourly_$(date +\%H).sql.gz

# Daily full backup with retention
0 0 * * * pg_dump -U postgres -Fc codebreaker_prod > /backups/daily_$(date +\%Y\%m\%d).dump

# Weekly cleanup (keep 7 daily)
0 1 * * 0 find /backups -name "daily_*.dump" -mtime +7 -delete

# Log rotation
0 0 * * * pm2 flush
```

---

## 5. Post-Deployment Monitoring Checklist

| # | Check                                    | Waktu        | Status | Notes   |
|---|------------------------------------------|--------------|--------|---------|
| 1 | Health check returns 200                 | T+0 min      | ☐      |         |
| 2 | Login berhasil (admin + player)          | T+2 min      | ☐      |         |
| 3 | Complete 1 Classic game                  | T+5 min      | ☐      |         |
| 4 | Leaderboard menampilkan data             | T+5 min      | ☐      |         |
| 5 | Admin panel accessible                   | T+5 min      | ☐      |         |
| 6 | No 5xx errors in logs                    | T+10 min     | ☐      |         |
| 7 | PM2 status: online, restarts = 0         | T+10 min     | ☐      |         |
| 8 | Memory usage stable                      | T+15 min     | ☐      |         |
| 9 | P95 response time ≤ 500ms               | T+15 min     | ☐      |         |
| 10| Error rate ≤ 1%                          | T+30 min     | ☐      |         |
| 11| No anomalous patterns in logs            | T+30 min     | ☐      |         |
| 12| Backup cron executed successfully        | T+60 min     | ☐      |         |
| 13| **All clear — deployment confirmed**     | T+60 min     | ☐      |         |

> **Status: DRAFT — Siap untuk Deployment**
