import streamlit as st 
 
st.set_page_config(page_title="Antigravity SE Prompt Generator (v1.5)", 
layout="wide") 
 
st.title("💻 Antigravity Software Engineering Prompt Generator") 
st.markdown("**Versi 1.5 Hybrid Diagrams Edition**: Enterprise DevOps, OWASP Security, Shift-Left SQA, & Observability.") 
 
tab1, tab2, tab3, tab4, tab5, tab6 = st.tabs([ 
    "Fase 2: Kickoff & SRS", 
    "Fase 3: Arsitektur & DB", 
    "Fase 3: SQA & Test Plan", 
    "Fase 4: UI/UX & API", 
    "Fase 5: Implementasi Modul", 
    "Fase 6: Deploy & UAT" 
]) 
 
# TAB 1: FASE 2 - KICKOFF & SRS 
with tab1: 
    st.header("📝 Fase 2: Project Kickoff & Requirements") 
    col1, col2 = st.columns(2) 
    with col1: 
        app_name = st.text_input("Nama Sistem", value="Sistem Informasi Terpadu") 
        domain = st.selectbox("Jenis Lembaga", ["Klinik/RS", "Koperasi/Finance", 
"Sekolah/Kampus", "Ritel/POS", "Pemda", "Lainnya"]) 
        users = st.text_input("Estimasi Concurrent Users", value="500") 
    with col2: 
        tech_stack = st.text_input("Preferensi Teknologi", value="React + Node.js + PostgreSQL") 
        sensitive_data = st.text_input("Data Sensitif (PII/PHI)", value="Rekam Medis, NIK, Password") 
    st.divider() 
    prompt_2 = f"""Kita mulai project pengembangan sistem baru. - Nama Sistem: **{app_name}** - Jenis Lembaga: **{domain}** - Teknologi Preferensi: **{tech_stack}** - Target Concurrent Users: **{users}** - Data Sensitif: **{sensitive_data}** 
 
TUGAS ANDA: 
1. (Fase 2A) Ajukan maksimal 10 pertanyaan elicitasi yang tajam mengenai: 
   Fungsional Utama, Hak Akses (RBAC), Integrasi Eksternal, 
   Keamanan & Regulasi (OWASP), serta Performa & SLA. Tunggu saya menjawab. 
2. SETELAH saya menjawab, hasilkan 3 Dokumen (Fase 2B): 
   - Project Charter: Ruang lingkup, milestone, risiko. 
   - SRS Draft (IEEE 830): Kebutuhan fungsional (FR) dan kebutuhan keamanan. 
   - SLA/SLO Baseline: Tentukan P95 Response Time, Uptime, Error Rate, dan 
RTO/RPO. 
Jangan cetak dokumen sebelum saya menjawab pertanyaan wawancara! 
""" 
    st.code(prompt_2, language="markdown") 
 
# TAB 2: FASE 3 - DESAIN ARSITEKTUR & DB 
with tab2: 
    st.header("🏗 Fase 3: Use Case, ERD & Arsitektur") 
    st.divider() 
    prompt_3 = """Berdasarkan SRS yang telah disetujui, kita masuk ke Fase 
Perancangan (Fase 3). 
 
TUGAS ANDA: 
1. (Fase 3A) Baca @use-case.md. Hasilkan Use Case Specification dan SVG 
Interaktif 
   untuk Use Case Diagram. Sertakan Use Case Keamanan. 
2. (Fase 3B) Baca @database-design.md. Hasilkan desain Database (ERD menggunakan 
Mermaid). 
   Buat Kamus Data dan rumuskan Migration & Rollback Strategy. 
3. (Fase 3C) Baca @software-arch.md. Hasilkan Software Architecture Document 
(SAD IEEE 1016) 
   beserta SVG Berlayer untuk Architecture Diagram. 
   - Rincikan Git Workflow, Environment Strategy (Dev/Staging/Prod). 
   - Buat Security Architecture (Threat Model STRIDE & OWASP Mitigations). 
Eksekusi secara berurutan dan jangan buat diagram ASCII! 
""" 
    st.code(prompt_3, language="markdown") 
 
