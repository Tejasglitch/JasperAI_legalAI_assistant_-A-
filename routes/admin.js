const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Apply verifyToken and isAdmin middleware to all admin routes
router.use(verifyToken, isAdmin);

// Dashboard statistics
router.get('/stats', adminController.getStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get('/users/:userId', adminController.getUserById);
router.post('/users', adminController.createUser);
router.put('/users/:userId', adminController.updateUser);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.delete('/users/:userId', adminController.deleteUser);

// Document management
router.get('/documents', adminController.getAllDocuments);
router.get('/documents/:docId', adminController.getDocumentById);
router.post('/documents', adminController.uploadDocument);
router.put('/documents/:docId', adminController.updateDocument);
router.delete('/documents/:docId', adminController.deleteDocument);

// Document categories and types
router.get('/document-types', adminController.getDocumentTypes);
router.get('/document-categories', adminController.getDocumentCategories);
router.post('/document-types', adminController.addDocumentType);
router.post('/document-categories', adminController.addDocumentCategory);

// Content management
router.get('/content/legal-database', adminController.getLegalDatabase);
router.get('/content/training-data', adminController.getTrainingData);
router.put('/content/training-data/:queryId', adminController.updateTrainingData);

// System configuration
router.get('/config/:configType', adminController.getConfigByType);
router.put('/config/:configType', adminController.updateConfig);

// API connections
router.get('/api-status', adminController.getApiStatus);
router.post('/api-test', adminController.testApiConnection);

// Backup and restore
router.get('/backups', adminController.getBackups);
router.post('/backups', adminController.createBackup);
router.post('/backups/:backupId/restore', adminController.restoreBackup);
router.delete('/backups/:backupId', adminController.deleteBackup);

// Activity logs
router.get('/logs', adminController.getActivityLogs);

module.exports = router;