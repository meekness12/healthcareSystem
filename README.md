# Healthcare Management System

A unified monorepo for the Healthcare Management System, containing both the React frontend and PHP backend.

## Architecture & Directory Structure

```
healthcare/
├── frontend/                 # React (Vite) Single Page Application
│   ├── public/              # Static assets & icons
│   ├── src/                 # React components, pages & API client
│   │   ├── api/             # API services (auth, patient, appointments)
│   │   ├── components/      # UI components (Header, Sidebar, ProtectedRoute)
│   │   ├── pages/           # Pages (Login, Register, Patient/Doctor/Admin Dashboards)
│   │   ├── App.jsx          # Router & route definitions
│   │   └── main.jsx         # Vite React entrypoint
│   ├── index.html           # HTML template
│   ├── vite.config.js       # Vite configuration with API proxy
│   └── package.json         # Frontend dependencies & scripts
│
├── backend/                  # PHP REST API & Database
│   ├── api/                 # API endpoints (auth, doctor, patient, admin, notifications)
│   ├── config/              # Database connection & CORS headers
│   ├── controllers/         # Business logic controllers
│   ├── models/              # Data models (Appointment, Doctor, Patient, User)
│   ├── migrations/          # Incremental database migrations
│   └── database.sql         # Initial database schema and seed data
│
├── .gitignore               # Root git ignore (node_modules, env files, build artifacts)
├── package.json             # Root monorepo scripts for concurrent development
└── README.md                # Project documentation
```

---

## Quick Start

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v22)
- **PHP**: v8.0+ with MySQLi extension enabled
- **MySQL / MariaDB**: (e.g. via XAMPP, WAMP, Docker, or standalone service)

### 2. Database Setup
1. Create a database named `healthcare_system` in MySQL:
   ```sql
   CREATE DATABASE healthcare_system;
   ```
2. Import `backend/database.sql`:
   ```bash
   mysql -u root -p healthcare_system < backend/database.sql
   ```
3. Run any pending migrations located in `backend/migrations/` if needed.
4. Verify database credentials in `backend/config/db_connect.php` (default: host `localhost`, user `root`, no password).

### 3. Install Dependencies
Install root tools (optional for unified runner) and frontend dependencies:
```bash
# Install frontend packages
npm run install:frontend
```

### 4. Running the Development Servers

#### Option A: Run Both Concurrently (Recommended)
From the repository root:
```bash
npm install
npm run dev
```
This simultaneously spins up:
- **Backend API**: `http://localhost:8000`
- **Frontend SPA**: `http://localhost:5173`

#### Option B: Run Individually
**Terminal 1 (Backend):**
```bash
php -S localhost:8000 -t backend
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

### 5. Access the Application
Open your browser to:
- Frontend: [http://localhost:5173](http://localhost:5173)
- Direct Backend Healthcheck: [http://localhost:8000/api/auth/me.php](http://localhost:8000/api/auth/me.php)
