const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

function loadUtility(name, dependencies = {}, timers = {}) {
  const filename = path.join(__dirname, '../src/utils', name + '.ts');
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const module = { exports: {} };
  const resolve = name => {
    if (!(name in dependencies)) throw new Error('Unexpected import: ' + name);
    return dependencies[name];
  };
  new Function('module', 'exports', 'require', 'setTimeout', 'clearTimeout', compiled)(
    module, module.exports, resolve, timers.setTimeout || setTimeout, clearTimeout
  );
  return module.exports;
}
const { normalizeLoyalty, normalizeVoucher } = loadUtility('loyalty');
const { apiErrorMessage } = loadUtility('apiError');

test('loyalty response from the active API displays progress and remaining coins', () => {
  const result = normalizeLoyalty({ loyalty_points: 10, points: 10, check_ins_count: 2, progress_to_free_entry: 40, recent_check_ins: [] });
  assert.equal(result.points, 10);
  assert.equal(result.check_ins_count, 2);
  assert.equal(result.progress_to_next_reward, 40);
  assert.equal(result.points_needed, 15);
  assert.equal(result.rewards_earned, undefined); // Do not invent a total absent from the API.
});

test('loyalty progress is bounded at the reward threshold', () => {
  assert.equal(normalizeLoyalty({ points: 50 }).progress_to_next_reward, 100);
  assert.equal(normalizeLoyalty({ points: 50 }).points_needed, 0);
  assert.equal(normalizeLoyalty({ points: NaN }).points, 0);
  assert.equal(normalizeLoyalty({ points: -1 }).points, 0);
});

test('voucher ID is preserved exactly for the QR and manual entry', () => {
  assert.deepEqual(normalizeVoucher({ id: 'Abc-def', user_id: 'user', used: false }), { id: 'Abc-def', code: 'Abc-def', used: false });
  assert.equal(normalizeVoucher({ code: 'not-an-id' }), null);
  assert.equal(normalizeVoucher({ id: 'used', used: true }), null);
  assert.equal(normalizeVoucher({ id: 'expired', expires_at: '2000-01-01T00:00:00Z' }), null);
  assert.equal(normalizeVoucher(null), null);
});

test('FastAPI validation errors become readable text instead of [object Object]', () => {
  assert.equal(apiErrorMessage({ response: { data: { detail: [{ loc: ['body', 'email'], msg: 'Invalid email' }] } } }, 'Retry'), 'Invalid email');
  assert.equal(apiErrorMessage({ response: { data: { detail: 'Already claimed' } } }, 'Retry'), 'Already claimed');
  assert.equal(apiErrorMessage(null, 'Retry'), 'Retry');
});

test('song requests forward coordinates after permission is granted', async () => {
  const { getRequestLocation } = loadUtility('requestLocation', { 'expo-location': {
    Accuracy: { High: 4 }, requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: async () => ({ coords: { latitude: 50.8486, longitude: 4.3722 } }),
  } });
  assert.deepEqual(await getRequestLocation(), { latitude: '50.8486', longitude: '4.3722' });
});

test('denied location permission never fabricates venue coordinates', async () => {
  const { getRequestLocation } = loadUtility('requestLocation', { 'expo-location': {
    requestForegroundPermissionsAsync: async () => ({ status: 'denied' }),
    getCurrentPositionAsync: () => { throw new Error('Must not request a position'); },
  } });
  assert.deepEqual(await getRequestLocation(), { latitude: null, longitude: null });
});

test('location timeout releases the song form without bypassing the server check', async () => {
  const { getRequestLocation } = loadUtility('requestLocation', { 'expo-location': {
    Accuracy: { High: 4 }, requestForegroundPermissionsAsync: async () => ({ status: 'granted' }),
    getCurrentPositionAsync: () => new Promise(() => {}),
  } }, { setTimeout: callback => setTimeout(callback, 0) });
  assert.deepEqual(await getRequestLocation(), { latitude: null, longitude: null });
});
