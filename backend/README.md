# Ayurveda Super App - PHP Laravel + MySQL Backend

This is the dedicated backend for the Ayurveda Super App built with **Laravel 12**, **MySQL**, and **Laravel Sanctum**.

---

## 🚀 Quick Start (Local Server)

### 1. Database Configuration
Make sure MySQL is running locally on port `3306`:
- Database: `ayurveda_app`
- User: `root` (no password by default)

If you need to change database credentials, update `.env` in this directory:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=ayurveda_app
DB_USERNAME=root
DB_PASSWORD=
```

### 2. Run Migrations and Seeders
```bash
php artisan migrate:fresh --seed
```
This sets up:
- Demo User: `asha@example.com` / `password123` (ID: `usr_1`)
- 5 Verified Ayurvedic Doctors with specialties, ratings, and clinics
- 175 Consultation time slots across 7 days
- 6 Ayurvedic Products (Ashwagandha, Triphala, Brahmi, Chyawanprash, Kumkumadi Tailam, Turmeric Curcumin)
- 5 Demo Health Records (prescriptions, lab reports, notes, vitals)

### 3. Start Local Development Server
Because port 8000 may be used by other processes, this backend runs on port **8001**:
```bash
php artisan serve --host=0.0.0.0 --port=8001
```
The API is available at:
- **Localhost**: `http://127.0.0.1:8001/api/v1`
- **Android Emulator**: `http://10.0.2.2:8001/api/v1`
- **Physical Device**: `http://<YOUR_LOCAL_IP>:8001/api/v1` (e.g., `http://192.168.0.102:8001/api/v1`)

---

## 📱 Mobile App Integration

In the mobile app root (`/Users/nehagupta/ayurveda-super-app/.env`):
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8001/api/v1
EXPO_PUBLIC_USE_MOCK_API=false
```

---

## 🧪 Testing and Verification

Run the automated 13-point end-to-end verification script from the project root:
```bash
node scripts/verify-backend.js
```

Or run the Jest test suite:
```bash
npm test -- __tests__/unit/backend-api-integration.test.ts
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/config/remote` | Feature flags and remote configuration |
| `POST` | `/api/v1/auth/login` | User authentication (Sanctum bearer token) |
| `GET` | `/api/v1/doctors` | List doctors with filtering, search & pagination |
| `GET` | `/api/v1/doctors/{id}` | Single doctor details & reviews |
| `GET` | `/api/v1/doctors/{id}/slots` | Available consultation time slots |
| `GET` | `/api/v1/bookings` | User consultation bookings |
| `POST` | `/api/v1/bookings` | Book a consultation slot |
| `DELETE` | `/api/v1/bookings/{id}` | Cancel a consultation booking |
| `GET` | `/api/v1/products` | E-commerce product catalog |
| `GET` | `/api/v1/products/{id}` | Single product details |
| `GET` | `/api/v1/records` | Patient health timeline records |
| `GET` | `/api/v1/records/{id}` | Single health record detail |
| `POST` | `/api/v1/records` | Create a new health record |
