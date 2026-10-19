import assert from 'node:assert';
import {
  GEOGRAPHY_METADATA,
  INDIAN_ADMINISTRATIVE_DATA,
  INDIAN_STATES_DISTRICTS,
  INDIAN_STATES_LIST,
  getAllStates,
  normalizeStatesList,
  validateGeographyDataset,
  getDistrictsForState,
  isValidDistrictForState
} from './indianGeographies.js';

console.log('--- STARTING INDIAN GEOGRAPHIES VERIFICATION TESTS ---');

// Test 1: INDIAN_STATES_LIST is an Array and array methods work
assert(Array.isArray(INDIAN_STATES_LIST), 'INDIAN_STATES_LIST must be an Array');
assert.strictEqual(typeof INDIAN_STATES_LIST.filter, 'function', 'INDIAN_STATES_LIST.filter must be a function');
assert.strictEqual(typeof INDIAN_STATES_LIST.map, 'function', 'INDIAN_STATES_LIST.map must be a function');

const filtered = INDIAN_STATES_LIST.filter(s => s.toLowerCase().includes('andhra'));
assert.strictEqual(filtered.length, 1, 'Filter for andhra should return 1 result');
assert.strictEqual(filtered[0], 'Andhra Pradesh');
console.log('✓ Test 1 Passed: INDIAN_STATES_LIST is an Array and filter/map work properly.');

// Test 2: Complete 28 states and 8 union territories preserved
assert.strictEqual(GEOGRAPHY_METADATA.total_states, 28, 'Metadata total_states must be 28');
assert.strictEqual(GEOGRAPHY_METADATA.total_union_territories, 8, 'Metadata total_union_territories must be 8');
assert(INDIAN_STATES_LIST.length >= 36, `Must contain at least 36 state/UT entries, got ${INDIAN_STATES_LIST.length}`);
assert(INDIAN_STATES_LIST.includes('Andhra Pradesh'), 'Must include Andhra Pradesh');
assert(INDIAN_STATES_LIST.includes('Maharashtra'), 'Must include Maharashtra');
assert(INDIAN_STATES_LIST.includes('Delhi'), 'Must include Delhi');
assert(INDIAN_STATES_LIST.includes('Ladakh'), 'Must include Ladakh');
assert(INDIAN_STATES_LIST.includes('Jammu and Kashmir'), 'Must include Jammu and Kashmir');
assert(INDIAN_STATES_LIST.includes('Puducherry'), 'Must include Puducherry');
assert(INDIAN_STATES_LIST.includes('Unknown / Not Provided'), 'Must include fallback Unknown / Not Provided');
console.log(`✓ Test 2 Passed: Preserved complete entities (${INDIAN_STATES_LIST.length} total, 28 states + 8 UTs + fallback).`);

// Test 3: Andhra Pradesh includes Nellore using official naming
const apDistricts = getDistrictsForState('Andhra Pradesh');
assert(Array.isArray(apDistricts), 'Andhra Pradesh districts must be an Array');
assert(
  apDistricts.includes('Nellore (Sri Potti Sriramulu Nellore)'),
  "Andhra Pradesh must include 'Nellore (Sri Potti Sriramulu Nellore)'"
);
console.log('✓ Test 3 Passed: Andhra Pradesh verified with official Nellore naming.');

// Test 4: Dependent district validation and fallback behavior
assert.strictEqual(isValidDistrictForState('Andhra Pradesh', 'Nellore (Sri Potti Sriramulu Nellore)'), true);
assert.strictEqual(isValidDistrictForState('Andhra Pradesh', 'Pune'), false);
assert.strictEqual(isValidDistrictForState('Maharashtra', 'Pune'), true);
assert.strictEqual(isValidDistrictForState('Karnataka', 'Bengaluru Urban'), true);
assert.deepStrictEqual(getDistrictsForState('NonExistentState'), ['Unknown / Not Provided']);
assert.deepStrictEqual(getDistrictsForState(''), ['Unknown / Not Provided']);
assert.deepStrictEqual(getDistrictsForState(null), ['Unknown / Not Provided']);
console.log('✓ Test 4 Passed: Dependent state/district lookup and validation verified.');

// Test 5: Dataset validation runner
const validationResult = validateGeographyDataset(INDIAN_ADMINISTRATIVE_DATA);
assert.strictEqual(validationResult.isValid, true);
assert.strictEqual(validationResult.errors.length, 0);

// Test invalid dataset detection
const invalidDatasetResult = validateGeographyDataset({ 'Sample State': 'not an array' });
assert.strictEqual(invalidDatasetResult.isValid, false);
assert(invalidDatasetResult.errors.length > 0, 'Invalid dataset should return errors');
console.log('✓ Test 5 Passed: validateGeographyDataset correctly passes valid data and flags corrupted data.');

// Test 6: normalizeStatesList handling various shapes
// Case A: function source
const fromFunc = normalizeStatesList(() => ['State A', 'State B']);
assert.deepStrictEqual(fromFunc, ['State A', 'State B']);

// Case B: object map { State: [districts] }
const fromMap = normalizeStatesList({ 'Goa': ['North Goa'], 'Bihar': ['Patna'] });
assert.deepStrictEqual(fromMap, ['Bihar', 'Goa']);

// Case C: object with { states: [...] }
const fromStatesObj = normalizeStatesList({ states: ['Kerala', 'Punjab'] });
assert.deepStrictEqual(fromStatesObj, ['Kerala', 'Punjab']);

// Case D: array of records { name: '...' }
const fromRecords = normalizeStatesList([{ name: 'Assam' }, { state: 'Gujarat' }, { label: 'Haryana' }]);
assert.deepStrictEqual(fromRecords, ['Assam', 'Gujarat', 'Haryana']);

// Case E: null/undefined fallback
const fromNull = normalizeStatesList(null);
assert(Array.isArray(fromNull));
assert(fromNull.includes('Andhra Pradesh'));
console.log('✓ Test 6 Passed: normalizeStatesList successfully normalizes all shapes (functions, objects, arrays, records, nulls).');

console.log('--- ALL GEOGRAPHY VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
