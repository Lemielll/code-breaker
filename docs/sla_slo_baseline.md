# 📊 SLA/SLO Baseline — Code Breaker

| Field             | Detail                                  |
|-------------------|-----------------------------------------|
| **Nama Sistem**   | Code Breaker                            |
| **Versi**         | 1.0                                     |
| **Tanggal**       | 17 April 2026                           |

---

## 1. Service Level Objectives (SLO)

| SLO ID | Metrik                  | Target       | Window         | Prioritas |
|--------|-------------------------|--------------|----------------|-----------|
| SLO-01 | P95 Response Time (API) | **≤ 500ms**  | 30 hari rolling| Critical  |
| SLO-02 | Uptime                  | **≥ 99.0%**  | Per bulan      | Critical  |
| SLO-03 | Error Rate (HTTP 5xx)   | **≤ 1.0%**   | 30 hari rolling| High      |
| SLO-04 | Throughput              | **≥ 20 CCU** | Kapan saja     | High      |

### SLO-01: P95 Response Time Detail

| Endpoint Category          | P50    | P95    | P99    |
|---------------------------|--------|--------|--------|
| Auth (login, register)    | ≤200ms | ≤400ms | ≤800ms |
| Game (start, guess)       | ≤100ms | ≤300ms | ≤500ms |
| Leaderboard (read)        | ≤150ms | ≤500ms | ≤1000ms|
| Admin CRUD                | ≤200ms | ≤500ms | ≤1000ms|

### SLO-02: Uptime Detail

- **Downtime Budget**: maks ~7.3 jam/bulan (432 menit).
- **Pengecualian**: Scheduled maintenance (pemberitahuan ≥24 jam) tidak dihitung.

### SLO-03: Error Rate

- Formula: `Error Rate = (Count_5xx / Total_Requests) × 100`
- HTTP 4xx **tidak** dihitung sebagai server error.
- Alert threshold: Warning >0.5% (15 min), Critical >1.0% (5 min).

---

## 2. Service Level Agreement (SLA)

| Parameter               | Value                                    |
|--------------------------|------------------------------------------|
| Service Hours            | 24/7 (best-effort, no on-call rotation)  |
| Maintenance Window       | Senin, 02:00–04:00 WIB (jika perlu)     |
| Maintenance Notification | ≥ 24 jam sebelumnya                      |
| Incident Response        | Best-effort, next business day           |

### Severity & Response Targets

| Severity | Definisi                                  | Response  | Resolution |
|----------|-------------------------------------------|-----------|------------|
| **S1**   | Sistem down total                         | ≤ 30 mnt  | ≤ 2 jam    |
| **S2**   | Fitur inti (gameplay) tidak berfungsi     | ≤ 1 jam   | ≤ 4 jam    |
| **S3**   | Fitur non-inti bermasalah, workaround ada | ≤ 4 jam   | ≤ 24 jam   |
| **S4**   | Cosmetic issue, typo, minor UI            | ≤ 24 jam  | Next cycle |

---

## 3. Disaster Recovery

### RTO & RPO

| Parameter | Target      | Strategi                                                    |
|-----------|-------------|-------------------------------------------------------------|
| **RTO**   | **≤ 2 jam** | Pre-configured deploy scripts. Server replacement procedure.|
| **RPO**   | **≤ 1 jam** | DB backup `pg_dump` setiap 1 jam (cron). WAL jika tersedia. |

### Backup Strategy

| Komponen           | Metode                       | Frekuensi      | Retensi   |
|--------------------|------------------------------|----------------|-----------|
| PostgreSQL (hourly)| `pg_dump` compressed         | Setiap 1 jam   | 7 hari    |
| PostgreSQL (daily) | Full dump + integrity check  | Harian 00:00   | 30 hari   |
| Application code   | Git repository               | Setiap commit  | Indefinite|
| Environment config | Encrypted `.env` backup      | Setiap perubahan| 30 hari  |

### Recovery Procedure

```
1. Identifikasi root cause (server/DB/app crash)
2. Provision ulang / restart instance
3. Restore aplikasi dari Git (latest release tag)
4. Restore database dari backup terakhir (pg_restore)
5. Verify data integrity
6. Restart services, run health check
7. Verify SLO compliance
8. Update incident log
```

---

## 4. Monitoring & Alerting

| Metrik                    | Alert Condition                   |
|---------------------------|-----------------------------------|
| Response Time P95         | >500ms selama >5 menit           |
| Error Rate (5xx)          | >1% dalam 5 menit                |
| Server Uptime             | 3× consecutive health check fail |
| CPU / Memory Usage        | CPU >80% atau Memory >85%        |
| DB connections            | Active connections >15            |
| Disk Usage                | >80%                              |

### Health Check Endpoint

```json
// GET /health → 200
{
  "status": "ok",
  "timestamp": "2026-04-17T12:00:00Z",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## 5. Error Budget Policy

| Kondisi                   | Aksi                                                       |
|---------------------------|-------------------------------------------------------------|
| Budget >50%               | Develop fitur baru normal.                                  |
| Budget 20–50%             | Prioritaskan reliability. Limit risky deployments.          |
| Budget <20%               | **Freeze fitur baru**. Fokus stabilitas.                    |
| Budget habis (SLO violated)| Post-mortem wajib. Improvement plan sebelum lanjut.        |

---

## 6. Review Cadence

| Aktivitas                    | Frekuensi       |
|-------------------------------|-----------------|
| SLO compliance review         | Bulanan         |
| Backup restore test           | Per 3 bulan     |
| Load test (20 CCU)            | Setiap major release |
| SLA/SLO target revision       | Per 6 bulan     |
| Full disaster recovery drill  | Per 6 bulan     |

> **Status: DRAFT — Menunggu Approval**
