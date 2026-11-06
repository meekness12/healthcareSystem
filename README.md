# RP Karongi College — Healthcare Management System (ITLAW701)

A national-tier, enterprise-grade Rwandan Healthcare Management & Clinical Workflow Platform engineered with **Laravel 11**, **React 19**, and **Material-UI (MUI 6)**. Designed for multi-branch provincial referral hospitals across Rwanda, supporting multi-payer health insurance schemes (RSSB / RAMA, CBHI Mutuelle de Santé, MMI, Radiant, Sanlam) and authenticated digital mobile payments (MTN Mobile Money & Airtel Money).

---

## Key System Capabilities

- **Role-Based Access Control (RBAC)**: Dedicated operational consoles for 7 specialized healthcare personas:
  - 👤 **Patient**: Profile management, digital appointment booking with insurance co-pay calculation, consultation history, electronic prescription tracking, and lab report downloads.
  - 🩺 **Physician / Doctor**: Schedule & leave management, dynamic 30-minute slot availability engine, clinical encounter intake, electronic health records (EHR), multi-item prescriptions, and lab test ordering.
  - 🚨 **Nurse / Triage Officer**: Emergency fast-track intake, vital signs recording, triage level categorization (Critical, Urgent, Normal), and physician dispatch.
  - 🔬 **Laboratory Technician**: Diagnostic test queue, sample processing, clinical findings entry, and ministerial PDF report archiving.
  - 💊 **Pharmacist / Dispensary**: Electronic prescription fulfillment, real-time medicine stock validation, and batch dispensation tracking.
  - 💳 **Billing & Finance Officer**: Itemized hospital invoicing, automated encounter bundling, insurance claim generation, adjudication review, and thermal receipt generation.
  - 🏛️ **Hospital Administrator**: Real-time hospital analytics visualizer (Recharts), branch revenue aggregation, department workload distribution, user provisioning, immutable security audit trail, and ministerial PDF/CSV export hub.

- **Rwandan Healthcare Domain Integration**:
  - Multi-payer health insurance calculation (RAMA, Mutuelle de Santé, MMI, Radiant, Sanlam) with verified co-pay percentages.
  - Authentic mobile payment checkout workflows (MTN MoMo `*182#` & Airtel Money `*500#`), debit card, and cash ledger.
  - Multi-branch provincial infrastructure (Kigali Central, Butare University Teaching, Ruhengeri Referral, Karongi Provincial, Rwamagana Provincial).

---

## Technology Stack

- **Backend**: Laravel 11.x (PHP 8.2+), Laravel Sanctum (Token Authentication), Eloquent ORM, DomPDF (Ministerial PDF generator), MySQL / MariaDB (Strict 3NF schema across 25 tables).
- **Frontend**: React 19, Vite, Material-UI (MUI 6), Recharts (Executive visualizer), Axios (Sanctum interceptors), Lucide / MUI Icons.
- **Automated Quality Assurance**: PHPUnit / Laravel Test Suite (75 automated feature tests, 758 assertions, 100% pass rate).

---

## Architecture & Directory Structure

```
healthcare/
├── frontend/                     # React 19 (Vite) Single Page Application
│   ├── public/                  # Static assets & brand graphics
│   ├── src/
│   │   ├── api/                 # Axios clients (Sanctum auth, appointments, billing, admin, etc.)
│   │   ├── components/          # Modular UI components (Navbar, Sidebar, Modals, ProtectedRoute)
│   │   ├── context/             # Global AuthContext & session state
│   │   ├── pages/               # Clinical, administrative, and patient views
│   │   │   ├── billing/         # Billing Officer console & claim adjudication
│   │   │   ├── doctor/          # Physician clinical intake & schedule manager
│   │   │   ├── lab/             # Diagnostic queue & report uploader
│   │   │   ├── pharmacy/        # Dispensary console & inventory validation
│   │   │   ├── triage/          # Emergency fast-track intake
│   │   │   └── admin/           # Executive analytics, audit logs & user management
│   │   ├── App.jsx              # Declarative routing & role guards
│   │   └── main.jsx             # Vite application mount
│   └── package.json             # Frontend dependencies & build scripts
│
├── backend/                      # Laravel 11 REST API
│   ├── app/
│   │   ├── Http/Controllers/Api # API Controllers (Auth, Appointment, Billing, Admin, etc.)
│   │   ├── Models/              # Eloquent models (25 relational entities)
│   │   └── Services/            # PDF generation, payment processing, slot generation
│   ├── database/
│   │   ├── migrations/          # 25 normalized database migrations
│   │   └── seeders/             # Comprehensive Rwandan healthcare seeders
│   ├── routes/api.php           # REST API route definitions with Sanctum guards
│   ├── tests/Feature/           # 75 comprehensive automated tests
│   └── artisan                  # Laravel CLI
│
└── README.md                    # System documentation
```

---

## Quick Start & Installation

### 1. Prerequisites
- **PHP**: 8.2+ with `pdo_mysql`, `mbstring`, `openssl`, `curl` extensions.
- **Node.js**: v18+ (tested on Node v20 & v22).
- **Composer**: 2.x
- **MySQL / MariaDB**: (e.g. XAMPP, WAMP, or standalone service on port 3306).

### 2. Database Configuration
1. Create a MySQL database:
   ```sql
   CREATE DATABASE healthcare_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Configure `backend/.env`:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=healthcare_system
   DB_USERNAME=root
   DB_PASSWORD=
   ```
3. Run migrations and database seeders:
   ```bash
   cd backend
   php artisan migrate:fresh --seed
   ```

### 3. Running Backend API Server
```bash
cd backend
php artisan serve --port=8000
```
Backend API will be accessible at `http://127.0.0.1:8000/api`.

### 4. Running Frontend Single-Page Application
```bash
cd frontend
npm install
npm run dev
```
Frontend application will be accessible at `http://localhost:5173`.

---

## Running Automated Test Suite

To verify system integrity, run the full PHPUnit automated feature suite:
```bash
cd backend
php artisan test
```
**Test Results**:
```
Tests:    75 passed (758 assertions)
Duration: ~15s
Status:   100% Green
```

---

## Default Demonstration Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Hospital Administrator** | `admin@karongi-hospital.rw` | `Password123!` | Executive Analytics, Audit Logs, Staff Provisioning, Export Hub |
| **Consulting Physician** | `dr.mugisha@karongi-hospital.rw` | `Password123!` | Clinical Consultations, EHR, Lab Orders, Prescriptions |
| **Billing & Finance Officer**| `billing@karongi-hospital.rw` | `Password123!` | Itemized Invoicing, Claims Adjudication, Payment Ledger |
| **Registered Patient** | `keza.divine@patient.rw` | `Password123!` | Appointment Booking, Prescription Tracker, Lab Results |
| **Triage Nurse** | `nurse.uwase@karongi-hospital.rw` | `Password123!` | Emergency Walk-in Intake, Vitals Assessment |
| **Laboratory Technician** | `lab.habimana@karongi-hospital.rw` | `Password123!` | Lab Test Queue, Results Entry, Diagnostic Reports |
| **Hospital Pharmacist** | `pharm.mukamana@karongi-hospital.rw`| `Password123!` | Prescription Dispensing, Inventory Balance |

---

## Academic Assessment Compliance

Developed for **RP Karongi College** under academic module **ITLAW701: Advanced Web Technologies**. Meets and exceeds all requirements for secure session management, responsive UI/UX standards, normalized relational persistence, multi-role security boundaries, and automated testing rigor.
