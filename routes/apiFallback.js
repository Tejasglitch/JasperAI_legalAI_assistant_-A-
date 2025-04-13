const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const { verifyToken, checkAccess } = require('../middleware/auth');

// Apply verifyToken middleware to all fallback routes
router.use(verifyToken);

// CrimeCheck API fallback
router.post('/crime-check', checkAccess('legal'), apiController.queryCrimeCheck);

// BlackBox API fallback for legal data
router.post('/blackbox/precedents', apiController.queryLegalPrecedents);
router.post('/blackbox/legal-data', apiController.queryLegalData);

// Google Custom Search fallback
router.post('/google-search', apiController.queryGoogleSearch);

// News API for legal updates
router.get('/legal-news', apiController.getLegalNews);

module.exports = router;