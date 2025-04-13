const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load preloaded verification data
const preloadedDataPath = path.join(__dirname, '../../data/preloaded_data.json');
let preloadedData = { aadhaar: {}, bci: {}, gov: {} };

try {
  preloadedData = JSON.parse(fs.readFileSync(preloadedDataPath, 'utf8'));
} catch (error) {
  console.error('Error loading preloaded verification data:', error);
}

/**
 * Verify Aadhaar number
 * @param {string} aadhaarNumber - Aadhaar number to verify
 * @returns {boolean} Verification result
 */
exports.verifyAadhaar = (aadhaarNumber) => {
  if (!aadhaarNumber || !/^\d{12}$/.test(aadhaarNumber)) {
    return false;
  }
  
  // In a real implementation, this would call the Aadhaar API
  // For this project, check against preloaded data
  return !!preloadedData.aadhaar[aadhaarNumber];
};

/**
 * Get Aadhaar information
 * @param {string} aadhaarNumber - Aadhaar number to look up
 * @returns {object|null} Aadhaar information or null if not found
 */
exports.getAadhaarInfo = (aadhaarNumber) => {
  if (!this.verifyAadhaar(aadhaarNumber)) {
    return null;
  }
  
  return preloadedData.aadhaar[aadhaarNumber];
};

/**
 * Verify BCI ID
 * @param {string} bciId - BCI ID to verify
 * @returns {boolean} Verification result
 */
exports.verifyBciId = (bciId) => {
  if (!bciId) return false;
  
  // In a real implementation, this would call the BCI database API
  // For this project, check against preloaded data
  return !!preloadedData.bci[bciId];
};

/**
 * Check if Legal ID matches BCI ID
 * @param {string} bciId - BCI ID
 * @param {string} legalId - Legal ID
 * @returns {boolean} Verification result
 */
exports.verifyLegalId = (bciId, legalId) => {
  if (!this.verifyBciId(bciId) || !legalId) {
    return false;
  }
  
  return preloadedData.bci[bciId].legalId === legalId;
};

/**
 * Verify legal professional hidden ID
 * @param {string} bciId - BCI ID
 * @param {string} legalId - Legal ID
 * @param {string} hiddenId - Hidden ID
 * @returns {boolean} Verification result
 */
exports.verifyLegalHiddenId = (bciId, legalId, hiddenId) => {
  if (!this.verifyLegalId(bciId, legalId) || !hiddenId) {
    return false;
  }
  
  return preloadedData.bci[bciId].hiddenId === hiddenId;
};

/**
 * Verify government official ID
 * @param {string} govId - Government ID to verify
 * @returns {boolean} Verification result
 */
exports.verifyGovId = (govId) => {
  if (!govId) return false;
  
  // In a real implementation, this would call a government database API
  // For this project, check against preloaded data
  return !!preloadedData.gov[govId];
};

/**
 * Check if Secret ID matches Government ID
 * @param {string} govId - Government ID
 * @param {string} secretId - Secret Judiciary ID
 * @returns {boolean} Verification result
 */
exports.verifySecretId = (govId, secretId) => {
  if (!this.verifyGovId(govId) || !secretId) {
    return false;
  }
  
  return preloadedData.gov[govId].secretId === secretId;
};

/**
 * Verify judiciary classified ID
 * @param {string} govId - Government ID
 * @param {string} secretId - Secret Judiciary ID
 * @param {string} classifiedId - Classified ID
 * @returns {boolean} Verification result
 */
exports.verifyClassifiedId = (govId, secretId, classifiedId) => {
  if (!this.verifySecretId(govId, secretId) || !classifiedId) {
    return false;
  }
  
  return preloadedData.gov[govId].classifiedId === classifiedId;
};

/**
 * Verify special passkey
 * @param {string} passkey - Passkey to verify
 * @param {string} type - Passkey type (legal or judiciary)
 * @returns {boolean} Verification result
 */
exports.verifyPasskey = (passkey, type) => {
  if (!passkey || !type || !preloadedData.passkeys?.[type]) {
    return false;
  }
  
  return preloadedData.passkeys[type] === passkey;
};

/**
 * Generate temporary user ID for verification process
 * @param {string} type - User type
 * @returns {string} Temporary user ID
 */
exports.generateTempId = (type) => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  
  return `TEMP-${type.toUpperCase()}-${timestamp}-${random}`;
};