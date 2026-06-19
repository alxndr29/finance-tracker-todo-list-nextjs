# Finance Tracker

Aplikasi pencatatan keuangan pribadi untuk memantau pemasukan dan pengeluaran bulanan.

## Fitur

- **Dashboard** — Ringkasan saldo, grafik tren 6 bulan, dan pengeluaran per kategori
- **Transaksi** — Catat pemasukan & pengeluaran dengan upload foto bukti, filter, dan pencarian
- **Anggaran** — Atur batas pengeluaran per kategori dengan visualisasi progress
- **Laporan** — Laporan bulanan detail dengan grafik harian dan export CSV
- **Autentikasi** — Login/register dengan JWT dan password terenkripsi
- **Responsive** — Tampilan optimal di desktop maupun mobile

## Tech Stack

- **Frontend & Backend** — Next.js 14 (App Router)
- **Database** — PostgreSQL
- **ORM** — Prisma v7
- **Styling** — Tailwind CSS v4
- **Charts** — Recharts
- **Auth** — JWT (jsonwebtoken + bcryptjs)

---

## Prasyarat

Pastikan sudah terinstal di komputer Anda:

- [Node.js](https://nodejs.org) versi 18 atau lebih baru
- [PostgreSQL](https://www.postgresql.org/download/) versi 14 atau lebih baru
- npm (sudah termasuk dengan Node.js)

---

## Setup & Instalasi

### 1. Clone atau masuk ke direktori project

```bash
cd personal-finance-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Buat database PostgreSQL

Masuk ke PostgreSQL dan buat database baru:

```bash
psql -U postgres
```

```sql
CREATE DATABASE finance_app;
\q
```

### 4. Konfigurasi environment variables

Buka file `.env` dan sesuaikan `DATABASE_URL` dengan kredensial PostgreSQL Anda:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/finance_app"
JWT_SECRET="ganti-dengan-secret-key-yang-kuat"
NEXTAUTH_SECRET="ganti-dengan-secret-nextauth"
NEXTAUTH_URL="http://localhost:3000"
```

Ganti `postgres`, `password`, dan `finance_app` sesuai dengan konfigurasi PostgreSQL Anda.

### 5. Jalankan migrasi database

Perintah ini akan membuat semua tabel yang dibutuhkan:

```bash
npx prisma migrate dev --name init
```

### 6. (Opsional) Buat akun demo

Jalankan seeder untuk membuat akun demo siap pakai:

```bash
npm run db:seed
```

Akun demo yang dibuat:
| Field    | Value            |
|----------|------------------|
| Username | `demo`           |
| Password | `password123`    |
| Email    | `demo@example.com` |

---

## Menjalankan Aplikasi

### Mode Development

```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**

Aplikasi akan otomatis redirect ke halaman login. Setelah login, Anda akan masuk ke dashboard.

### Mode Production

```bash
npm run build
npm run start
```

---

## Perintah Berguna

| Perintah | Fungsi |
|----------|--------|
| `npm run dev` | Jalankan server development |
| `npm run build` | Build untuk production |
| `npm run start` | Jalankan server production |
| `npm run db:migrate` | Buat dan jalankan migrasi baru |
| `npm run db:generate` | Generate ulang Prisma client |
| `npm run db:seed` | Isi database dengan data demo |
| `npm run db:studio` | Buka Prisma Studio (GUI database) |

---

## Struktur Project

```
personal-finance-app/
├── prisma/
│   ├── schema.prisma       # Definisi skema database
│   ├── seed.ts             # Script seeder data demo
│   └── migrations/         # File migrasi database
├── src/
│   ├── app/
│   │   ├── (auth)/         # Halaman login & register
│   │   ├── (dashboard)/    # Layout & halaman utama
│   │   │   ├── dashboard/  # Halaman dashboard
│   │   │   ├── transactions/ # Halaman transaksi
│   │   │   ├── budgets/    # Halaman anggaran
│   │   │   └── reports/    # Halaman laporan
│   │   └── api/            # API routes
│   │       ├── auth/       # Login, register, logout
│   │       ├── transactions/
│   │       ├── budgets/
│   │       ├── dashboard/
│   │       ├── reports/
│   │       └── upload/     # Upload foto bukti
│   ├── components/
│   │   ├── TransactionModal.tsx
│   │   ├── BudgetModal.tsx
│   │   └── ImageViewer.tsx
│   ├── lib/
│   │   ├── prisma.ts       # Koneksi database
│   │   ├── auth.ts         # JWT & bcrypt helpers
│   │   ├── utils.ts        # Format currency, kategori
│   │   └── api.ts          # HTTP client helper
│   ├── generated/prisma/   # Prisma client (auto-generated)
│   └── middleware.ts       # Auth middleware
├── public/
│   └── uploads/            # Penyimpanan foto bukti transaksi
├── .env                    # Environment variables
└── package.json
```

---

## Kategori Transaksi

### Pengeluaran
Makanan & Minuman, Transportasi, Belanja, Kesehatan, Hiburan, Pendidikan, Tagihan, Sewa/KPR, Lainnya

### Pemasukan
Gaji, Freelance, Investasi, Hadiah, Lainnya

---

## Troubleshooting

**Error: `DATABASE_URL` tidak valid**
- Pastikan PostgreSQL sudah berjalan
- Cek username, password, dan nama database di `.env`
- Coba koneksi manual: `psql -U postgres -d finance_app`

**Error: Prisma client tidak ditemukan**
```bash
npm run db:generate
```

**Error: Tabel tidak ada (P2021)**
```bash
npx prisma migrate dev --name init
```

**Upload foto gagal**
- Pastikan folder `public/uploads/` dapat ditulis (writable)
- Ukuran file maksimal 5MB, format: JPG, PNG, WebP
