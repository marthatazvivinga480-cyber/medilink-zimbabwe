import { startTestEnvironment } from './test-environment.mjs';
const environment = await startTestEnvironment(5001);
console.log(`TEST ONLY API: ${environment.origin}/api`);
console.log('Temporary MongoDB: medilink_test. All data is disposable.');
console.log('Synthetic accounts: patient, doctor, admin, pharmacy @medilink-test.invalid');
console.log(`Password for these temporary accounts only: ${environment.password}`);
console.log('Keep this terminal open. Ctrl+C stops the API and removes the temporary database.');
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  await environment.stop();
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
