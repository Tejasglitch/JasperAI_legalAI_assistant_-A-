const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Public registration and login
router.post('/register', authController.register);
router.post('/login', authController.login);

// Email verification
router.post('/verify/email', authController.verifyEmail);

// Aadhaar verification
router.post('/verify/aadhaar', authController.verifyAadhaar);

// Legal professional verification
router.post('/verify/legal-passkey', authController.verifyLegalPasskey);
router.post('/verify/legal-credentials', authController.verifyLegalCredentials);
router.post('/verify/legal-hidden', authController.verifyLegalHidden);

// Judiciary member verification
router.post('/verify/judiciary-code', authController.verifyJudiciaryCode);
router.post('/verify/judiciary-credentials', authController.verifyJudiciaryCredentials);
router.post('/verify/judiciary-classified', authController.verifyJudiciaryClassified);

// Password reset
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// User profile and settings (requires authentication)
router.get('/me', verifyToken, authController.getProfile);
router.put('/me', verifyToken, authController.updateProfile);
router.put('/me/password', verifyToken, authController.changePassword);

// Logout
router.post('/logout', verifyToken, authController.logout);

module.exports = router;