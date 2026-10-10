import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Always own the database process. Never accept an external connection string.
export async function startTestEnvironment(port = 0) {
  process.env.MONGOMS_RESUME_DOWNLOAD = 'true';
  const cacheDirectory = fileURLToPath(new URL('../node_modules/.cache/mongodb-test/', import.meta.url));
  await mkdir(cacheDirectory, { recursive: true });
  const dataDirectory = await mkdtemp(join(cacheDirectory, 'run-'));
  // Only this newly created child directory may be removed during cleanup.
  if (dirname(resolve(dataDirectory)) !== resolve(cacheDirectory)) throw new Error('Invalid test database path');
  const database = new MongoMemoryServer({
    binary: { version: '8.2.6', downloadDir: cacheDirectory },
    instance: { ip: '127.0.0.1', dbName: 'medilink_test', dbPath: dataDirectory },
  });
  let server;
  try {
    await database.start();
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = database.getUri('medilink_test');
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    process.env.CLIENT_ORIGIN = 'http://localhost:5173';
    const originalDirectory = process.cwd();
    const emptyDirectory = await mkdtemp(join(tmpdir(), 'medilink-config-'));
    let appModule;
    try {
      // dotenv sees only an empty temporary directory, never the private .env.
      process.chdir(emptyDirectory);
      appModule = await import('../dist/app.js');
    } finally {
      process.chdir(originalDirectory);
      await rmdir(emptyDirectory);
    }
    await mongoose.connect(database.getUri('medilink_test'));
    await Promise.all(Object.values(mongoose.models).map(model => model.init()));
    const { User, Patient, Doctor, Appointment } = mongoose.models;
    const password = randomBytes(18).toString('base64url');
    const passwordHash = await bcrypt.hash(password, 12);
    const users = {};
    for (const role of ['patient', 'doctor', 'admin', 'pharmacy']) {
      users[role] = await User.create({ name: `TEST ONLY ${role}`, email: `${role}@medilink-test.invalid`, passwordHash, role, isActive: true });
    }
    const patient = await Patient.create({ userId: users.patient._id });
    const doctor = await Doctor.create({ userId: users.doctor._id, speciality: 'Synthetic test profile', biography: 'Test fixture only. Not a real clinician.', consultationFee: 100, currency: 'USD', isVerified: false });
    const date = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const appointment = await Appointment.create({ patientId: patient._id, doctorId: doctor._id, date, startTime: '10:00', endTime: '10:30', reason: 'Synthetic test appointment', status: 'confirmed' });
    const app = appModule.default.default || appModule.default;
    server = app.listen(port, '127.0.0.1');
    await new Promise((resolve, reject) => { server.once('listening', resolve); server.once('error', reject); });
    return {
      origin: `http://127.0.0.1:${server.address().port}`,
      users, patient, doctor, appointment, password,
      async stop() {
        try { await new Promise(resolve => server.close(resolve)); }
        finally { await mongoose.disconnect(); await database.stop({ doCleanup: true, force: true }); }
      },
    };
  } catch (error) {
    if (server?.listening) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect();
    await database.stop({ doCleanup: true, force: true });
    throw error;
  }
}
