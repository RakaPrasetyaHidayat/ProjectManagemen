# Frontend - Project Management Application

Aplikasi frontend dibangun dengan **Next.js** dan **TypeScript**, menggunakan arsitektur komponen yang terstruktur dengan baik. Dokumentasi ini menjelaskan fungsi dan organisasi setiap folder dalam proyek.

## 📁 Struktur Direktori dan Fungsinya

### 🎨 **`/app`**
Direktori utama Next.js App Router yang berisi struktur routing aplikasi.

- **`layout.tsx`** - Layout root untuk seluruh aplikasi
- **`page.tsx`** - Halaman utama (home page)
- **`globals.css`** - Stylesheet global untuk seluruh aplikasi
- **`(auth)/`** - Route group untuk halaman autentikasi
  - `login/` - Halaman login pengguna
  - `register/` - Halaman registrasi pengguna
- **`(dashboard)/`** - Route group untuk halaman dashboard (hanya bisa diakses setelah login)
  - `dashboard/` - Halaman dashboard utama
  - `logs/` - Halaman untuk melihat log aktivitas
  - `notes/` - Halaman untuk mengelola catatan
  - `projects/` - Halaman untuk mengelola proyek
  - `tasks/` - Halaman untuk mengelola tugas/task
  - `users/` - Halaman untuk mengelola pengguna

### 🧩 **`/components`**
Komponen React yang diorganisir berdasarkan Atomic Design Pattern:

#### **`atoms/`** - Komponen paling dasar (building blocks)
- `PageTitle.tsx` - Judul halaman standar
- `StatusBadge.tsx` - Badge untuk menampilkan status

#### **`molecules/`** - Kombinasi beberapa atoms
- `PageHeader.tsx` - Header halaman dengan judul dan action buttons
- `SearchBar.tsx` - Bar pencarian untuk filtering data
- `StatCard.tsx` - Kartu untuk menampilkan statistik

#### **`organisms/`** - Komponen kompleks (kombinasi molecules dan atoms)
- `Header.tsx` - Header navigasi utama aplikasi
- `Sidebar.tsx` - Sidebar navigasi menu
- `ProjectForm.tsx` - Form untuk membuat/edit proyek
- `ProjectsTable.tsx` - Tabel daftar proyek
- `UserForm.tsx` - Form untuk membuat/edit pengguna
- `UsersTable.tsx` - Tabel daftar pengguna

#### **`templates/`** - Layout page-level
- `AdminDashboard.tsx` - Template dashboard admin
- `ProjectsTemplate.tsx` - Template halaman proyek
- `UserDashboard.tsx` - Template dashboard user biasa
- `UsersTemplate.tsx` - Template halaman manajemen pengguna

### 🔗 **`/context`**
State management menggunakan React Context API:

- **`AuthContext.tsx`** - Context untuk mengelola state autentikasi pengguna (login, logout, user info)
- **`ProjectContext.tsx`** - Context untuk mengelola state data proyek globally

### 🪝 **`/hooks`**
Custom React hooks untuk logic yang dapat digunakan kembali:

- **`useApiCall.ts`** - Hook untuk melakukan API calls dengan error handling dan loading state
- **`useGsapRef.ts`** - Hook untuk integrasi GSAP (animasi) dengan React refs

### 📚 **`/lib`**
Utilitas dan helper functions:

- **`api.ts`** - Konfigurasi dasar API
- **`axios.ts`** - Instance Axios yang sudah dikonfigurasi untuk request HTTP

### 🌐 **`/public`**
Folder untuk aset statis (gambar, icon, font, dll) yang dapat diakses langsung melalui URL.

### 🔌 **`/services`**
Service layer untuk komunikasi dengan backend API:

- **`apiClient.ts`** - Client API umum
- **`authService.ts`** - Service untuk autentikasi (login, register, logout)
- **`notesService.ts`** - Service untuk operasi CRUD catatan
- **`projectsService.ts`** - Service untuk operasi CRUD proyek
- **`tasksService.ts`** - Service untuk operasi CRUD task
- **`usersService.ts`** - Service untuk operasi CRUD pengguna
- **`index.ts`** - File ekspor untuk semua services

### 📝 **`/types`**
TypeScript type definitions dan interfaces:

- **`css.d.ts`** - Type definitions untuk CSS modules (jika menggunakan CSS modules)

## 📦 File Konfigurasi Root

- **`package.json`** - Daftar dependencies dan scripts
- **`tsconfig.json`** - Konfigurasi TypeScript
- **`next.config.mjs`** - Konfigurasi Next.js
- **`vercel.json`** - Konfigurasi untuk deployment di Vercel
- **`next-env.d.ts`** - Tipe auto-generated Next.js
- **`additional-env.d.ts`** - Tipe tambahan untuk environment variables

## 🏗️ Arsitektur Alur Data

```
UI Layer (components/)
    ↓
Context Layer (context/) - State management global
    ↓
Hooks Layer (hooks/) - Reusable logic
    ↓
Services Layer (services/) - API communication
    ↓
Backend API
```

## 🚀 Cara Kerja Aplikasi

1. **User** membuka aplikasi → `app/page.tsx`
2. **Belum login** → redirect ke `(auth)/login/`
3. **Sudah login** → akses ke dashboard di `(dashboard)/`
4. **Interaksi UI** → trigger action di components
5. **API Call** → melalui services layer
6. **Response** → update state di Context
7. **Re-render** → components menampilkan data terbaru

## 📌 Best Practices

- **Atomic Design**: Gunakan atoms untuk UI paling dasar, kombinasikan menjadi molecules & organisms
- **Separation of Concerns**: Pisahkan logic (services) dari UI (components)
- **Type Safety**: Selalu define types di `/types` folder
- **Code Reusability**: Buat custom hooks untuk logic yang digunakan berkali-kali
- **State Management**: Gunakan Context API untuk state global, useState untuk local state

---

**Dibuat untuk Project Management Application**
