# JobNest — Student Job Portal (242-115-250)

>Database Management System Lab Project \
Developed by Mehedi Hasan \
ID : 242-115-250 \
Batch: CSE – 61st\
Section: E \
Department of Computer Science and Engineering \
Metropolitan University, Sylhet

A full-stack web application that allows students to browse job listings, and companies to post opportunities. Built as a practical demonstration of relational database design, SQL operations, and server-side web development.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, EJS, Bootstrap 5 |
| Backend | Node.js, Express.js |
| Database | MySQL (via XAMPP) |
| DB Driver | mysql2 |

---

## Features

- Register and manage student profiles
- Register companies and post job or internship listings
- Browse available jobs and submit applications
- Update application status (Pending, Reviewed, Accepted, Rejected)
- Full CRUD operations across all four entities
- Server-side input validation on all forms
- Admin panel for centralized management of all records

---

## Database Design

The database (`jobnest_db`) contains four tables: **Students**, **Companies**, **Jobs**, and **Applications**. The schema is normalized to 3NF with primary keys, foreign keys, and a unique constraint to prevent duplicate applications.

The database also includes views, triggers, and stored procedures to demonstrate advanced SQL concepts covered in the course.

---

## Getting Started

### Requirements

- [XAMPP](https://www.apachefriends.org/) with MySQL running
- [Node.js 18+](https://nodejs.org/)

### Setup

**1. Clone the repository**
```bash
git clone https://github.com/mehedi-05/jobnest.git
cd jobnest
```

**2. Install dependencies**
```bash
npm install
```

**3. Configure environment variables**

Copy `.env.example` to `.env` and fill in your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=jobnest_db
PORT=3000
```

**4. Import the database**

Open `http://localhost/phpmyadmin`, click **Import**, select `database/schema.sql`, and click **Go**.

**5. Start the server**
```bash
npm start
```

Visit `http://localhost:3000`

---

## Project Structure

```
jobnest/
├── app.js
├── package.json
├── .env.example
├── config/
│   └── db.js
├── controllers/
│   ├── studentController.js
│   ├── companyController.js
│   ├── jobController.js
│   └── applicationController.js
├── routes/
│   ├── studentRoutes.js
│   ├── companyRoutes.js
│   ├── jobRoutes.js
│   └── applicationRoutes.js
├── middleware/
│   ├── validators.js
│   └── errorHandler.js
├── views/
│   ├── layout.ejs
│   ├── partials/
│   ├── students/
│   ├── companies/
│   ├── jobs/
│   └── applications/
├── public/
│   └── css/
└── database/
    └── schema.sql
```

---

## Sample Data

The SQL script loads sample data including 6 students, 4 companies, 8 job listings, and 10 applications so the application can be tested immediately after setup.

---

## Admin Panel

No login required. The panel provides an overview of all records with quick access to add, edit, and delete operations.

---

## Common Issues

| Problem | Fix |
|---|---|
| Cannot connect to MySQL | Start MySQL in XAMPP Control Panel |
| `ER_BAD_DB_ERROR` | Import `schema.sql` via phpMyAdmin |
| Port 3000 in use | Change `PORT=3001` in `.env` |
| Module not found | Run `npm install` |

---
