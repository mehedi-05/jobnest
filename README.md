# JobNest — Student Job & Internship Portal

> **CSE 224 — Database Management System Laboratory Project**

A full-stack web application that connects university students with job and internship opportunities. Built with **Node.js / Express**, **MySQL**, and **EJS + Bootstrap 5**.

---

## Features

| Module | Operations |
|---|---|
| **Students** | Add, view profile, edit, delete (cascades to applications) |
| **Companies** | Add, view with job list, edit, delete (cascades to jobs + applications) |
| **Jobs** | Post, view with applicants, edit (open/close), delete |
| **Applications** | Submit, view all, update status, withdraw |

**Database highlights:**  
- 4 normalized tables (3NF) with PK / FK / UNIQUE constraints  
- 3 Triggers (salary guard × 2, closed-job guard)  
- 2 Views (`vw_active_jobs`, `vw_application_details`)  
- 3 Stored Procedures (`sp_get_student_applications`, `sp_get_job_applicants`, `sp_close_expired_jobs`)  
- Server-side validation on every INSERT / UPDATE  

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, EJS templates, Bootstrap 5, Bootstrap Icons |
| Backend | Node.js 18+, Express 4 |
| Database | MySQL 8 / MariaDB 10.6+ (via XAMPP) |
| DB Driver | `mysql2` (promise API) |
| Utilities | `method-override` (PUT/DELETE in forms), `dotenv` |

---

## Prerequisites

- [XAMPP](https://www.apachefriends.org/) (or any MySQL 8 / MariaDB server)  
- [Node.js 18+](https://nodejs.org/)  
- [Git](https://git-scm.com/)

---

## Quick Start

### 1 — Clone the repository

```bash
git clone https://github.com/<YOUR_USERNAME>/jobnest.git
cd jobnest
```

### 2 — Install Node.js dependencies

```bash
npm install
```

### 3 — Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and set your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=          # blank for default XAMPP
DB_NAME=jobnest_db
PORT=3000
```

### 4 — Import the database

Start **Apache** and **MySQL** in XAMPP, then run **one** of:

**Option A — phpMyAdmin (GUI):**
1. Go to `http://localhost/phpmyadmin`
2. Click **Import** → choose `database/schema.sql` → **Go**

**Option B — MySQL CLI:**
```bash
mysql -u root -p < database/schema.sql
```

This creates the `jobnest_db` database, all 4 tables, views, triggers, stored procedures, and loads sample data.

### 5 — Start the server

```bash
npm start
```

Open your browser at **http://localhost:3000**

---

## Project Structure

```
jobnest/
├── app.js                    # Express entry point
├── .env.example              # Environment variable template
├── .gitignore
├── package.json
│
├── config/
│   └── db.js                 # MySQL connection pool (mysql2)
│
├── controllers/
│   ├── studentController.js  # CRUD for Students
│   ├── companyController.js  # CRUD for Companies
│   ├── jobController.js      # CRUD for Jobs
│   └── applicationController.js # CRUD for Applications
│
├── routes/
│   ├── studentRoutes.js
│   ├── companyRoutes.js
│   ├── jobRoutes.js
│   └── applicationRoutes.js
│
├── middleware/
│   ├── validators.js         # Hand-written server-side validation
│   └── errorHandler.js       # Centralized 404 + 500 error handling
│
├── views/
│   ├── layout.ejs            # Master layout (navbar + footer)
│   ├── index.ejs             # Dashboard with stats + latest jobs
│   ├── error.ejs             # Error page
│   ├── partials/
│   │   ├── navbar.ejs
│   │   ├── footer.ejs
│   │   └── errors.ejs        # Reusable validation error list
│   ├── students/             # list, show, form
│   ├── companies/            # list, show, form
│   ├── jobs/                 # list, show, form
│   └── applications/         # list, form
│
├── public/
│   └── css/style.css         # Custom styles (complements Bootstrap 5)
│
└── database/
    └── schema.sql            # Full DB setup: tables, views, triggers, SPs, sample data
```

---

## URL Routes

| Method | URL | Action |
|---|---|---|
| GET | `/` | Dashboard |
| GET | `/students` | List all students |
| GET | `/students/new` | Add student form |
| POST | `/students` | Create student |
| GET | `/students/:id` | Student profile + applications |
| GET | `/students/:id/edit` | Edit student form |
| PUT | `/students/:id` | Update student |
| DELETE | `/students/:id` | Delete student |
| GET | `/companies` | List all companies |
| GET | `/companies/new` | Add company form |
| POST | `/companies` | Create company |
| GET | `/companies/:id` | Company profile + jobs |
| GET | `/companies/:id/edit` | Edit company form |
| PUT | `/companies/:id` | Update company |
| DELETE | `/companies/:id` | Delete company |
| GET | `/jobs` | All job listings |
| GET | `/jobs/new` | Post job form |
| POST | `/jobs` | Create job |
| GET | `/jobs/:id` | Job detail + applicants |
| GET | `/jobs/:id/edit` | Edit job form |
| PUT | `/jobs/:id` | Update job |
| DELETE | `/jobs/:id` | Delete job |
| GET | `/applications` | All applications |
| GET | `/applications/new` | Submit application form |
| POST | `/applications` | Create application |
| GET | `/applications/:id/edit` | Edit application status |
| PUT | `/applications/:id` | Update status |
| DELETE | `/applications/:id` | Delete application |

---

## Validation Rules

| Field | Rule |
|---|---|
| Name / Company Name / Job Title | Required, non-empty |
| Email (all entities) | Required, valid format (`user@domain.com`), unique |
| Semester | Integer 1–12 |
| Salary | Optional; if given, must be a positive number |
| Deadline | Required; must be a future date |
| Application Status | Must be: `Pending`, `Reviewed`, `Accepted`, or `Rejected` |
| Duplicate application | Blocked at DB level (`UNIQUE` on `student_id, job_id`) |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `ER_ACCESS_DENIED_ERROR` | Check `DB_USER` / `DB_PASSWORD` in `.env` |
| `ECONNREFUSED` | Start MySQL in XAMPP first |
| `ER_BAD_DB_ERROR` | Re-run `schema.sql` — database may not have been created |
| Port 3000 already in use | Change `PORT=3001` in `.env` |
| `Cannot find module 'mysql2'` | Run `npm install` |
| Forms submitting blank | Ensure XAMPP Apache is running and `mysql2` is installed |

---

## GitHub Upload

```bash
# Inside the project folder:
git init
git add .
git commit -m "feat: initial JobNest DBMS lab project submission"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/jobnest.git
git push -u origin main
```

**Files that must NOT be pushed:**
- `.env` (contains your database password) — already in `.gitignore`
- `node_modules/` — already in `.gitignore`

---

## Sample Data Included

The `schema.sql` loads:
- 6 Students
- 4 Companies
- 8 Jobs (7 Open, 1 Closed)
- 10 Applications (across all 4 statuses)

---

*Developed for CSE 224 — Database Management System Laboratory*
