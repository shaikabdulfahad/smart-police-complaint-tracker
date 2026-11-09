import test from 'node:test';
import assert from 'node:assert/strict';
import { dict } from '../lib/i18n';
import { sendSms } from '../lib/sms';
test('English and Kannada dictionaries have identical keys', () => {
  assert.deepEqual(Object.keys(dict.en).sort(), Object.keys(dict.kn).sort());
});
test('SMS is mock by default', async () => {
  delete process.env.SMS_MODE; const r = await sendSms('9000000001', 'x'); assert.equal(r.mode, 'mock'); assert.equal(r.status, 'mock_sent');
});
test('Real SMS is blocked in DEMO_MODE even when configured', async () => {
  Object.assign(process.env, { SMS_MODE: 'real', DEMO_MODE: 'true', TWILIO_ACCOUNT_SID: 'a', TWILIO_AUTH_TOKEN: 'b', TWILIO_FROM: 'c', SMS_ALLOWLIST: '9000000001' });
  assert.equal((await sendSms('9000000001', 'x')).mode, 'mock');
});
test('Real SMS is blocked for non-allowlisted numbers', async () => {
  Object.assign(process.env, { SMS_MODE: 'real', DEMO_MODE: 'false', SMS_ALLOWLIST: '9000000001' });
  assert.equal((await sendSms('9111111111', 'x')).mode, 'mock');
});
