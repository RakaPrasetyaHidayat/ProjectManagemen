# TASCA – Technical Documentation

## Overview

TASCA is a full-stack task management web application with role-based access control. It is built using a monorepo structure with separate `frontend` and `backend` directories, deployed independently on Vercel.

---

## Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js >= 20 |
| Framework | Express.js v5 |
| Language | TypeScript |
| ORM | Prisma v6 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) + bcrypt |
| File Upload | Multer |
| Validation | Zod |
| Security | Helmet, CORS, express-rate-limit |
| Compression | compression |

### Frontend
| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI Library | Ant Design v5 |
| HTTP Client | Axios |
| State | React Context API |
| Date Utility | Day.js |
| File Preview | pdfjs-dist, mammoth, xlsx |

---

## Project Structure

```
ProjectManagemen/
├── backend/
│   ├── app.ts                  # Express entry point
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Migration history
│   ├── src/
│   │   ├── config/
│   │   │   ├── config.ts       # Prisma client singleton
│   │   │   └── multer.ts       # File upload config
│   │   ├── middleware/
│   │   │   ├── jwt.ts          # JWT generate & verify
│   │   │   └── middleware.ts   # authenticateJWT, authorizeRole
│   │   └── modules/
│   │       ├── auth/           # Register, Login
│   │       ├── users/          # User CRUD + dashboard stats
│   │       ├── projects/       # Project CRUD
│   │       ├── tasks/          # Task CRUD + file upload
│   │       ├── notes/          # Personal notes CRUD
│   │       └── logs/           # Activity log viewer
│   └── uploads/                # Uploaded task files (local)
│
└── frontend/
    ├── app/
    │   ├── (auth)/             # Login, Register pages
    │   └── (dashboard)/        # Protected pages
    │       ├── dashboard/
    │       ├── projects/
    │       ├── tasks/
    │       ├── users/
    │       ├── notes/
    │       └── logs/
    ├── components/
    │   ├── atoms/              # StatusBadge, PageTitle
    │   ├── molecules/          # StatCard, PageHeader, SearchBar
    │   ├── organisms/          # Header, Sidebar, Tables, Forms
    │   └── templates/          # AdminDashboard, UserDashboard, etc.
    ├── context/                # AuthContext, ProjectContext, UsersContext
    ├── services/               # API service functions per module
    ├── hooks/                  # Custom React hooks
    ├── lib/
    │   └── api.ts              # Axios instance + interceptors
    └── constants/
        └── menuConfig.ts       # Sidebar navigation config
```

---

## Database Schema

### Models

**users**
```
id, username (unique), password (hashed), role (manager|staf),
status (Pending|Approved|Rejected), created_at
```

**project**
```
id, project_name, created_by (FK → users), created_at
```

**tasks**
```
id, task_name, task_status (To_Do|On_Progress|Done),
task_assign (FK → users), task_project (FK → project), deadline, file
```

**task_files**
```
id, task_id (FK → tasks), file_name, file_path, file_type,
description, uploaded_by (FK → users), uploaded_at
```

**notes**
```
id, content, created_by (FK → users), created_at, updated_at
```

**activity_logs**
```
id, actor, action, target, created_at
```

### Relationships
- `users` → `project` (one-to-many, via `created_by`)
- `project` → `tasks` (one-to-many, cascade delete)
- `users` → `tasks` (one-to-many, via `task_assign`)
- `tasks` → `task_files` (one-to-many, cascade delete)
- `users` → `notes` (one-to-many)

---

## API Reference

Base URL: `https://taskflow-backend-black.vercel.app`

All protected routes require header:
```
Authorization: Bearer <token>
```

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user (status: Pending) |
| POST | `/api/auth/login` | No | Login, returns JWT token |

