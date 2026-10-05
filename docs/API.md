# MediLink API quick reference

Base URL: `http://localhost:5000/api`

## Public

- GET `/health`
- POST `/auth/register`
- POST `/auth/login`
- GET `/doctors`
- GET `/doctors/specialities`
- GET `/doctors/:id`
- GET `/doctors/:id/availability`
- GET `/verification/:code`

## Authenticated

Send:

`Authorization: Bearer <JWT>`

### Patient

- GET `/patients/me`
- PUT `/patients/me`
- POST `/appointments`
- GET `/appointments/mine`
- PATCH `/appointments/:id/status`
- GET `/medical-records/mine`
- GET `/prescriptions/mine`
- GET `/notifications`

### Doctor

- PUT `/doctors/me`
- POST `/doctors/availability`
- GET `/appointments/mine`
- PATCH `/appointments/:id/status`
- POST `/medical-records`
- GET `/medical-records/patient/:patientId`
- POST `/prescriptions`
- GET `/prescriptions/doctor`

Backend authorization is enforced independently of frontend visibility.
