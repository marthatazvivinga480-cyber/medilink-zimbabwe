import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { startTestEnvironment } from '../../scripts/test-environment.mjs';

test('real isolated MongoDB: auth, payment persistence, ownership, reconciliation and revocation', { timeout: 1800000 }, async t => {
  const env = await startTestEnvironment();
  t.after(() => env.stop());
  async function request(path, method = 'GET', body, token) {
    const response = await fetch(env.origin + '/api' + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  async function login(role, password = env.password) {
    const response = await request('/auth/login', 'POST', { email: `${role}@medilink-test.invalid`, password });
    assert.equal(response.status, 200);
    return response.body.token;
  }
  const patientToken = await login('patient');
  const adminToken = await login('admin');
  assert.equal((await request('/auth/me', 'GET', undefined, patientToken)).body.user.id, String(env.users.patient._id));
  const payload = { appointmentId: String(env.appointment._id), method: 'medical_aid', medicalAid: { provider: 'TEST ONLY provider', membershipNumber: 'TEST-0001' } };
  const created = await request('/payments', 'POST', payload, patientToken);
  assert.equal(created.status, 201);
  assert.equal(created.body.payment.status, 'medical_aid_pending');
  assert.equal((await request('/payments', 'POST', payload, patientToken)).status, 409);
  const outsider = await request('/auth/register', 'POST', { name: 'TEST ONLY other patient', email: 'other@medilink-test.invalid', password: env.password });
  assert.equal(outsider.status, 201);
  assert.equal((await request('/payments', 'POST', payload, outsider.body.token)).status, 403);
  const paymentId = created.body.payment._id;
  const settled = await request(`/payments/${paymentId}/status`, 'PATCH', { status: 'paid', amountPaid: 40, amountCovered: 60 }, adminToken);
  assert.equal(settled.status, 200);
  const indexes = await mongoose.models.Payment.collection.indexes();
  assert.equal(indexes.find(index => index.key.appointmentId === 1)?.unique, true);
  const saved = await mongoose.models.Payment.findById(paymentId);
  const duplicate = saved.toObject();
  delete duplicate._id;
  await assert.rejects(mongoose.models.Payment.create(duplicate), error => error.code === 11000);
  assert.deepEqual([saved.amountPaid, saved.amountCovered, saved.patientBalance], [40, 60, 0]);
  assert.equal((await request('/payments/mine', 'GET', undefined, patientToken)).body.payments.length, 1);
  assert.equal((await request('/payments/admin', 'GET', undefined, patientToken)).status, 403);
  const notices = await mongoose.models.Notification.find({ userId: env.users.patient._id, type: 'payment_updated' });
  assert.equal(notices.length, 2);
  assert.ok(notices.every(notice => notice.link.endsWith(String(env.appointment._id))));
  assert.equal(await mongoose.models.Notification.countDocuments({ userId: outsider.body.user.id }), 0);
  assert.equal((await request('/payments/' + paymentId + '/status', 'PATCH', { status: 'paid', amountPaid: 40, amountCovered: 60 }, adminToken)).status, 200);
  assert.equal(await mongoose.models.Notification.countDocuments({ userId: env.users.patient._id, type: 'payment_updated' }), 2);
  assert.equal((await request('/payments/' + paymentId + '/status', 'PATCH', { status: 'failed', expectedVersion: 0 }, adminToken)).status, 409);
  assert.equal((await request('/payments/' + paymentId + '/status', 'PATCH', { status: 'refunded', refundedAmount: 40 }, adminToken)).status, 200);
  assert.equal((await request('/payments/' + paymentId + '/status', 'PATCH', { status: 'partially_paid', amountPaid: 10 }, adminToken)).status, 400);
  const code = 'RX-MZ-2026-' + 'AB'.repeat(16);
  await mongoose.models.Prescription.create({ patientId: env.patient._id, doctorId: env.doctor._id, appointmentId: env.appointment._id,
    prescriptionCode: code, medicines: [{ name: 'SYNTHETIC medicine', dosage: 'test', frequency: 'test', duration: 'test' }], instructions: 'PRIVATE FIXTURE' });
  for (const token of [undefined, outsider.body.token]) {
    const result = await request('/verification/' + code, 'GET', undefined, token);
    assert.equal(result.status, 200); assert.equal(result.body.valid, true);
    assert.equal(result.body.detailsAvailable, false);
    assert.deepEqual(result.body.prescription.medicines, []);
    assert.equal(result.body.prescription.instructions, undefined);
  }
  for (const token of [patientToken, await login('pharmacy'), adminToken, await login('doctor')]) {
    const result = await request('/verification/' + code, 'GET', undefined, token);
    assert.equal(result.status, 200); assert.equal(result.body.detailsAvailable, true);
    assert.equal(result.body.prescription.instructions, 'PRIVATE FIXTURE');
  }
  let limited;
  for (let i = 0; i < 31; i++) limited = await request('/verification/' + code);
  assert.equal(limited.status, 429);
  env.users.patient.passwordHash = await bcrypt.hash('Synthetic-new-password-only', 12);
  await env.users.patient.save();
  assert.equal((await request('/auth/me', 'GET', undefined, patientToken)).status, 401);
  const freshToken = await login('patient', 'Synthetic-new-password-only');
  env.users.patient.isActive = false;
  await env.users.patient.save();
  assert.equal((await request('/auth/me', 'GET', undefined, freshToken)).status, 401);
  env.users.patient.isActive = true;
  await env.users.patient.save();
  assert.equal((await request('/auth/me', 'GET', undefined, freshToken)).status, 401);
});
