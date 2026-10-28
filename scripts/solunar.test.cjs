'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {resolve} = require('node:path');
const vm = require('node:vm');
const {dateKey, forecast, stars} = require('../family/solunar.js');
const {generate, mallorcaDate} = require('./generate-solunar.cjs');

test('Mallorca changes date in Europe/Madrid, including summer time and year end', () => {
  for (const [instant, expected] of [
    ['2026-10-25T22:30:00Z', '2026-10-25'],
    ['2026-10-25T23:30:00Z', '2026-10-26'],
    ['2026-06-30T22:30:00Z', '2026-07-01'],
    ['2026-12-31T23:30:00Z', '2027-01-01']
  ]) {
    assert.equal(dateKey(new Date(instant)), expected);
    assert.equal(mallorcaDate(new Date(instant)), expected);
  }
});

test('Generated Mallorca dates remain consecutive across daylight saving changes', () => {
  const original = process.env.TZ;
  const data = generate('2027-03-26');
  assert.equal(process.env.TZ, original, 'engine must restore the host timezone');
  assert.equal(data.timeZone, 'Europe/Madrid');
  assert.deepEqual(data.location, {name: 'Mallorca', latitude: 39.65, longitude: 3});
  assert.equal(data.days.length, 402);
  assert.equal(new Set(data.days.map(row => row[0])).size, 402);
  for (let index = 0; index < data.days.length; index++) {
    assert.equal(data.days[index][0], new Date(Date.parse('2027-03-24T00:00:00Z') + index * 86400000).toISOString().slice(0, 10));
    assert.ok(stars(data.days[index][1]) >= 1 && stars(data.days[index][1]) <= 5);
  }
});

test('Published data can be read offline; forecasts expire without fabricated stars', () => {
  const context = {window: {}};
  vm.runInNewContext(readFileSync(resolve(__dirname, '../solunar-data.js'), 'utf8'), context);
  const data = JSON.parse(JSON.stringify(context.window.BC_SOLUNAR_DATA));
  const available = forecast(data, new Date(`${data.generatedFor}T12:00:00Z`));
  assert.equal(available.length, 28);
  assert.equal(available[0][0], data.generatedFor);
  assert.deepEqual(forecast(data, new Date('2100-01-01T12:00:00Z')), []);
  assert.deepEqual(forecast({...data, timeZone: 'UTC'}, new Date(`${data.generatedFor}T12:00:00Z`)), []);
  const broken = structuredClone(data);
  broken.days.splice(5, 1);
  assert.deepEqual(forecast(broken, new Date(`${data.generatedFor}T12:00:00Z`)), []);
  assert.equal(stars(NaN), null);
});
