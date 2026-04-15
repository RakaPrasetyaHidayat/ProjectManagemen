<div align="center">

#  TaskFlow

**Web-based Project Management Application**

![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)
![Express](https://img.shields.io/badge/Express.js-5-green?style=flat-square&logo=express)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-336791?style=flat-square&logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)

Manage projects, tasks, files, and notes — all in one place.

</div>

---

##  Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Running the App](#-running-the-app)
- [Roles & Access](#-roles--access)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)

---

##  Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | Next.js 14, Ant Design, TypeScript |
| Backend   | Express.js 5, TypeScript          |
| ORM       | Prisma                            |
| Database  | PostgreSQL                        |
| Auth      | JWT (JSON Web Token)              |

---

##  Prerequisites

Make sure the following are installed on your machine:

- [Node.js](https://nodejs.org/) `>= 18.0.0`
- [PostgreSQL](https://www.postgresql.org/) `>= 13`
- `npm` or `yarn`

---

##  Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ProjectManagemen
```

### 2. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with your configuration — see [Environment Variables](#-environment-variables).

Then run the database migration:

```bash
# First time setup
npm run db:push

# Or if using migrations
npm run db:migrate
```

### 3. Setup Frontend

```bash
cd ../frontend
npm install
cp .env.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_ENV=development
```

---

##  Environment Variables

### Backend — `backend/.env`

| Variable         | Description                              | Example                                          |
|------------------|------------------------------------------|--------------------------------------------------|
| `DATABASE_URL`   | PostgreSQL connection string             | `postgresql://user:password@localhost:5432/taskflow` |
| `PORT`           | Port the backend runs on                 | `5000`                                           |
| `NODE_ENV`       | Environment mode                         | `development`                                    |
| `FRONTEND_URL`   | Frontend URL (used for CORS)             | `http://localhost:3000`                          |
| `JWT_SECRET`     | Secret key for signing JWT tokens        | `your_strong_secret_key`                         |

### Frontend — `frontend/.env.local`

| Variable              | Description              | Example                      |
|-----------------------|--------------------------|------------------------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL     | `http://localhost:5000`      |
| `NEXT_PUBLIC_ENV`     | Environment mode         | `development`                |

---

##  Running the App

Open **two separate terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# Running at http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# Running at http://localhost:3000
```

Open your browser and go to **http://localhost:3000**

---

##  Roles & Access

New accounts are set to **Pending** status after registration and must be approved by a **Manager**.

| Role    | Permissions                                              |
|---------|----------------------------------------------------------|
| Manager | Manage users, projects, tasks, view all activity logs    |
| Staf    | View & update assigned tasks, upload files               |

> **First-time setup:** You need to manually promote the first Manager account via Prisma Studio.
>
> ```bash
> cd backend
> npm run db:studio
> ```
>
> Set `role` → `manager` and `status` → `Approved` on your user record.

---

##  Features

-  Project & task management with status tracking *(To Do / On Progress / Done)*
-  Assign tasks to staff with deadlines
-  Upload & preview files on tasks *(PDF, Word, Excel, Images)*
-  Personal notes per user
-  Activity log for action tracking
-  User registration with approval system

---

##  Project Structure

```
ProjectManagemen/
├── backend/
│   ├── src/
│   │   ├── modules/       # Feature modules (auth, projects, tasks, etc.)
│   │   ├── middleware/    # Auth & error middleware
│   │   └── config/        # App configuration
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # Migration history
│   ├── uploads/           # Uploaded files (local storage)
│   └── app.ts             # Entry point
│
└── frontend/
    ├── app/               # Pages (Next.js App Router)
    ├── components/        # UI components (atoms, molecules, organisms)
    ├── services/          # API service layer
    ├── context/           # React context (auth, project, user)
    └── lib/               # Utilities & API client
```

---

## 🔧 Troubleshooting

**`Error: Can't reach database server`**
> Ensure PostgreSQL is running and `DATABASE_URL` in `backend/.env` is correct.

**`CORS error` in browser**
> Make sure `FRONTEND_URL` in `backend/.env` matches the URL your frontend is running on.

**`PrismaClientInitializationError` after cloning**
> Regenerate the Prisma client:
> ```bash
> cd backend
> npm run db:generate
> ```

**Port already in use**
> Change `PORT` in `backend/.env` and update `NEXT_PUBLIC_API_URL` in `frontend/.env.local` accordingly.

---