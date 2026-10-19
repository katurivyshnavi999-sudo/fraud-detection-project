/**
 * Re-exporting from complete Indian Administrative Geographies dataset.
 * Maintains backwards compatibility for any components importing indianGeographies.js.
 */

export {
  GEOGRAPHY_METADATA,
  INDIAN_ADMINISTRATIVE_DATA,
  INDIAN_ADMINISTRATIVE_DATA as INDIAN_STATES_DISTRICTS,
  INDIAN_STATES_LIST,
  getAllStates,
  normalizeStatesList,
  validateGeographyDataset,
  getDistrictsForState,
  isValidDistrictForState,
  PAYMENT_CHANNELS,
  TRANSACTION_TYPES,
  MERCHANT_CATEGORIES
} from './indianAdministrativeGeographies.js';
