# MediLink Zimbabwe

Full-stack healthcare appointment booking and digital patient record application.

## Stack

- Frontend: React + TypeScript + Vite + Tailwind CSS + React Router + Axios
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt
- Security: Helmet + CORS + rate limiting + Zod validation
- Icons: Lucide React

## Core roles

### Patient
Register/login, browse doctors, filter by speciality, book appointments, view appointment history, medical records and prescriptions, manage profile.

### Doctor
Login, manage profile and availability, view appointments, access authorized patient records, record consultations and create prescriptions.

### Pharmacy verifier
Prescription verification endpoint and public verification page. It only returns dispensing-relevant prescription information.

## Project structure

```text
medilink-zimbabwe/
  client/
  server/
  README.md
  .gitignore
```

## Requirements

- Node.js 20+
- MongoDB Atlas or local MongoDB
- npm

## 1. Configure backend

```bash
cd server
copy .env.example .env
npm install
```

Edit `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/medilink_zimbabwe
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_ORIGIN=http://localhost:5173
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

## 2. Seed demo data

From `server`:

```bash
npm run seed
```

Demo accounts:

- Patient: `patient@medilink.co.zw` / `Patient123!`
- Doctor: `doctor@medilink.co.zw` / `Doctor123!`

A demo prescription code is printed by the seed command.

## 3. Start backend

```bash
cd server
npm run dev
```

API: http://localhost:5000

Health check: http://localhost:5000/api/health

## 4. Start frontend

Open another terminal:

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

Frontend: http://localhost:5173

## Important

This project is an educational/product prototype, not a production medical system. Before real patient use, conduct security, privacy, clinical governance, legal/regulatory, hosting, backup, encryption, audit, monitoring and penetration testing reviews.

## Main API areas

- `/api/auth`
- `/api/doctors`
- `/api/appointments`
- `/api/patients`
- `/api/medical-records`
- `/api/prescriptions`
- `/api/verification`

## Appointment protection

The appointment creation endpoint checks the doctor's date/time slot and rejects an existing booking for the same doctor and start time. The database also uses a unique compound index for active bookings.

## Prescription privacy

The authenticated patient can see their own prescription. The doctor can access prescriptions they created. The public verification endpoint returns only prescription identity, doctor, medicine, dosage, frequency, duration, instructions, issue/expiry dates and status.