# TAB 3: FASE 3 - SQA & TEST PLAN 
with tab3: 
    st.header("🧪 Fase 3: Shift-Left SQA & Test Plan") 
    st.divider() 
    prompt_3_sqa = """Lanjutkan dengan perancangan Quality Assurance (Shift-Left 
Testing). 
 
TUGAS ANDA: 
1. (Fase 3D) Baca @test-plan.md. Hasilkan Master Test Plan (IEEE 829). 
   Rancang juga Performance Test Plan berdasarkan SLA/SLO Baseline dari Fase 2B. 
2. (Fase 3E-A) Baca @sqa-plan.md. Hasilkan SQA Plan (IEEE 730). 
   - Tetapkan Quality Gates & Definition of Done (DoD) dari Gate 0 
(Requirements) 
     hingga Gate 5 (Production Ready). 
   - Tentukan Standar Kode dan Manajemen Defect (SLA Perbaikan berdasar 
severity). 
""" 
    st.code(prompt_3_sqa, language="markdown") 
 
# TAB 4: FASE 4 - UI/UX & API SPEC 
with tab4: 
    st.header("🎨 Fase 4: UI/UX Wireframe & API Spec") 
    st.divider() 
    prompt_4 = """Kita masuk ke perancangan Antarmuka dan API. 
 
TUGAS ANDA: 
1. (Fase 4A) Baca @ui-design.md. Hasilkan Design System (WCAG 2.1). 
   Buat Sitemap dan UX Flow menggunakan Mermaid. 
   Hasilkan Wireframe UI menggunakan blok HTML + Inline CSS lengkap dengan Error 
States. 
2. (Fase 4B) Baca @api-spec.md. Hasilkan dokumentasi API (OpenAPI 3.0). 
   - Tentukan Syarat Keamanan per endpoint (Auth, RBAC, Rate Limiting). 
   - Rancang Versioning Strategy dan Deprecation Policy (Backward Compatibility, 
Sunset header). 
""" 
    st.code(prompt_4, language="markdown") 
 
# TAB 5: FASE 5 - IMPLEMENTASI & REVIEW 
with tab5: 
    st.header("💻 Fase 5: Implementasi Kode, Git & Observability") 
    module_name = st.text_input("Nama Modul yang Akan Dikerjakan", value="Modul Autentikasi & RBAC") 
    st.divider() 
    prompt_5 = f"""Masuk ke Fase 5: Implementasi. 
 
TUGAS ANDA (Jalankan berurutan): 
1. (Fase 5A) Buat Project Scaffold. Siapkan .gitignore, Multi-Environment Config 
   (.env.development, dll), dan Observability Setup (Structured Logging JSON & 
Health Check Endpoint). 
2. (Fase 5B) Implementasikan modul: **{module_name}**. 
   - WAJIB gunakan Transaction (DB) dan Idempotency key untuk operasi kritis. 
   - Terapkan Security: Prepared statements, Input Validation, dan RBAC. 
   - Terapkan Structured Logging (logger.info, logger.audit). 
3. (Fase 5C) Lakukan Code Review pada modul ini berdasarkan OWASP dan SOLID. 
   Hasilkan Tech Debt Register untuk mencatat hutang teknis yang perlu 
diperbaiki nanti. 
""" 
    st.code(prompt_5, language="markdown") 
 
# TAB 6: FASE 6 - DEPLOY & PENUTUPAN 
with tab6: 
    st.header("🚀 Fase 6: UAT, Deploy & Runbook") 
    st.divider() 
    prompt_6 = """Sistem sudah selesai diimplementasikan. Kita masuk ke Fase 
Deployment (Fase 6). 
 
TUGAS ANDA: 
1. (Fase 6A) Hasilkan UAT Script untuk pengguna akhir beserta kriteria 
kelulusan. 
2. (Fase 6B) Hasilkan Dokumen Deployment. WAJIB sertakan: 
   - Pre-Deployment Checklist. 
   - Rollback Procedure. 
   - Runbook Operasional: Panduan troubleshooting, metrik dashboard yang 
dipantau, 
     dan Post-Deployment Monitoring Checklist. 
3. (Fase 6C) Hasilkan Project Closure Report (termasuk status Tech Debt akhir) 
   dan susun draf Paper Akademik S2 (Format APA 7th). 
""" 
    st.code(prompt_6, language="markdown") 