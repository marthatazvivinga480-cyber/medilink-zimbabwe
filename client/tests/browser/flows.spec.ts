import { test, expect, type Page } from '@playwright/test';
const day = new Date(Date.now() + 86400000 * 10).toISOString().slice(0, 10);
const doctor = { _id: 'd1', userId: { _id: 'u1', name: 'TEST provider', email: 'provider@example.invalid', isActive: true }, speciality: 'Synthetic care', qualifications: [], languages: [], consultationTypes: ['In-person'], consultationFee: 100, currency: 'USD', isVerified: true };
const appointment = { _id: 'a1', date: day, startTime: '10:00', endTime: '10:30', reason: 'Synthetic appointment', status: 'confirmed', doctorId: doctor, patientId: { _id: 'p1', userId: { name: 'TEST patient', email: 'patient@example.invalid' } } };
const record = { _id: 'r1', appointmentId: 'a1', doctorId: doctor, diagnosis: 'Synthetic encounter', createdAt: day };
const code = 'RX-MZ-2026-' + 'AB'.repeat(16);
const prescription = { _id: 'rx1', appointmentId: 'a1', doctorId: doctor, prescriptionCode: code, medicines: [], status: 'valid', issuedAt: day };
const payment = { _id: 'pay1', __v: 0, appointmentId: appointment, patientId: appointment.patientId, doctorId: doctor, status: 'medical_aid_pending', currency: 'USD', patientBalance: 100, amount: 100, amountPaid: 0, amountCovered: 0, refundedAmount: 0, method: 'medical_aid', medicalAid: { provider: 'TEST insurer', membershipNumber: 'TEST-001', claimStatus: 'pending_verification' }, createdAt: day };
async function fixtures(page: Page, role: string) {
  const errors: string[] = []; const mutations: { path: string; body: any }[] = [];
  let currentPayment = structuredClone(payment);
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/api/**', async route => {
    const request = route.request(); const path = new URL(request.url()).pathname;
    let body: any = {}; let status = 200;
    if (path === '/api/auth/me') body = { user: { id: role === 'doctor' ? 'u1' : 'u2', name: 'TEST ' + role, email: 'test@example.invalid', role } };
    else if (path === '/api/payments/pay1/status' && request.method() === 'PATCH') {
      const update = request.postDataJSON(); mutations.push({ path, body: update });
      currentPayment = { ...currentPayment, ...update, __v: currentPayment.__v + 1, patientBalance: 100 - update.amountPaid - update.amountCovered };
      body = { payment: currentPayment };
    } else if (path === '/api/admin/doctors/d1' && request.method() === 'PATCH') { mutations.push({ path, body: request.postDataJSON() }); body = { doctor }; }
    else if (path === '/api/doctors' || path === '/api/admin/doctors') body = { doctors: [doctor] };
    else if (path === '/api/doctors/d1') body = { doctor };
    else if (path.includes('availability')) body = { availability: [{ date: day, slots: [{ startTime: '10:00', endTime: '10:30', isBooked: false }] }] };
    else if (path === '/api/appointments' && request.method() === 'POST') { mutations.push({ path, body: request.postDataJSON() }); body = { appointment }; }
    else if (path.includes('appointments')) body = { appointments: [appointment] };
    else if (path.includes('medical-records')) body = { records: [record] };
    else if (path.includes('prescriptions')) body = { prescriptions: [prescription] };
    else if (path.includes('verification')) body = { valid: true, detailsAvailable: role === 'pharmacy', prescription: { ...prescription, doctor: 'TEST provider' } };
    else if (path.includes('payments')) body = { payments: [currentPayment], totals: { total: 1, pending: 1, failed: 0, partial: 0 } };
    else if (path.includes('unread-count')) body = { unreadCount: 1 };
    else if (path.includes('notifications')) body = { notifications: [{ _id: 'n1', type: 'payment_updated', title: 'Payment update', message: 'Synthetic notification', link: '/dashboard/patient/payments?appointment=a1', isRead: false, createdAt: day }], unreadCount: 1 };
    else if (path.includes('stats')) body = { stats: { doctors: 1, patients: 1, appointments: 1, activeDoctors: 1, verifiedDoctors: 1 } };
    else if (path.includes('patients')) body = { patient: {} };
    else { status = 404; body = { message: 'Unimplemented fixture: ' + path }; }
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return { errors, mutations };
}
async function noOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
    elements: [...document.querySelectorAll('body *')].filter(element => { const r = element.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0; }).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, text: element.textContent?.slice(0, 65), right: element.getBoundingClientRect().right })) }));
  expect(overflow.scroll, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.width + 1);
}
for (const width of [360, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  for (const role of ['patient', 'doctor', 'admin', 'pharmacy']) {
    test(`${role} layouts at ${width}px`, async ({ page }, info) => {
      await page.setViewportSize({ width, height: 900 });
      const state = await fixtures(page, role);
      const paths = role === 'patient' ? ['/dashboard/patient', '/dashboard/patient/appointments', '/dashboard/patient/payments?appointment=a1', '/dashboard/patient/records', '/dashboard/patient/prescriptions', '/dashboard/patient/notifications', '/doctors/d1'] : role === 'doctor' ? ['/doctor'] : role === 'admin' ? ['/admin', '/admin/payments'] : ['/dashboard'];
      for (const path of paths) {
        await page.goto(path); await page.waitForLoadState('networkidle');
        await expect(page.getByText('This page could not open', { exact: true })).toHaveCount(0);
        await noOverflow(page);
        if (path.includes('payments') || role === 'doctor') await page.screenshot({ path: info.outputPath(path.includes('/admin') ? 'admin.png' : role + '.png'), fullPage: true });
      }
      if (role === 'pharmacy') {
        await page.getByLabel('Prescription code', { exact: true }).fill(code);
        await page.getByRole('button', { name: 'Verify', exact: true }).click();
        await expect(page.getByText('TEST provider', { exact: true })).toBeVisible();
        await noOverflow(page);
      }
      if (role === 'admin') {
        await page.getByRole('button', { name: 'Review payment for TEST patient', exact: true }).click();
        const dialog = page.getByRole('dialog', { name: 'Review payment request' });
        await expect(dialog).toBeVisible(); await noOverflow(page);
        await page.screenshot({ path: info.outputPath('review-dialog.png'), fullPage: true });
        await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0);
      }
      expect(state.errors).toEqual([]);
    });
  }
}
test('admin reconciles claim, filters requests and uses accessible dialogs', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const state = await fixtures(page, 'admin'); await page.goto('/admin/payments');
  await page.getByRole('button', { name: 'Review payment for TEST patient', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  for (let i = 0; i < 16; i++) { await page.keyboard.press('Tab'); expect(await page.evaluate(() => !!document.activeElement?.closest('dialog'))).toBe(true); }
  await dialog.getByLabel('Outcome').selectOption('paid');
  await dialog.getByLabel('Patient paid (USD)', { exact: true }).fill('40');
  await dialog.getByLabel('Insurer covered (USD)', { exact: true }).fill('60');
  await dialog.getByRole('button', { name: 'Save review', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Review saved' })).toBeVisible();
  expect(state.mutations[0].body).toMatchObject({ status: 'paid', amountPaid: 40, amountCovered: 60, expectedVersion: 0 });
  await page.getByLabel('Status', { exact: true }).selectOption('medical_aid_pending');
  await expect(page.getByText('No requests match these filters.')).toBeVisible();
  await page.goto('/admin'); const edit = page.getByTitle('Edit doctor', { exact: true });
  await edit.click(); await expect(page.getByRole('dialog', { name: 'Edit doctor', exact: true })).toBeVisible();
  await page.keyboard.press('Escape'); await expect(edit).toBeFocused();
  expect(state.errors).toEqual([]);
});
test('existing-payment link cannot submit a duplicate; payment notification opens its record', async ({ page }) => {
  await fixtures(page, 'patient'); await page.goto('/dashboard/patient/payments?appointment=a1');
  await expect(page.getByRole('button', { name: 'Create payment request', exact: true })).toBeDisabled();
  await page.goto('/dashboard/patient/notifications');
  await page.getByText('Payment update', { exact: true }).click();
  await expect(page).toHaveURL(/payments\?appointment=a1/);
});
test('pharmacy verification preserves authorized workflow', async ({ page }) => {
  await fixtures(page, 'pharmacy'); await page.goto('/dashboard'); await expect(page).toHaveURL(/verification$/);
  await page.getByLabel('Prescription code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Verify', exact: true }).click();
  await expect(page.getByText('TEST provider', { exact: true })).toBeVisible();
});
test('booking review does not submit until confirmation', async ({ page }) => {
  const state = await fixtures(page, 'patient'); await page.goto('/doctors/d1');
  await page.getByRole('button', { name: 'Choose a date' }).click(); await page.getByRole('option').first().click();
  await page.getByRole('button', { name: '10:00', exact: true }).click();
  await page.getByRole('button', { name: 'Review booking', exact: true }).click();
  expect(state.mutations).toHaveLength(0);
  await page.getByRole('button', { name: 'Confirm booking', exact: true }).click();
  await expect(page.getByText('Appointment request sent successfully.')).toBeVisible();
  expect(state.mutations.filter(item => item.path === '/api/appointments')).toHaveLength(1);
});
