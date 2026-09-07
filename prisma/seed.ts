import {
  PrismaClient, ProjectStatus, TaskStatus, Priority,
  MilestoneStatus, UserRole, RiskLevel, RiskStatus,
  IssueStatus, MemberRole, ExpenseCategory, InvoiceStatus,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database — IT System Integrator (Banking Clients)...");

  // ─── Clean up ───────────────────────────────────────────────────────────────
  await prisma.resourceAllocation.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.budget.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskLabel.deleteMany();
  await prisma.task.deleteMany();
  await prisma.milestone.deleteMany();
  await prisma.risk.deleteMany();
  await prisma.issue.deleteMany();
  await prisma.projectFile.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.label.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  const pw = await bcrypt.hash("password123", 12);

  // ─── Users — Internal Team ──────────────────────────────────────────────────
  const reza = await prisma.user.create({
    data: {
      name: "Reza Firmansyah",
      email: "reza@nexaintegra.id",
      password: pw,
      role: UserRole.ADMIN,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=reza",
    },
  });

  const dinda = await prisma.user.create({
    data: {
      name: "Dinda Ayu Pratiwi",
      email: "dinda@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=dinda",
    },
  });

  const arif = await prisma.user.create({
    data: {
      name: "Arif Budiman",
      email: "arif@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=arif",
    },
  });

  const sari = await prisma.user.create({
    data: {
      name: "Sari Wulandari",
      email: "sari@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=sari",
    },
  });

  const bagas = await prisma.user.create({
    data: {
      name: "Bagas Prasetyo",
      email: "bagas@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=bagas",
    },
  });

  const yuni = await prisma.user.create({
    data: {
      name: "Yuni Rahayu",
      email: "yuni@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=yuni",
    },
  });

  const eko = await prisma.user.create({
    data: {
      name: "Eko Santoso",
      email: "eko@nexaintegra.id",
      password: pw,
      role: UserRole.MEMBER,
      image: "https://api.dicebear.com/7.x/avataaars/svg?seed=eko",
    },
  });

  // ─── Labels ─────────────────────────────────────────────────────────────────
  const lblCore      = await prisma.label.create({ data: { name: "Core Banking", color: "#1E40AF" } });
  const lblAPI       = await prisma.label.create({ data: { name: "API Integration", color: "#0EA5E9" } });
  const lblSecurity  = await prisma.label.create({ data: { name: "Security", color: "#DC2626" } });
  const lblCompliance= await prisma.label.create({ data: { name: "Compliance / OJK", color: "#7C3AED" } });
  const lblInfra     = await prisma.label.create({ data: { name: "Infrastructure", color: "#059669" } });
  const lblUAT       = await prisma.label.create({ data: { name: "UAT", color: "#D97706" } });
  const lblBug       = await prisma.label.create({ data: { name: "Bug", color: "#EF4444" } });
  const lblFrontend  = await prisma.label.create({ data: { name: "Frontend", color: "#F59E0B" } });

  // ─── PROJECT 1: BRI — Internet Banking Revamp ───────────────────────────────
  const pBRI = await prisma.project.create({
    data: {
      name: "BRI — Internet Banking Revamp",
      description:
        "Revamp sistem Internet Banking BRI meliputi redesign antarmuka nasabah, modernisasi backend Java ke microservices, integrasi SNAP BI (API Standar Nasional), serta penguatan keamanan sesuai regulasi OJK PBI 11/2009 dan POJK 38/2016.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.CRITICAL,
      startDate: new Date("2025-10-01"),
      dueDate: new Date("2026-06-30"),
      color: "#1D4ED8",
      creatorId: reza.id,
      members: {
        create: [
          { userId: reza.id,  role: MemberRole.OWNER  },
          { userId: arif.id,  role: MemberRole.ADMIN  },
          { userId: dinda.id, role: MemberRole.MEMBER },
          { userId: bagas.id, role: MemberRole.MEMBER },
          { userId: sari.id,  role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── PROJECT 2: Mandiri — Open Banking API Gateway ──────────────────────────
  const pMandiri = await prisma.project.create({
    data: {
      name: "Mandiri — Open Banking API Gateway",
      description:
        "Implementasi Open Banking API Gateway berbasis SNAP BI untuk Bank Mandiri. Mencakup pengelolaan OAuth 2.0, rate limiting, developer portal, serta integrasi dengan 15+ fintech mitra. Target sertifikasi ISO 27001 sebelum go-live.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      startDate: new Date("2025-11-01"),
      dueDate: new Date("2026-08-31"),
      color: "#F59E0B",
      creatorId: reza.id,
      members: {
        create: [
          { userId: reza.id,  role: MemberRole.OWNER  },
          { userId: bagas.id, role: MemberRole.ADMIN  },
          { userId: yuni.id,  role: MemberRole.MEMBER },
          { userId: eko.id,   role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── PROJECT 3: BCA — Core Banking System Migration ─────────────────────────
  const pBCA = await prisma.project.create({
    data: {
      name: "BCA — Core Banking Migration T24",
      description:
        "Migrasi dari legacy core banking COBOL ke Temenos T24 Transact untuk BCA cabang regional. Scope: data migration 20+ tahun, parallel run 6 bulan, cutover terjadwal, training 500+ staff teller, dan integrasi ATM Bersama.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.CRITICAL,
      startDate: new Date("2025-07-01"),
      dueDate: new Date("2026-12-31"),
      color: "#0EA5E9",
      creatorId: reza.id,
      members: {
        create: [
          { userId: reza.id,  role: MemberRole.OWNER  },
          { userId: arif.id,  role: MemberRole.ADMIN  },
          { userId: eko.id,   role: MemberRole.MEMBER },
          { userId: sari.id,  role: MemberRole.MEMBER },
          { userId: yuni.id,  role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── PROJECT 4: BSI — Mobile Banking Super App ──────────────────────────────
  const pBSI = await prisma.project.create({
    data: {
      name: "BSI — Mobile Banking Super App",
      description:
        "Pengembangan BSI Mobile versi baru berbasis React Native sebagai super app layanan perbankan syariah: transfer, zakat/infaq, pembiayaan, investasi reksa dana syariah, dan integrasi QRIS. Target release App Store & Play Store Q3 2026.",
      status: ProjectStatus.ACTIVE,
      priority: Priority.HIGH,
      startDate: new Date("2026-01-01"),
      dueDate: new Date("2026-09-30"),
      color: "#059669",
      creatorId: dinda.id,
      members: {
        create: [
          { userId: dinda.id, role: MemberRole.OWNER  },
          { userId: reza.id,  role: MemberRole.ADMIN  },
          { userId: bagas.id, role: MemberRole.MEMBER },
          { userId: sari.id,  role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── PROJECT 5: BTN — KPR Digital Platform ──────────────────────────────────
  const pBTN = await prisma.project.create({
    data: {
      name: "BTN — KPR Digital Platform",
      description:
        "Platform digital end-to-end untuk pengajuan KPR BTN secara online: e-KYC, credit scoring otomatis, e-sign akad, integrasi BPN (sertifikat digital), dan dashboard monitoring portofolio KPR. Menggunakan arsitektur event-driven dengan Kafka.",
      status: ProjectStatus.PLANNING,
      priority: Priority.HIGH,
      startDate: new Date("2026-03-01"),
      dueDate: new Date("2026-11-30"),
      color: "#7C3AED",
      creatorId: arif.id,
      members: {
        create: [
          { userId: arif.id,  role: MemberRole.OWNER  },
          { userId: reza.id,  role: MemberRole.ADMIN  },
          { userId: yuni.id,  role: MemberRole.MEMBER },
          { userId: eko.id,   role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── PROJECT 6: BNI — SLIK OJK Integration ──────────────────────────────────
  const pBNI = await prisma.project.create({
    data: {
      name: "BNI — SLIK OJK Integration & Credit Analytics",
      description:
        "Integrasi sistem SLIK OJK (Sistem Layanan Informasi Keuangan) untuk BNI, mencakup real-time query debitur, batch submission, dashboard analitik kredit dengan ML scoring, serta automated reporting BI dan OJK setiap bulan.",
      status: ProjectStatus.COMPLETED,
      priority: Priority.HIGH,
      startDate: new Date("2025-03-01"),
      dueDate: new Date("2025-12-31"),
      color: "#DC2626",
      creatorId: reza.id,
      members: {
        create: [
          { userId: reza.id,  role: MemberRole.OWNER  },
          { userId: sari.id,  role: MemberRole.ADMIN  },
          { userId: bagas.id, role: MemberRole.MEMBER },
        ],
      },
    },
  });

  // ─── TASKS — BRI Internet Banking ───────────────────────────────────────────
  const tBRI = await Promise.all([
    prisma.task.create({ data: { title: "Analisis GAP regulasi OJK PBI & POJK 38/2016", description: "Mapping requirement regulasi terhadap fitur eksisting Internet Banking BRI.", status: TaskStatus.DONE, priority: Priority.CRITICAL, projectId: pBRI.id, assigneeId: reza.id, creatorId: reza.id, dueDate: new Date("2025-10-31"), completedAt: new Date("2025-10-28"), position: 1 } }),
    prisma.task.create({ data: { title: "Desain arsitektur microservices", description: "Rancang arsitektur baru: API Gateway, Auth Service, Transaction Service, Notification Service. Stack: Spring Boot 3, Kubernetes, PostgreSQL.", status: TaskStatus.DONE, priority: Priority.CRITICAL, projectId: pBRI.id, assigneeId: arif.id, creatorId: reza.id, dueDate: new Date("2025-11-15"), completedAt: new Date("2025-11-12"), position: 2 } }),
    prisma.task.create({ data: { title: "Implementasi SNAP BI API Standar", description: "Develop endpoint sesuai standar SNAP BI untuk transfer, inquiry saldo, dan pembayaran BRIVA.", status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, projectId: pBRI.id, assigneeId: arif.id, creatorId: reza.id, dueDate: new Date("2026-02-28"), position: 3 } }),
    prisma.task.create({ data: { title: "Redesign UI/UX Internet Banking Nasabah", description: "Wireframe + desain UI baru menggunakan Figma. Standar aksesibilitas WCAG 2.1 AA. Mobile-responsive.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pBRI.id, assigneeId: dinda.id, creatorId: reza.id, dueDate: new Date("2026-02-15"), position: 4 } }),
    prisma.task.create({ data: { title: "Integrasi 2FA — OTP via SMS & WhatsApp", description: "Implementasi OTP berbasis Twilio dengan fallback WhatsApp Business API untuk nasabah tanpa sinyal.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pBRI.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2026-03-15"), position: 5 } }),
    prisma.task.create({ data: { title: "Penetration Testing & Vulnerability Assessment", description: "Pentest oleh tim internal + vendor eksternal tersertifikasi OWASP Top 10, API Security, dan Banking-specific threats.", status: TaskStatus.TODO, priority: Priority.CRITICAL, projectId: pBRI.id, assigneeId: sari.id, creatorId: reza.id, dueDate: new Date("2026-04-30"), position: 6 } }),
    prisma.task.create({ data: { title: "UAT bersama tim BRI", description: "Skenario UAT 200+ test case bersama tim QA BRI. Termasuk regression test untuk transaksi kritikal.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pBRI.id, assigneeId: dinda.id, creatorId: reza.id, dueDate: new Date("2026-05-31"), position: 7 } }),
    prisma.task.create({ data: { title: "Migrasi data nasabah ke skema baru", description: "ETL migration dari database Oracle 11g ke PostgreSQL 16. Validasi integritas data 50+ juta rekening.", status: TaskStatus.TODO, priority: Priority.CRITICAL, projectId: pBRI.id, assigneeId: arif.id, creatorId: reza.id, dueDate: new Date("2026-05-15"), position: 8 } }),
    prisma.task.create({ data: { title: "Setup CI/CD Pipeline — Jenkins + ArgoCD", description: "Automated deployment pipeline di on-premise Kubernetes cluster BRI datacenter Cibitung.", status: TaskStatus.REVIEW, priority: Priority.HIGH, projectId: pBRI.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2026-02-20"), position: 9 } }),
    prisma.task.create({ data: { title: "Dokumentasi teknis & runbook operasional", description: "Technical documentation untuk tim IT BRI: API spec, runbook, troubleshooting guide, SOP maintenance.", status: TaskStatus.BACKLOG, priority: Priority.MEDIUM, projectId: pBRI.id, assigneeId: sari.id, creatorId: reza.id, dueDate: new Date("2026-06-15"), position: 10 } }),
  ]);

  // ─── TASKS — Mandiri Open Banking ───────────────────────────────────────────
  const tMandiri = await Promise.all([
    prisma.task.create({ data: { title: "Desain Open Banking API Gateway Architecture", description: "Rancang arsitektur Kong Gateway + Kong Konnect untuk manajemen API, rate limiting per partner, monetization.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pMandiri.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2025-11-30"), completedAt: new Date("2025-11-28"), position: 1 } }),
    prisma.task.create({ data: { title: "Implementasi OAuth 2.0 Authorization Server", description: "Deploy Keycloak sebagai Identity Provider untuk fintech partner. PKCE flow, refresh token rotation.", status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, projectId: pMandiri.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2026-03-31"), position: 2 } }),
    prisma.task.create({ data: { title: "Developer Portal — API documentation & sandbox", description: "Portal developer berbasis Backstage dengan live sandbox, API key management, dan mock server.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pMandiri.id, assigneeId: yuni.id, creatorId: reza.id, dueDate: new Date("2026-04-30"), position: 3 } }),
    prisma.task.create({ data: { title: "Onboarding 5 fintech partner pertama", description: "Technical onboarding GoPay, OVO, Dana, Shopee Pay, LinkAja ke gateway. KYB verification + NDA.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pMandiri.id, assigneeId: eko.id, creatorId: reza.id, dueDate: new Date("2026-05-31"), position: 4 } }),
    prisma.task.create({ data: { title: "Implementasi API Rate Limiting & Throttling", description: "Rate limit per partner tier: Silver 100 rpm, Gold 1000 rpm, Platinum unlimited + burst handling.", status: TaskStatus.REVIEW, priority: Priority.MEDIUM, projectId: pMandiri.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2026-02-28"), position: 5 } }),
    prisma.task.create({ data: { title: "Audit trail & logging infrastruktur (ELK Stack)", description: "Centralized logging semua API call ke Elasticsearch. Grafana dashboard monitoring + PagerDuty alert.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pMandiri.id, assigneeId: eko.id, creatorId: reza.id, dueDate: new Date("2026-06-30"), position: 6 } }),
    prisma.task.create({ data: { title: "Persiapan sertifikasi ISO 27001", description: "Gap assessment, penerapan kontrol keamanan, dokumentasi ISMS, internal audit, dan pemilihan lembaga sertifikasi.", status: TaskStatus.BACKLOG, priority: Priority.HIGH, projectId: pMandiri.id, assigneeId: yuni.id, creatorId: reza.id, dueDate: new Date("2026-07-31"), position: 7 } }),
  ]);

  // ─── TASKS — BCA Core Banking Migration ─────────────────────────────────────
  const tBCA = await Promise.all([
    prisma.task.create({ data: { title: "Data profiling & quality assessment legacy COBOL", description: "Analisis 20+ tahun data nasabah, identifikasi anomali, duplikat, dan data tidak valid sebelum migrasi.", status: TaskStatus.DONE, priority: Priority.CRITICAL, projectId: pBCA.id, assigneeId: eko.id, creatorId: reza.id, dueDate: new Date("2025-08-31"), completedAt: new Date("2025-08-28"), position: 1 } }),
    prisma.task.create({ data: { title: "Setup environment T24 Transact (UAT + Staging)", description: "Konfigurasi Temenos T24 di datacenter BCA: parameter lokal (timezone, currency IDR), modul tabungan & giro.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBCA.id, assigneeId: arif.id, creatorId: reza.id, dueDate: new Date("2025-10-31"), completedAt: new Date("2025-10-25"), position: 2 } }),
    prisma.task.create({ data: { title: "Pengembangan ETL pipeline — Oracle ke T24", description: "Transformasi dan migrasi data dengan Talend. Custom mapping 200+ tabel, error handling, dan reconciliation report.", status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, projectId: pBCA.id, assigneeId: eko.id, creatorId: reza.id, dueDate: new Date("2026-04-30"), position: 3 } }),
    prisma.task.create({ data: { title: "Integrasi switch ATM Bersama & Prima", description: "Konfigurasi ISO 8583 message format untuk integrasi jaringan ATM Bersama dan Prima pada T24.", status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, projectId: pBCA.id, assigneeId: sari.id, creatorId: reza.id, dueDate: new Date("2026-05-31"), position: 4 } }),
    prisma.task.create({ data: { title: "Parallel run 6 bulan — legacy vs T24", description: "Jalankan sistem lama dan baru secara paralel. Rekonsiliasi harian saldo & transaksi antara dua sistem.", status: TaskStatus.TODO, priority: Priority.CRITICAL, projectId: pBCA.id, assigneeId: reza.id, creatorId: reza.id, dueDate: new Date("2026-09-30"), position: 5 } }),
    prisma.task.create({ data: { title: "Training 500+ staff teller BCA", description: "Program training online + on-site untuk teller, supervisor, dan back-office BCA cabang regional.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pBCA.id, assigneeId: yuni.id, creatorId: reza.id, dueDate: new Date("2026-10-31"), position: 6 } }),
    prisma.task.create({ data: { title: "Cutover plan & disaster recovery test", description: "Rencana detail cutover weekend: waktu down maksimal 4 jam. Uji DR failover ke datacenter backup Surabaya.", status: TaskStatus.BACKLOG, priority: Priority.CRITICAL, projectId: pBCA.id, assigneeId: arif.id, creatorId: reza.id, dueDate: new Date("2026-11-30"), position: 7 } }),
  ]);

  // ─── TASKS — BSI Mobile Banking Super App ───────────────────────────────────
  const tBSI = await Promise.all([
    prisma.task.create({ data: { title: "Desain sistem UI/UX BSI Mobile — Islamic Design", description: "Design system berbasis nilai syariah: palet warna hijau-emas, tipografi, icons, micro-interaction yang user-friendly.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pBSI.id, assigneeId: dinda.id, creatorId: dinda.id, dueDate: new Date("2026-02-28"), position: 1 } }),
    prisma.task.create({ data: { title: "Setup React Native + Expo bare workflow", description: "Inisialisasi project, konfigurasi navigation (React Navigation v6), state management Zustand, API client Axios.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBSI.id, assigneeId: bagas.id, creatorId: dinda.id, dueDate: new Date("2026-01-31"), completedAt: new Date("2026-01-28"), position: 2 } }),
    prisma.task.create({ data: { title: "Integrasi QRIS — scan & generate QR", description: "Implementasi pembayaran QRIS sesuai standar Bank Indonesia. Scanning kamera dan generate QR dinamis.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pBSI.id, assigneeId: bagas.id, creatorId: dinda.id, dueDate: new Date("2026-04-30"), position: 3 } }),
    prisma.task.create({ data: { title: "Fitur Zakat, Infaq, Wakaf (ZIW) digital", description: "Perhitungan zakat otomatis dari saldo, distribusi ke BAZNAS terintegrasi, sertifikat digital wakaf.", status: TaskStatus.TODO, priority: Priority.MEDIUM, projectId: pBSI.id, assigneeId: sari.id, creatorId: dinda.id, dueDate: new Date("2026-05-31"), position: 4 } }),
    prisma.task.create({ data: { title: "Implementasi biometric authentication", description: "Face ID dan fingerprint untuk login dan konfirmasi transaksi menggunakan React Native Biometrics.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pBSI.id, assigneeId: bagas.id, creatorId: dinda.id, dueDate: new Date("2026-04-15"), position: 5 } }),
    prisma.task.create({ data: { title: "Reksa dana Syariah — integrasi Bareksa", description: "Fitur investasi reksa dana syariah terintegrasi dengan Bareksa: beli, jual, switch, dan monitoring portofolio.", status: TaskStatus.TODO, priority: Priority.MEDIUM, projectId: pBSI.id, assigneeId: sari.id, creatorId: dinda.id, dueDate: new Date("2026-06-30"), position: 6 } }),
    prisma.task.create({ data: { title: "Pengujian di perangkat Android & iOS (400+ varian)", description: "QA testing menggunakan Firebase Test Lab — coverage 400+ varian device Android, iPhone XR ke atas.", status: TaskStatus.BACKLOG, priority: Priority.HIGH, projectId: pBSI.id, assigneeId: dinda.id, creatorId: dinda.id, dueDate: new Date("2026-08-31"), position: 7 } }),
  ]);

  // ─── TASKS — BTN KPR Digital ────────────────────────────────────────────────
  const tBTN = await Promise.all([
    prisma.task.create({ data: { title: "Analisis proses bisnis KPR BTN end-to-end", description: "Workshop dengan tim bisnis BTN untuk mapping proses: pengajuan → verifikasi → akad → pencairan → monitoring.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBTN.id, assigneeId: arif.id, creatorId: arif.id, dueDate: new Date("2026-03-15"), completedAt: new Date("2026-03-14"), position: 1 } }),
    prisma.task.create({ data: { title: "Integrasi e-KYC — Dukcapil & liveness detection", description: "Verifikasi identitas calon debitur via API Dukcapil + liveness detection (bukan foto statis).", status: TaskStatus.IN_PROGRESS, priority: Priority.CRITICAL, projectId: pBTN.id, assigneeId: yuni.id, creatorId: arif.id, dueDate: new Date("2026-05-31"), position: 2 } }),
    prisma.task.create({ data: { title: "Pengembangan credit scoring engine (ML)", description: "Model ML berbasis data transaksi, SLIK OJK, dan bureaus eksternal. Threshold approval otomatis < 30 menit.", status: TaskStatus.IN_PROGRESS, priority: Priority.HIGH, projectId: pBTN.id, assigneeId: eko.id, creatorId: arif.id, dueDate: new Date("2026-07-31"), position: 3 } }),
    prisma.task.create({ data: { title: "Setup Kafka event streaming infrastructure", description: "Konfigurasi Apache Kafka untuk event-driven: LoanApplied, DocumentVerified, LoanApproved, DisbursementReady.", status: TaskStatus.TODO, priority: Priority.HIGH, projectId: pBTN.id, assigneeId: eko.id, creatorId: arif.id, dueDate: new Date("2026-06-30"), position: 4 } }),
    prisma.task.create({ data: { title: "Integrasi e-sign akad — Privy/PeruriSign", description: "Tanda tangan digital akad KPR menggunakan sertifikat Privy atau PeruriSign sesuai Permenkominfo.", status: TaskStatus.BACKLOG, priority: Priority.HIGH, projectId: pBTN.id, assigneeId: yuni.id, creatorId: arif.id, dueDate: new Date("2026-09-30"), position: 5 } }),
  ]);

  // ─── TASKS — BNI SLIK Integration (COMPLETED) ───────────────────────────────
  const tBNI = await Promise.all([
    prisma.task.create({ data: { title: "Setup koneksi VPN ke sistem SLIK OJK", description: "Konfigurasi IPSec tunnel dedicated ke datacenter OJK. Redundancy 2 jalur.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBNI.id, assigneeId: sari.id, creatorId: reza.id, dueDate: new Date("2025-04-30"), completedAt: new Date("2025-04-28"), position: 1 } }),
    prisma.task.create({ data: { title: "Pengembangan SLIK query service (real-time)", description: "REST API wrapper untuk query debitur real-time ke SLIK. Response time < 3 detik.", status: TaskStatus.DONE, priority: Priority.CRITICAL, projectId: pBNI.id, assigneeId: sari.id, creatorId: reza.id, dueDate: new Date("2025-06-30"), completedAt: new Date("2025-06-25"), position: 2 } }),
    prisma.task.create({ data: { title: "Dashboard analitik kredit berbasis ML", description: "Dashboard risk scoring, NPL prediction, dan segmentasi debitur menggunakan Python scikit-learn + Streamlit.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBNI.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2025-09-30"), completedAt: new Date("2025-09-20"), position: 3 } }),
    prisma.task.create({ data: { title: "Automated BI & OJK monthly reporting", description: "Otomatisasi laporan LBU (Laporan Bulanan Bank Umum) dan LKPBU ke OJK setiap tanggal 10.", status: TaskStatus.DONE, priority: Priority.HIGH, projectId: pBNI.id, assigneeId: bagas.id, creatorId: reza.id, dueDate: new Date("2025-11-30"), completedAt: new Date("2025-11-28"), position: 4 } }),
    prisma.task.create({ data: { title: "Go-live & hypercare support 90 hari", description: "Support intensif pasca go-live: on-site standby L1/L2, SLA response < 15 menit untuk P1 incident.", status: TaskStatus.DONE, priority: Priority.CRITICAL, projectId: pBNI.id, assigneeId: reza.id, creatorId: reza.id, dueDate: new Date("2025-12-31"), completedAt: new Date("2025-12-30"), position: 5 } }),
  ]);

  // ─── TASK LABELS ─────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI
    prisma.taskLabel.create({ data: { taskId: tBRI[0].id, labelId: lblCompliance.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[2].id, labelId: lblAPI.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[2].id, labelId: lblCore.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[3].id, labelId: lblFrontend.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[4].id, labelId: lblSecurity.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[5].id, labelId: lblSecurity.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[6].id, labelId: lblUAT.id } }),
    prisma.taskLabel.create({ data: { taskId: tBRI[7].id, labelId: lblCore.id } }),
    // Mandiri
    prisma.taskLabel.create({ data: { taskId: tMandiri[0].id, labelId: lblAPI.id } }),
    prisma.taskLabel.create({ data: { taskId: tMandiri[1].id, labelId: lblSecurity.id } }),
    prisma.taskLabel.create({ data: { taskId: tMandiri[6].id, labelId: lblCompliance.id } }),
    // BCA
    prisma.taskLabel.create({ data: { taskId: tBCA[2].id, labelId: lblCore.id } }),
    prisma.taskLabel.create({ data: { taskId: tBCA[3].id, labelId: lblInfra.id } }),
    // BSI
    prisma.taskLabel.create({ data: { taskId: tBSI[0].id, labelId: lblFrontend.id } }),
    prisma.taskLabel.create({ data: { taskId: tBSI[2].id, labelId: lblAPI.id } }),
    // BNI
    prisma.taskLabel.create({ data: { taskId: tBNI[1].id, labelId: lblCore.id } }),
    prisma.taskLabel.create({ data: { taskId: tBNI[3].id, labelId: lblCompliance.id } }),
  ]);

  // ─── MILESTONES ──────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI
    prisma.milestone.create({ data: { title: "Kick-off & Requirements Sign-off", status: MilestoneStatus.COMPLETED, projectId: pBRI.id, dueDate: new Date("2025-10-31"), completedAt: new Date("2025-10-31") } }),
    prisma.milestone.create({ data: { title: "Arsitektur & Environment Ready", status: MilestoneStatus.COMPLETED, projectId: pBRI.id, dueDate: new Date("2025-12-31"), completedAt: new Date("2025-12-28") } }),
    prisma.milestone.create({ data: { title: "Development Phase 1 Complete (Auth + Core API)", status: MilestoneStatus.IN_PROGRESS, projectId: pBRI.id, dueDate: new Date("2026-03-31") } }),
    prisma.milestone.create({ data: { title: "UAT Selesai — Sign-off BRI", status: MilestoneStatus.PENDING, projectId: pBRI.id, dueDate: new Date("2026-05-31") } }),
    prisma.milestone.create({ data: { title: "Go-Live Internet Banking BRI v2", status: MilestoneStatus.PENDING, projectId: pBRI.id, dueDate: new Date("2026-06-30") } }),

    // Mandiri
    prisma.milestone.create({ data: { title: "API Gateway Architecture Approved", status: MilestoneStatus.COMPLETED, projectId: pMandiri.id, dueDate: new Date("2025-12-15"), completedAt: new Date("2025-12-12") } }),
    prisma.milestone.create({ data: { title: "OAuth + Developer Portal MVP", status: MilestoneStatus.IN_PROGRESS, projectId: pMandiri.id, dueDate: new Date("2026-04-30") } }),
    prisma.milestone.create({ data: { title: "5 Fintech Partners Onboarded", status: MilestoneStatus.PENDING, projectId: pMandiri.id, dueDate: new Date("2026-06-30") } }),
    prisma.milestone.create({ data: { title: "ISO 27001 Certification", status: MilestoneStatus.PENDING, projectId: pMandiri.id, dueDate: new Date("2026-08-31") } }),

    // BCA
    prisma.milestone.create({ data: { title: "Data Profiling & ETL Design Complete", status: MilestoneStatus.COMPLETED, projectId: pBCA.id, dueDate: new Date("2025-09-30"), completedAt: new Date("2025-09-28") } }),
    prisma.milestone.create({ data: { title: "T24 Environment Setup & Config", status: MilestoneStatus.COMPLETED, projectId: pBCA.id, dueDate: new Date("2025-11-30"), completedAt: new Date("2025-11-25") } }),
    prisma.milestone.create({ data: { title: "ETL Migration Pass 1 Complete (Data Validation)", status: MilestoneStatus.IN_PROGRESS, projectId: pBCA.id, dueDate: new Date("2026-05-31") } }),
    prisma.milestone.create({ data: { title: "Parallel Run Selesai", status: MilestoneStatus.PENDING, projectId: pBCA.id, dueDate: new Date("2026-09-30") } }),
    prisma.milestone.create({ data: { title: "Cutover & Go-Live T24", status: MilestoneStatus.PENDING, projectId: pBCA.id, dueDate: new Date("2026-12-31") } }),

    // BSI
    prisma.milestone.create({ data: { title: "Design System Approved", status: MilestoneStatus.IN_PROGRESS, projectId: pBSI.id, dueDate: new Date("2026-03-31") } }),
    prisma.milestone.create({ data: { title: "Alpha Internal — Core Banking Features", status: MilestoneStatus.PENDING, projectId: pBSI.id, dueDate: new Date("2026-06-30") } }),
    prisma.milestone.create({ data: { title: "Beta Testing — 1000 Nasabah BSI", status: MilestoneStatus.PENDING, projectId: pBSI.id, dueDate: new Date("2026-08-15") } }),
    prisma.milestone.create({ data: { title: "App Store & Play Store Launch", status: MilestoneStatus.PENDING, projectId: pBSI.id, dueDate: new Date("2026-09-30") } }),

    // BNI (completed project)
    prisma.milestone.create({ data: { title: "SLIK Connectivity Established", status: MilestoneStatus.COMPLETED, projectId: pBNI.id, dueDate: new Date("2025-05-31"), completedAt: new Date("2025-05-28") } }),
    prisma.milestone.create({ data: { title: "Integration Testing Passed", status: MilestoneStatus.COMPLETED, projectId: pBNI.id, dueDate: new Date("2025-08-31"), completedAt: new Date("2025-08-25") } }),
    prisma.milestone.create({ data: { title: "Project Selesai & Acceptance", status: MilestoneStatus.COMPLETED, projectId: pBNI.id, dueDate: new Date("2025-12-31"), completedAt: new Date("2025-12-30") } }),
  ]);

  // ─── COMMENTS ─────────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.comment.create({ data: { content: "Mapping regulasi sudah selesai. Ada 47 gap yang perlu ditangani, paling kritis di autentikasi multi-faktor dan enkripsi data at-rest.", taskId: tBRI[0].id, authorId: reza.id } }),
    prisma.comment.create({ data: { content: "Sudah koordinasi dengan tim IT BRI — mereka minta agar HSM untuk enkripsi key bisa di-setup bulan depan.", taskId: tBRI[0].id, authorId: arif.id } }),
    prisma.comment.create({ data: { content: "SNAP BI endpoint transfer sudah 70%. Masalah di validasi format beneficiary account number Bank BJB yang belum konsisten.", taskId: tBRI[2].id, authorId: arif.id } }),
    prisma.comment.create({ data: { content: "Sudah coba mock response dari Bank BJB, ternyata ada 3 format account number berbeda tergantung jenis produk. Sudah tangani di validation layer.", taskId: tBRI[2].id, authorId: arif.id } }),
    prisma.comment.create({ data: { content: "Prototype UI sudah di-share ke stakeholder BRI. Mereka request tambah mode \"nasabah lansia\" dengan font lebih besar dan kontras lebih tinggi.", taskId: tBRI[3].id, authorId: dinda.id } }),
    prisma.comment.create({ data: { content: "Mode aksesibilitas sudah masuk backlog. Akan dikerjakan setelah main flow selesai. Sudah noted di Figma.", taskId: tBRI[3].id, authorId: dinda.id } }),
    prisma.comment.create({ data: { content: "OAuth 2.0 server sudah berjalan di staging. Test integrasi dengan GoPay berhasil. Menunggu OVO untuk complete flow.", taskId: tMandiri[1].id, authorId: bagas.id } }),
    prisma.comment.create({ data: { content: "ETL pass 1 untuk tabungan selesai. Akurasi 99.97% — ada 1,234 record dengan anomali tanggal lahir yang perlu manual review.", taskId: tBCA[2].id, authorId: eko.id } }),
    prisma.comment.create({ data: { content: "Record anomali sudah di-export ke Excel dan dikirim ke tim data BCA untuk verifikasi. Estimasi 2 minggu selesai.", taskId: tBCA[2].id, authorId: eko.id } }),
  ]);

  // ─── ACTIVITIES ──────────────────────────────────────────────────────────────
  await Promise.all([
    prisma.activity.create({ data: { action: "project_created", description: "Created project: BRI — Internet Banking Revamp", userId: reza.id, projectId: pBRI.id, createdAt: new Date("2025-10-01T08:00:00Z") } }),
    prisma.activity.create({ data: { action: "task_status_changed", description: "Moved 'Analisis GAP regulasi OJK' to Done", userId: reza.id, projectId: pBRI.id, taskId: tBRI[0].id, createdAt: new Date("2025-10-28T17:00:00Z") } }),
    prisma.activity.create({ data: { action: "milestone_completed", description: "Completed milestone: Kick-off & Requirements Sign-off", userId: reza.id, projectId: pBRI.id, createdAt: new Date("2025-10-31T16:00:00Z") } }),
    prisma.activity.create({ data: { action: "project_created", description: "Created project: Mandiri — Open Banking API Gateway", userId: reza.id, projectId: pMandiri.id, createdAt: new Date("2025-11-01T09:00:00Z") } }),
    prisma.activity.create({ data: { action: "task_status_changed", description: "Moved 'Desain Open Banking API Gateway' to Done", userId: bagas.id, projectId: pMandiri.id, taskId: tMandiri[0].id, createdAt: new Date("2025-11-28T15:00:00Z") } }),
    prisma.activity.create({ data: { action: "project_created", description: "Created project: BCA — Core Banking Migration T24", userId: reza.id, projectId: pBCA.id, createdAt: new Date("2025-07-01T08:00:00Z") } }),
    prisma.activity.create({ data: { action: "task_status_changed", description: "Moved 'Data profiling legacy COBOL' to Done", userId: eko.id, projectId: pBCA.id, taskId: tBCA[0].id, createdAt: new Date("2025-08-28T18:00:00Z") } }),
    prisma.activity.create({ data: { action: "project_created", description: "Created project: BSI — Mobile Banking Super App", userId: dinda.id, projectId: pBSI.id, createdAt: new Date("2026-01-01T08:00:00Z") } }),
    prisma.activity.create({ data: { action: "task_status_changed", description: "Moved 'Setup React Native' to Done", userId: bagas.id, projectId: pBSI.id, taskId: tBSI[1].id, createdAt: new Date("2026-01-28T16:30:00Z") } }),
    prisma.activity.create({ data: { action: "project_completed", description: "Project BNI — SLIK OJK Integration selesai dan diterima klien", userId: reza.id, projectId: pBNI.id, createdAt: new Date("2025-12-30T17:00:00Z") } }),
    prisma.activity.create({ data: { action: "comment_added", description: "Komentar pada task: Implementasi SNAP BI API Standar", userId: arif.id, projectId: pBRI.id, taskId: tBRI[2].id, createdAt: new Date("2026-02-05T10:30:00Z") } }),
    prisma.activity.create({ data: { action: "task_created", description: "Created task: Implementasi e-KYC Dukcapil", userId: arif.id, projectId: pBTN.id, taskId: tBTN[1].id, createdAt: new Date("2026-03-01T09:00:00Z") } }),
  ]);

  // ─── RISKS ───────────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI
    prisma.risk.create({ data: { title: "Keterlambatan deliverable dari tim IT BRI", description: "Tim internal BRI memiliki backlog tinggi. Risk delay pada sign-off dokumen requirement dan testing.", severity: RiskLevel.HIGH, probability: RiskLevel.HIGH, status: RiskStatus.OPEN, projectId: pBRI.id } }),
    prisma.risk.create({ data: { title: "Perubahan regulasi OJK di tengah proyek", description: "OJK sedang finalisasi POJK baru terkait transaksi digital. Jika terbit, ada kemungkinan perubahan requirement signifikan.", severity: RiskLevel.CRITICAL, probability: RiskLevel.MEDIUM, status: RiskStatus.OPEN, projectId: pBRI.id } }),
    prisma.risk.create({ data: { title: "Ketersediaan hardware HSM terlambat", description: "Lead time HSM (Hardware Security Module) dari vendor 16 minggu. Delay berdampak pada fitur enkripsi.", severity: RiskLevel.HIGH, probability: RiskLevel.MEDIUM, status: RiskStatus.MITIGATED, projectId: pBRI.id } }),

    // Mandiri
    prisma.risk.create({ data: { title: "Partner fintech tidak memenuhi standar keamanan", description: "Beberapa fintech kecil belum memiliki ISO 27001. Onboarding bisa tertunda karena proses security review.", severity: RiskLevel.HIGH, probability: RiskLevel.HIGH, status: RiskStatus.OPEN, projectId: pMandiri.id } }),
    prisma.risk.create({ data: { title: "Volume API call melebihi estimasi awal", description: "Estimasi 10 juta call/hari — aktual bisa 3x lipat jika GoPay onboard penuh. Perlu skalabilitas horizontal.", severity: RiskLevel.HIGH, probability: RiskLevel.MEDIUM, status: RiskStatus.MITIGATED, projectId: pMandiri.id } }),

    // BCA
    prisma.risk.create({ data: { title: "Kualitas data legacy sangat buruk", description: "Ditemukan 2% data korup dari hasil profiling awal. Cleaning manual diperlukan — berdampak ke timeline ETL.", severity: RiskLevel.CRITICAL, probability: RiskLevel.CRITICAL, status: RiskStatus.OPEN, projectId: pBCA.id } }),
    prisma.risk.create({ data: { title: "Kompatibilitas ISO 8583 ATM Bersama dengan T24", description: "Versi T24 yang digunakan memiliki known issue pada pesan reversal ATM Bersama. Butuh custom patch.", severity: RiskLevel.HIGH, probability: RiskLevel.HIGH, status: RiskStatus.OPEN, projectId: pBCA.id } }),

    // BSI
    prisma.risk.create({ data: { title: "Penolakan App Store karena konten keuangan syariah", description: "Apple App Store memiliki regulasi ketat untuk aplikasi fintech. Perlu legal review konten sebelum submit.", severity: RiskLevel.MEDIUM, probability: RiskLevel.MEDIUM, status: RiskStatus.OPEN, projectId: pBSI.id } }),

    // BTN
    prisma.risk.create({ data: { title: "API Dukcapil tidak stabil di jam sibuk", description: "Layanan e-KYC Dukcapil sering timeout jam 09:00–12:00. Perlu implementasi retry logic dan fallback manual.", severity: RiskLevel.HIGH, probability: RiskLevel.CRITICAL, status: RiskStatus.OPEN, projectId: pBTN.id } }),
  ]);

  // ─── ISSUES ──────────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI
    prisma.issue.create({ data: { title: "Timeout pada SNAP BI endpoint transfer antar bank", description: "Endpoint transfer ke Bank Danamon timeout setelah 29 detik. Batas timeout SNAP BI adalah 30 detik. Butuh optimasi query.", severity: RiskLevel.CRITICAL, status: IssueStatus.IN_PROGRESS, projectId: pBRI.id } }),
    prisma.issue.create({ data: { title: "Enkripsi AES-256 memperlambat response API 40%", description: "Implementasi enkripsi payload di application layer menambah latency signifikan. Perlu evaluasi apakah bisa dipindah ke TLS layer.", severity: RiskLevel.HIGH, status: IssueStatus.OPEN, projectId: pBRI.id } }),
    prisma.issue.create({ data: { title: "Session conflict pada login concurrent di browser berbeda", description: "Nasabah yang login di Chrome dan Firefox secara bersamaan mengalami session invalidation acak.", severity: RiskLevel.HIGH, status: IssueStatus.IN_PROGRESS, projectId: pBRI.id } }),

    // Mandiri
    prisma.issue.create({ data: { title: "Developer Portal down 2 jam saat demo ke Mandiri", description: "Server staging developer portal down saat demo resmi ke tim Mandiri. Penyebab: memory leak di preview renderer.", severity: RiskLevel.CRITICAL, status: IssueStatus.RESOLVED, projectId: pMandiri.id } }),
    prisma.issue.create({ data: { title: "Token refresh race condition pada multi-tab", description: "Ketika aplikasi fintech partner membuka banyak tab, token refresh request bentrok dan mengakibatkan logout paksa.", severity: RiskLevel.HIGH, status: IssueStatus.IN_PROGRESS, projectId: pMandiri.id } }),

    // BCA
    prisma.issue.create({ data: { title: "ETL gagal untuk rekening tabungan dengan karakter non-ASCII", description: "Nama nasabah dengan karakter aksara Jawa atau China (WNA) menyebabkan ETL pipeline crash di validasi step.", severity: RiskLevel.HIGH, status: IssueStatus.IN_PROGRESS, projectId: pBCA.id } }),
    prisma.issue.create({ data: { title: "T24 tidak mengenali format NPWP lama (pre-2024)", description: "NIK-based NPWP format baru berhasil, tapi NPWP lama 15 digit masih dipakai 30% nasabah. T24 reject formatnya.", severity: RiskLevel.HIGH, status: IssueStatus.OPEN, projectId: pBCA.id } }),

    // BSI
    prisma.issue.create({ data: { title: "QRIS QR code tidak terbaca di kondisi pencahayaan rendah", description: "QR code yang di-generate memiliki error correction level terlalu rendah. Gagal scan di kasir ATM mal yang redup.", severity: RiskLevel.MEDIUM, status: IssueStatus.OPEN, projectId: pBSI.id } }),
  ]);

  // ─── BUDGETS ─────────────────────────────────────────────────────────────────
  const budgetBRI = await prisma.budget.create({ data: { projectId: pBRI.id, totalAmount: 4_500_000_000, currency: "IDR", notes: "Kontrak senilai Rp 4.5M. Payment termin: 30% DP, 40% milestone 2, 30% go-live." } });
  const budgetMandiri = await prisma.budget.create({ data: { projectId: pMandiri.id, totalAmount: 3_200_000_000, currency: "IDR", notes: "Kontrak fixed-price Rp 3.2M. Termasuk 1 tahun maintenance post go-live." } });
  const budgetBCA = await prisma.budget.create({ data: { projectId: pBCA.id, totalAmount: 8_750_000_000, currency: "IDR", notes: "Proyek terbesar. Multi-year contract Rp 8.75M. Quarterly milestone payment." } });
  const budgetBSI = await prisma.budget.create({ data: { projectId: pBSI.id, totalAmount: 2_800_000_000, currency: "IDR", notes: "Kontrak Rp 2.8M. BSI minta opsi Time & Material untuk fitur tambahan." } });
  const budgetBNI = await prisma.budget.create({ data: { projectId: pBNI.id, totalAmount: 1_900_000_000, currency: "IDR", notes: "Proyek selesai. Total realisasi Rp 1.87M dari budget Rp 1.9M." } });

  // ─── EXPENSES ────────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI Expenses
    prisma.expense.create({ data: { budgetId: budgetBRI.id, title: "Biaya tim development (6 bulan)", amount: 1_800_000_000, category: ExpenseCategory.LABOR, date: new Date("2025-10-01"), description: "7 developer, 1 PM, 1 QA engineer — kontrak 6 bulan" } }),
    prisma.expense.create({ data: { budgetId: budgetBRI.id, title: "Lisensi software & tools (SonarQube, Jira, Confluence)", amount: 45_000_000, category: ExpenseCategory.SOFTWARE, date: new Date("2025-10-15"), description: "Annual license untuk 10 user" } }),
    prisma.expense.create({ data: { budgetId: budgetBRI.id, title: "Hardware HSM (2 unit Thales Luna HSM)", amount: 380_000_000, category: ExpenseCategory.HARDWARE, date: new Date("2025-11-01"), description: "Hardware Security Module untuk key management produksi" } }),
    prisma.expense.create({ data: { budgetId: budgetBRI.id, title: "Perjalanan dinas ke Kantor Pusat BRI Jakarta (3x)", amount: 42_000_000, category: ExpenseCategory.TRAVEL, date: new Date("2025-11-15"), description: "Flight, hotel, dan akomodasi tim 4 orang" } }),
    prisma.expense.create({ data: { budgetId: budgetBRI.id, title: "Penetration testing vendor eksternal (BST Consulting)", amount: 180_000_000, category: ExpenseCategory.OPERATIONS, date: new Date("2026-01-15"), description: "VAPT dari vendor tersertifikasi CREST" } }),

    // Mandiri Expenses
    prisma.expense.create({ data: { budgetId: budgetMandiri.id, title: "Biaya tim (4 engineer + 1 PM)", amount: 1_050_000_000, category: ExpenseCategory.LABOR, date: new Date("2025-11-01"), description: "Kong certified developer, OAuth specialist" } }),
    prisma.expense.create({ data: { budgetId: budgetMandiri.id, title: "Lisensi Kong Enterprise Gateway (1 tahun)", amount: 420_000_000, category: ExpenseCategory.SOFTWARE, date: new Date("2025-11-15"), description: "Kong Enterprise dengan support premium" } }),
    prisma.expense.create({ data: { budgetId: budgetMandiri.id, title: "Cloud infrastructure AWS (staging & prod)", amount: 95_000_000, category: ExpenseCategory.OPERATIONS, date: new Date("2025-12-01"), description: "EKS cluster, RDS, ElasticCache 3 bulan" } }),

    // BCA Expenses
    prisma.expense.create({ data: { budgetId: budgetBCA.id, title: "Lisensi Temenos T24 Transact", amount: 2_500_000_000, category: ExpenseCategory.SOFTWARE, date: new Date("2025-07-01"), description: "Core banking software license + 3 tahun support" } }),
    prisma.expense.create({ data: { budgetId: budgetBCA.id, title: "Biaya tim proyek (8 engineer + 2 PM + 1 BA)", amount: 2_800_000_000, category: ExpenseCategory.LABOR, date: new Date("2025-07-01"), description: "Tim 18 bulan termasuk T24 certified consultant" } }),
    prisma.expense.create({ data: { budgetId: budgetBCA.id, title: "Talend Data Integration license", amount: 185_000_000, category: ExpenseCategory.SOFTWARE, date: new Date("2025-08-01"), description: "Talend enterprise untuk ETL pipeline" } }),
    prisma.expense.create({ data: { budgetId: budgetBCA.id, title: "Training 500 staff teller BCA", amount: 250_000_000, category: ExpenseCategory.OPERATIONS, date: new Date("2026-10-01"), description: "LMS platform + trainer fee + modul pelatihan" } }),

    // BNI Expenses (completed)
    prisma.expense.create({ data: { budgetId: budgetBNI.id, title: "Biaya tim (3 engineer + 1 PM)", amount: 850_000_000, category: ExpenseCategory.LABOR, date: new Date("2025-03-01"), description: "Tim 10 bulan untuk integrasi SLIK" } }),
    prisma.expense.create({ data: { budgetId: budgetBNI.id, title: "Infrastruktur VPN dedicated ke OJK", amount: 120_000_000, category: ExpenseCategory.HARDWARE, date: new Date("2025-04-01"), description: "Dedicated line + router Cisco ASA" } }),
    prisma.expense.create({ data: { budgetId: budgetBNI.id, title: "Python ML stack (GPU server sewa)", amount: 95_000_000, category: ExpenseCategory.OPERATIONS, date: new Date("2025-06-01"), description: "Sewa GPU server untuk training model kredit scoring" } }),
  ]);

  // ─── INVOICES ─────────────────────────────────────────────────────────────────
  await Promise.all([
    // BRI
    prisma.invoice.create({ data: { budgetId: budgetBRI.id, invoiceNo: "INV-2025-001", title: "BRI Internet Banking — DP 30%", amount: 1_350_000_000, status: InvoiceStatus.PAID, issuedAt: new Date("2025-10-05"), dueAt: new Date("2025-10-20"), paidAt: new Date("2025-10-18"), notes: "Down payment sesuai kontrak. Ditransfer ke rek BCA Nexaintegra." } }),
    prisma.invoice.create({ data: { budgetId: budgetBRI.id, invoiceNo: "INV-2026-003", title: "BRI Internet Banking — Milestone 2 (40%)", amount: 1_800_000_000, status: InvoiceStatus.SENT, issuedAt: new Date("2026-02-01"), dueAt: new Date("2026-02-28"), notes: "Tagihan setelah milestone arsitektur & env ready sign-off." } }),

    // Mandiri
    prisma.invoice.create({ data: { budgetId: budgetMandiri.id, invoiceNo: "INV-2025-002", title: "Mandiri API Gateway — DP 30%", amount: 960_000_000, status: InvoiceStatus.PAID, issuedAt: new Date("2025-11-05"), dueAt: new Date("2025-11-25"), paidAt: new Date("2025-11-22"), notes: "Down payment proyek Open Banking." } }),
    prisma.invoice.create({ data: { budgetId: budgetMandiri.id, invoiceNo: "INV-2026-005", title: "Mandiri API Gateway — Termin 2 (35%)", amount: 1_120_000_000, status: InvoiceStatus.DRAFT, issuedAt: new Date("2026-04-01"), dueAt: new Date("2026-04-30"), notes: "Tagihan setelah OAuth + Developer Portal MVP selesai." } }),

    // BCA
    prisma.invoice.create({ data: { budgetId: budgetBCA.id, invoiceNo: "INV-2025-004", title: "BCA Core Banking — Q3 2025 Payment", amount: 2_187_500_000, status: InvoiceStatus.PAID, issuedAt: new Date("2025-07-05"), dueAt: new Date("2025-07-31"), paidAt: new Date("2025-07-28"), notes: "Payment Q3 — 25% dari total kontrak." } }),
    prisma.invoice.create({ data: { budgetId: budgetBCA.id, invoiceNo: "INV-2025-007", title: "BCA Core Banking — Q4 2025 Payment", amount: 2_187_500_000, status: InvoiceStatus.PAID, issuedAt: new Date("2025-10-05"), dueAt: new Date("2025-10-31"), paidAt: new Date("2025-10-29"), notes: "Payment Q4 — 25% dari total kontrak." } }),
    prisma.invoice.create({ data: { budgetId: budgetBCA.id, invoiceNo: "INV-2026-008", title: "BCA Core Banking — Q1 2026 Payment", amount: 2_187_500_000, status: InvoiceStatus.OVERDUE, issuedAt: new Date("2026-01-05"), dueAt: new Date("2026-01-31"), notes: "Payment Q1 2026 — sudah melewati jatuh tempo. Perlu follow up." } }),

    // BNI (completed)
    prisma.invoice.create({ data: { budgetId: budgetBNI.id, invoiceNo: "INV-2025-006", title: "BNI SLIK Integration — Final Payment", amount: 760_000_000, status: InvoiceStatus.PAID, issuedAt: new Date("2025-12-05"), dueAt: new Date("2025-12-31"), paidAt: new Date("2025-12-28"), notes: "Pembayaran terakhir setelah acceptance test sign-off." } }),
  ]);

  // ─── RESOURCE ALLOCATIONS ────────────────────────────────────────────────────
  await Promise.all([
    // BRI team
    prisma.resourceAllocation.create({ data: { userId: reza.id, projectId: pBRI.id, role: "Project Manager", hoursPerWeek: 20, startDate: new Date("2025-10-01"), endDate: new Date("2026-06-30") } }),
    prisma.resourceAllocation.create({ data: { userId: arif.id, projectId: pBRI.id, role: "Backend Lead (Spring Boot / Microservices)", hoursPerWeek: 40, startDate: new Date("2025-10-01"), endDate: new Date("2026-06-30") } }),
    prisma.resourceAllocation.create({ data: { userId: dinda.id, projectId: pBRI.id, role: "UI/UX Designer", hoursPerWeek: 32, startDate: new Date("2025-10-01"), endDate: new Date("2026-04-30") } }),
    prisma.resourceAllocation.create({ data: { userId: bagas.id, projectId: pBRI.id, role: "DevOps / Kubernetes Engineer", hoursPerWeek: 24, startDate: new Date("2025-11-01"), endDate: new Date("2026-06-30") } }),
    prisma.resourceAllocation.create({ data: { userId: sari.id, projectId: pBRI.id, role: "QA Engineer / Security Tester", hoursPerWeek: 32, startDate: new Date("2026-01-01"), endDate: new Date("2026-06-30") } }),
    // Mandiri team
    prisma.resourceAllocation.create({ data: { userId: reza.id, projectId: pMandiri.id, role: "Project Manager", hoursPerWeek: 16, startDate: new Date("2025-11-01"), endDate: new Date("2026-08-31") } }),
    prisma.resourceAllocation.create({ data: { userId: bagas.id, projectId: pMandiri.id, role: "API Gateway Engineer (Kong)", hoursPerWeek: 16, startDate: new Date("2025-11-01"), endDate: new Date("2026-08-31") } }),
    prisma.resourceAllocation.create({ data: { userId: yuni.id, projectId: pMandiri.id, role: "Frontend Developer (Developer Portal)", hoursPerWeek: 32, startDate: new Date("2025-12-01"), endDate: new Date("2026-07-31") } }),
    prisma.resourceAllocation.create({ data: { userId: eko.id, projectId: pMandiri.id, role: "Backend Engineer (OAuth / NodeJS)", hoursPerWeek: 32, startDate: new Date("2025-12-01"), endDate: new Date("2026-07-31") } }),
    // BCA team
    prisma.resourceAllocation.create({ data: { userId: reza.id, projectId: pBCA.id, role: "Delivery Manager", hoursPerWeek: 12, startDate: new Date("2025-07-01"), endDate: new Date("2026-12-31") } }),
    prisma.resourceAllocation.create({ data: { userId: arif.id, projectId: pBCA.id, role: "T24 Consultant / Integration Lead", hoursPerWeek: 8, startDate: new Date("2025-07-01"), endDate: new Date("2026-12-31") } }),
    prisma.resourceAllocation.create({ data: { userId: eko.id, projectId: pBCA.id, role: "ETL Engineer (Talend)", hoursPerWeek: 8, startDate: new Date("2025-07-01"), endDate: new Date("2026-06-30") } }),
    // BSI team
    prisma.resourceAllocation.create({ data: { userId: dinda.id, projectId: pBSI.id, role: "Lead UI/UX + Project Lead", hoursPerWeek: 40, startDate: new Date("2026-01-01"), endDate: new Date("2026-09-30") } }),
    prisma.resourceAllocation.create({ data: { userId: bagas.id, projectId: pBSI.id, role: "React Native Developer", hoursPerWeek: 8, startDate: new Date("2026-01-01"), endDate: new Date("2026-09-30") } }),
  ]);

  console.log("\n✅ Database seeded — IT System Integrator (Banking Clients)!");
  console.log("\n📧 Akun login:");
  console.log("  reza@nexaintegra.id   / password123  (Admin — PM utama)");
  console.log("  dinda@nexaintegra.id  / password123  (Member — UI/UX + Mobile)");
  console.log("  arif@nexaintegra.id   / password123  (Member — Backend Lead)");
  console.log("  sari@nexaintegra.id   / password123  (Member — QA & Security)");
  console.log("  bagas@nexaintegra.id  / password123  (Member — DevOps & API)");
  console.log("  yuni@nexaintegra.id   / password123  (Member — Frontend)");
  console.log("  eko@nexaintegra.id    / password123  (Member — Data & Infra)");
  console.log("\n🏦 Klien:");
  console.log("  BRI  — Internet Banking Revamp (ACTIVE, Rp 4.5M)");
  console.log("  Mandiri — Open Banking API Gateway (ACTIVE, Rp 3.2M)");
  console.log("  BCA  — Core Banking Migration T24 (ACTIVE, Rp 8.75M)");
  console.log("  BSI  — Mobile Banking Super App (ACTIVE, Rp 2.8M)");
  console.log("  BTN  — KPR Digital Platform (PLANNING, Rp TBD)");
  console.log("  BNI  — SLIK OJK Integration (COMPLETED ✓, Rp 1.9M)");
}

main()
  .catch((e) => { console.error("❌ Seed gagal:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
