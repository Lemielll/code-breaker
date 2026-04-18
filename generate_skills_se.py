import os 
 
def create_skill_files(): 
    skill_dir = ".antigravity/skills" 
    os.makedirs(skill_dir, exist_ok=True) 
    print(f"📁 Membangun direktori {skill_dir} untuk Software Engineering...") 
 
    skills = { 
        "database-design.md": """--- 
name: database-design 
description: Panduan desain database, ERD, kamus data, dan migration strategy. --- 
# 🗄 STANDAR DATABASE DESIGN & MIGRATION 
1. Visual ERD: Gunakan Mermaid erDiagram di dalam blok HTML. Tampilkan SEMUA 
entitas dan relasi. 
2. Security: Tandai kolom sensitif (PII/PHI) dengan komentar // enkripsi pada 
skema ERD. 
3. Migration Strategy: 
   - WAJIB sediakan fungsi down() untuk rollback di setiap migration file. 
   - Terapkan Zero-Downtime Migration (jangan langsung hapus kolom/tabel yang 
sedang dipakai). 
""", 
 
        "software-arch.md": """--- 
name: software-arch 
description: Panduan untuk arsitektur sistem (SAD IEEE 1016) dan Security 
Architecture. --- 
# 🏗 STANDAR SOFTWARE ARCHITECTURE 
1. Architecture Diagram: Gunakan format SVG BERLAYER interaktif. 
   Layer: Client (c-blue) -> Gateway (c-teal) -> Services (c-purple) -> Data (c
teal) -> Observability (c-amber). 
2. Security Architecture: Petakan mitigasi OWASP Top 10 secara eksplisit. 
3. Git & Environment: Definisikan Git branching (Gitflow/Trunk-based) dan 
strategi environment (Dev, Staging, Prod). 
""", 
 
        "use-case.md": """--- 
name: use-case 
description: Panduan pembuatan Use Case Diagram dan spesifikasi fungsional. --- 
# 👤 STANDAR USE CASE (UML 2.5) 
1. Use Case Diagram: Gunakan SVG INTERAKTIF (node clickable). 
   - Warna: c-teal (keamanan), c-purple (fungsional), c-coral (admin). 
2. Security Use Cases: WAJIB sertakan UC khusus seperti Login, Session 
Management, 
   Authorization Check, dan Audit Log. 
""", 
 
        "sqa-plan.md": """--- 
name: sqa-plan 
description: Panduan Shift-Left Testing, Quality Gates, dan Unit Testing (AAA). --- 
# 🧪 STANDAR SOFTWARE QUALITY ASSURANCE (SQAP) 
1. Shift-Left Testing: SQA dimulai dari validasi Requirements (Gate 0) hingga 
Production (Gate 5). 
2. Unit Test (AAA Pattern): Wajib menggunakan pola Arrange-Act-Assert. 
   Minimal skenario: Happy path, Invalid input, Error handling, Boundary, Edge 
case, dan Authorization. 
3. Security Testing: Wajib instruksikan tes SQL Injection, XSS, Broken Access 
Control, dan JWT Tampering. 
""", 
 
        "api-spec.md": """--- 
name: api-spec 
description: Panduan pembuatan OpenAPI Specification 3.0. --- 
# 🌐 STANDAR API SPECIFICATION 
1. Security per Endpoint: Dokumentasikan syarat Autentikasi, Otorisasi (RBAC), 
dan Rate Limiting 
   di setiap endpoint. 
2. Versioning & Deprecation: Gunakan URL versioning (misal /api/v1/). 
   Sertakan Deprecation Policy (header Sunset). 
""", 
 
        "ui-design.md": """--- 
name: ui-design 
description: Panduan UI/UX Wireframe, Flowchart, dan Sitemap. --- 
# 🎨 STANDAR UI/UX DESIGN (WCAG 2.1) 
1. Wireframe HTML: Hasilkan SATU blok HTML + inline CSS per halaman. 
   WAJIB sediakan "Error State" desain. 
2. Sitemap & Flow: Gunakan Mermaid graph TD untuk Sitemap dan flowchart TD 
   untuk UX Flow (lengkapi dengan decision diamond). 
""" 
    } 
 
    for filename, content in skills.items(): 
        filepath = os.path.join(skill_dir, filename) 
        with open(filepath, "w", encoding="utf-8") as f: 
            f.write(content) 
        print(f"✅ Berhasil membuat: {filepath}") 
 
    print("\n🎉 SETUP SKILL FILES SOFTWARE ENGINEERING SELESAI!") 
 
if __name__ == "__main__": 
    create_skill_files()