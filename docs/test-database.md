# Isolated local MongoDB testing

This setup runs a real, temporary MongoDB process on loopback. It never accepts an external database URL, never imports your private .env, and never uses existing application data. The database and generated test accounts are disposable; restarting starts fresh. This is local testing, not hosted staging or production.

## Automated integration check

From the repository root:

```powershell
npm run test:integration --prefix server
```

The first run downloads the pinned MongoDB 8.2.6 runtime (roughly 781 MB on Windows) into server/node_modules/.cache/mongodb-test. Downloads can resume after interruption, and later runs reuse the cached binary. Allow up to 30 minutes for the initial integration check on a slow connection. The test creates synthetic users, a doctor profile and an appointment. It checks authentication, payment persistence, duplicate payment rejection, patient ownership, medical-aid/patient settlement attribution, administrative access and session invalidation after password/account changes. No real payment gateway is contacted. The existing fast tests remain available with `npm test --prefix server`.

## Manual UI testing

In one terminal:

```powershell
npm run dev:test --prefix server
```

This starts the isolated API at `http://127.0.0.1:5001/api` and prints a newly generated password for its synthetic accounts. The accounts are `patient@medilink-test.invalid`, `doctor@medilink-test.invalid`, `admin@medilink-test.invalid` and `pharmacy@medilink-test.invalid`. None represent real people or institutions.

In another terminal, from the repository root:

```powershell
$env:VITE_API_URL='http://127.0.0.1:5001/api'
npm run dev --prefix client -- --host localhost --port 5173 --strictPort
```

Open `http://localhost:5173` in a private browser window so existing login tokens are not reused. Sign in using a synthetic account and the password printed by the test API. Keep the test API terminal open. Stop both processes with Ctrl+C when finished, then remove the temporary shell override with `Remove-Item Env:VITE_API_URL`.

The runtime package is development-only. Do not deploy this runner, expose its database publicly, or use real patient data in it. A forced process kill may leave temporary files until normal system cleanup; the next run still uses a new independent database.


## Existing database index caution

The integration check found two conflicting declarations for the Payment appointment index. The redundant non-unique declaration was removed; the intended unique index remains. The check verifies that a newly created database enforces one payment per appointment, including direct duplicate insert rejection.

This does not migrate an existing main database. Before deployment, inspect its payment indexes and any duplicate appointment payments using an authorized staging/maintenance process. No production index is dropped or rebuilt by these test scripts.
