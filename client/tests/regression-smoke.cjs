const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:4173';
const doctor = { _id: 'd1', userId: { _id: 'u1', name: 'Fixture provider', email: 'fixture@example.invalid', isActive: true }, speciality: 'Fixture care', qualifications: [], languages: [], consultationTypes: ['In-person'], consultationFee: 30, currency: 'USD', isVerified: true };
const appointment = { _id: 'a1', doctorId: doctor, date: '2026-12-15', startTime: '10:00', endTime: '10:30', status: 'confirmed' };
const payment = { _id: 'pay1', appointmentId: appointment, doctorId: doctor, amount: 30, amountPaid: 0, amountCovered: 0, patientBalance: 30, currency: 'USD', status: 'pending', method: 'card', createdAt: '2026-10-01' };
(async () => {
  const browser = await chromium.launch(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE, headless: true } : { channel: 'msedge', headless: true });
  let checked = 0;
  try {
    for (const width of [390, 1440]) {
      for (const scenario of ['existing payment', 'eligible payment', 'pharmacy', 'admin']) {
        const context = await browser.newContext({ viewport: { width, height: 900 } });
        const page = await context.newPage();
        const errors = []; const logs = []; const posts = []; let updated;
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => logs.push(message.text()));
        await context.route('**/api/**', async route => {
          const request = route.request(); const path = new URL(request.url()).pathname;
          let body = {}; let status = 200;
          if (path === '/api/auth/me') {
            // Match the real id contract and delay restoration to exercise /dashboard.
            await new Promise(resolve => setTimeout(resolve, 150));
            body = { user: { id: 'u1', role: scenario === 'admin' ? 'admin' : scenario === 'pharmacy' ? 'pharmacy' : 'patient', name: 'Fixture user', email: 'fixture@example.invalid' } };
          } else if (path === '/api/payments' && request.method() === 'POST') {
            posts.push(request.postDataJSON()); status = 409; body = { message: 'Fixture payment request rejected.' };
          } else if (path === '/api/payments/mine') body = { payments: scenario === 'existing payment' ? [payment] : [] };
          else if (path === '/api/appointments/mine') body = { appointments: [appointment] };
          else if (path === '/api/admin/doctors/d1' && request.method() === 'PATCH') { updated = request.postDataJSON(); body = { doctor: { ...doctor, ...updated } }; }
          else if (path === '/api/admin/doctors') body = { doctors: [doctor] };
          else if (path === '/api/admin/stats') body = { stats: { doctors: 1, patients: 0, appointments: 0, activeDoctors: 1, verifiedDoctors: 1 } };
          else if (path === '/api/payments/admin') body = { payments: [], totals: {} };
          else if (path.includes('unread-count')) body = { unreadCount: 0 };
          await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
        });
        if (scenario.includes('payment')) {
          await page.goto(origin + '/dashboard/patient/payments?appointment=a1');
          const button = page.getByRole('button', { name: 'Create payment request', exact: true });
          await button.waitFor();
          if (scenario === 'existing payment') {
            assert.equal(await page.locator('select').first().inputValue(), '');
            assert.equal(await button.isEnabled(), false);
            assert.equal(posts.length, 0);
          } else {
            await page.waitForFunction(() => document.querySelector('select')?.value === 'a1');
            await button.click();
            await page.getByText('Fixture payment request rejected.', { exact: true }).waitFor();
            assert.equal(posts.length, 1); assert.equal(posts[0].appointmentId, 'a1');
            assert.ok(!logs.some(message => message.includes('Could not create payment:')));
          }
        } else if (scenario === 'pharmacy') {
          await page.goto(origin + '/dashboard');
          await page.waitForURL('**/verification');
          await page.getByPlaceholder('RX-MZ-2026-009812').waitFor();
        } else {
          await page.goto(origin + '/dashboard');
          await page.waitForURL('**/admin');
          await page.getByTitle('Edit doctor', { exact: true }).click();
          assert.equal(await page.getByLabel('Consultation fee', { exact: true }).inputValue(), '30');
          await page.getByLabel('Consultation fee', { exact: true }).fill('45.50');
          await page.getByLabel('Currency', { exact: true }).selectOption('ZWG');
          await page.getByRole('button', { name: 'Save changes', exact: true }).click();
          await page.waitForFunction(() => !document.querySelector('[name="medilink-doctor-consultation-fee"]'));
          assert.equal(updated.consultationFee, 45.5); assert.equal(updated.currency, 'ZWG');
        }
        assert.deepEqual(errors, [], scenario);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, scenario + ' overflow');
        await context.close(); checked++;
      }
    }
    console.log(JSON.stringify({ passed: checked, widths: [390, 1440], fixturesOnly: true }));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
