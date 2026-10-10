import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import jwt from 'jsonwebtoken';

// Import configuration from an empty directory so tests never read the private .env.
const cwd = process.cwd();
const isolated = mkdtempSync(join(tmpdir(), 'medilink-tests-'));
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'synthetic-test-secret-not-for-deployment';
process.env.MONGODB_URI = 'mongodb://127.0.0.1:1/unused_test_database';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.chdir(isolated);
const appModule = await import('../dist/app.js');
process.chdir(cwd);
rmdirSync(isolated);
const { User } = await import('../dist/models/User.js');
const { Payment } = await import('../dist/models/Payment.js');
const { AuditLog } = await import('../dist/models/AuditLog.js');
const app = appModule.default.default || appModule.default;
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.once('listening', resolve));
const origin = 'http://127.0.0.1:' + server.address().port;
test.after(() => new Promise(resolve => server.close(resolve)));
const id = '000000000000000000000001';
const account = { _id: id, name: 'Fixture user', role: 'patient', email: 'fixture@example.invalid', isActive: true, sessionVersion: 0 };
const token = (claims = {}) => jwt.sign({ id, role: 'patient', ...claims }, process.env.JWT_SECRET);
const headers = claims => ({ Authorization: 'Bearer ' + token(claims), 'Content-Type': 'application/json' });
function mockAccount(t, user = account) {
  t.mock.method(User, 'findById', () => ({ select: async () => user }));
}

test('health returns privacy and security headers', async () => {
  const r = await fetch(origin + '/api/health');
  assert.equal(r.status, 200);
  assert.equal((await r.json()).status, 'ok');
  assert.equal(r.headers.get('cache-control'), 'no-store');
  assert.ok(r.headers.get('x-request-id'));
  assert.equal(r.headers.get('x-powered-by'), null);
  assert.ok(r.headers.get('x-content-type-options'));
});

test('missing and invalid tokens reject before database access', async t => {
  const db = t.mock.method(User, 'findById', () => { throw Error('Unexpected database access'); });
  for (const path of ['/appointments/mine', '/medical-records/mine', '/prescriptions/mine', '/payments/mine', '/payments/admin', '/notifications', '/admin/stats']) {
    for (const authorization of ['', 'Bearer invalid']) {
      assert.equal((await fetch(origin + '/api' + path, { headers: { Authorization: authorization } })).status, 401, path);
    }
  }
  assert.equal(db.mock.callCount(), 0);
});

test('legacy active patient session restores the public id contract and denies admin access', async t => {
  mockAccount(t);
  const r = await fetch(origin + '/api/auth/me', { headers: headers() });
  assert.equal(r.status, 200);
  assert.equal((await r.json()).user.id, id);
  assert.equal((await fetch(origin + '/api/payments/admin', { headers: headers() })).status, 403);
});

for (const [label, user] of [
  ['disabled', { ...account, isActive: false }],
  ['deleted', null],
  ['password reset or reactivated', { ...account, sessionVersion: 1 }],
  ['role changed', { ...account, role: 'doctor' }],
]) {
  test(label + ' account rejects an old token', async t => {
    mockAccount(t, user);
    assert.equal((await fetch(origin + '/api/auth/me', { headers: headers() })).status, 401);
  });
}

test('current version session is accepted', async t => {
  mockAccount(t, { ...account, sessionVersion: 2 });
  assert.equal((await fetch(origin + '/api/auth/me', { headers: headers({ sessionVersion: 2 }) })).status, 200);
});

for (const [field, value] of [['passwordHash', 'new-fixture-hash'], ['isActive', false], ['role', 'doctor'], ['phone', 'fixture-phone']]) {
  test('saving ' + field + ' applies the expected atomic session revocation', async t => {
    let update;
    t.mock.method(User.collection, 'updateOne', async (_filter, changes) => { update = changes; return { acknowledged: true, matchedCount: 1, modifiedCount: 1 }; });
    const user = User.hydrate({ ...account, passwordHash: 'fixture-hash' });
    user[field] = value;
    await user.save();
    assert.equal(update.$inc?.sessionVersion, field === 'phone' ? undefined : 1);
  });
}

test('malformed JSON is a client error', async () => {
  const r = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
  assert.equal(r.status, 400);
  assert.match((await r.json()).message, /valid JSON/);
});

test('invalid registration returns useful validation fields without echoing private inputs', async () => {
  const r = await fetch(origin + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: '', email: 'private-invalid-value', password: 'x' }) });
  assert.equal(r.status, 400);
  const body = await r.json();
  assert.ok(body.errors.some(error => error.field === 'email'));
  assert.ok(!JSON.stringify(body).includes('private-invalid-value'));
});

for (const [label, existing, update, expected, status] of [
  ['split settlement', { amount: 100 }, { status: 'paid', amountPaid: 40, amountCovered: 60 }, [40, 60, 0], 200],
  ['status-only insurer settlement', { amount: 100, amountCovered: 60 }, { status: 'paid' }, [40, 60, 0], 200],
  ['status-only direct settlement', { amount: 100 }, { status: 'paid' }, [100, 0, 0], 200],
  ['partial balance', { amount: 100 }, { status: 'partially_paid', amountPaid: 20, amountCovered: 50 }, [20, 50, 30], 200],
  ['decimal settlement', { amount: 0.3 }, { status: 'paid', amountPaid: 0.1, amountCovered: 0.2 }, [0.1, 0.2, 0], 200],
  ['underpaid marked paid', { amount: 100 }, { status: 'paid', amountPaid: 10 }, null, 400],
  ['overpayment', { amount: 100 }, { status: 'paid', amountPaid: 80, amountCovered: 60 }, null, 400],
]) {
  test('reconciliation: ' + label, async t => {
    mockAccount(t, { ...account, role: 'admin' });
    const audit = t.mock.method(AuditLog, 'create', async () => ({}));
    let saves = 0;
    const payment = { _id: id, amountPaid: 0, amountCovered: 0, patientBalance: 100, medicalAid: {}, ...existing, save: async () => { saves++; } };
    t.mock.method(Payment, 'findById', async () => payment);
    const r = await fetch(origin + '/api/payments/' + id + '/status', { method: 'PATCH', headers: headers({ role: 'admin' }), body: JSON.stringify(update) });
    assert.equal(r.status, status);
    if (expected) {
      assert.deepEqual([payment.amountPaid, payment.amountCovered, payment.patientBalance], expected);
      assert.equal(saves, 1);
      assert.equal(audit.mock.callCount(), 1);
      const entry = audit.mock.calls[0].arguments[0];
      assert.equal(entry.entityId, id);
      assert.equal(entry.metadata.route, '/:id/status');
      assert.ok(!JSON.stringify(entry).includes('Bearer'));
    } else assert.equal(saves, 0);
  });
}