### Users
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/users/profile` | Yes | Any | Get own profile |
| GET | `/api/users/dashboard/stats` | Yes | Manager | Dashboard statistics |
| GET | `/api/users` | Yes | Any | List all users |
| GET | `/api/users/:id` | Yes | Manager | Get user by ID |
| POST | `/api/users` | Yes | Manager | Create user |
| PUT | `/api/users/:id` | Yes | Manager | Update user |
| DELETE | `/api/users/:id` | Yes | Manager | Delete user |

### Projects
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/projects` | Yes | Any | List all projects |
| GET | `/api/projects/:id` | Yes | Any | Get project by ID |
| POST | `/api/projects` | Yes | Manager | Create project |
| PUT | `/api/projects/:id` | Yes | Manager | Update project |
| DELETE | `/api/projects/:id` | Yes | Manager | Delete project |

### Tasks
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/tasks` | Yes | Any | List all tasks |
| GET | `/api/tasks/:id` | Yes | Any | Get task by ID |
| POST | `/api/tasks` | Yes | Manager | Create task |
| PUT | `/api/tasks/:id` | Yes | Manager | Update task |
| DELETE | `/api/tasks/:id` | Yes | Manager | Delete task |
| PATCH | `/api/tasks/:id/status` | Yes | Any | Update task status |
| POST | `/api/tasks/:id/files` | Yes | Any | Upload file to task |
| DELETE | `/api/tasks/:id/files/:fileId` | Yes | Any | Delete task file |

### Notes
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/notes` | Yes | Any | List own notes |
| GET | `/api/notes/:id` | Yes | Any | Get note by ID |
| POST | `/api/notes` | Yes | Any | Create note |
| PUT | `/api/notes/:id` | Yes | Any | Update note |
| DELETE | `/api/notes/:id` | Yes | Any | Delete note |

### Logs
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/api/logs` | Yes | Manager | Get activity logs |

---

## Authentication & Authorization

### Flow
1. User registers → status set to `Pending`
2. Manager approves user → status becomes `Approved`
3. User logs in → receives JWT (expires in 8h)
4. All subsequent requests include `Authorization: Bearer <token>`
5. On 401 response, frontend auto-redirects to `/login`

### Middleware
- `authenticateJWT` – verifies Bearer token, attaches `req.user = { id, role }`
- `authorizeRole("manager")` – rejects non-manager requests with 403

### Token Payload
```json
{ "userId": 1, "role": "manager" }
```

---

## Frontend Architecture

### Routing (Next.js App Router)
- `(auth)` group – unauthenticated pages: `/login`, `/register`
- `(dashboard)` group – protected pages with shared layout (Sidebar + Header)

### State Management
- `AuthContext` – user session, token, login/logout/register actions
- `ProjectContext` – current project data
- `UsersContext` – users list for assignment dropdowns

### API Client (`lib/api.ts`)
- Axios instance with `baseURL` from `NEXT_PUBLIC_API_URL`
- Request interceptor: auto-attach JWT from `localStorage`
- Response interceptor: auto-redirect to `/login` on 401

### Component Architecture (Atomic Design)
```
atoms → molecules → organisms → templates → pages
```

---

## Environment Variables

### Backend (`.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret_key
PORT=7000
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## Running Locally

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev        # tsx --watch app.ts, port 7000
```

### Frontend
```bash
cd frontend
npm install
npm run dev        # next dev, port 3000
```

---

## Deployment

Both services are deployed on **Vercel** independently.

### Backend (`vercel.json`)
- Configured as a serverless Express app
- Uploads directory served as static files

### Frontend (`vercel.json`)
- Standard Next.js deployment
- Environment variable `NEXT_PUBLIC_API_URL` points to backend Vercel URL

### Build Commands
```bash
# Backend
npm run build   # prisma generate + tsc + copy generated/

# Frontend
npm run build   # next build
```

---

## File Upload

- Handled by **Multer** on `POST /api/tasks/:id/files`
- Files stored in `backend/uploads/` directory
- Served as static files at `/uploads/<filename>`
- Supported preview types on frontend: PDF, DOCX (mammoth), XLSX (xlsx), images

---

## Security Measures

- `helmet` – sets secure HTTP headers
- `cors` – whitelist-based origin control
- `bcrypt` (salt rounds: 10) – password hashing
- JWT expiry: 8 hours
- Request body limit: 10mb
- Static file cache: 7 days with ETag support