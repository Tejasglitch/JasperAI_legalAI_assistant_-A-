const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { verifyToken, checkAccess } = require('../middleware/auth');

// Apply verifyToken middleware to all chat routes
router.use(verifyToken);

// Chat history endpoints
router.get('/history', chatController.getChatHistory);
router.get('/history-titles', chatController.getChatHistoryTitles);
router.get('/:chatId', chatController.getChatById);
router.delete('/:chatId', chatController.deleteChat);

// Send message to chatbot
router.post('/send', chatController.sendMessage);

// Upload document for analysis
router.post('/upload', chatController.uploadDocument);

// Document retrieval
router.get('/document/:docId', chatController.getDocumentById);

// Export chat as PDF or text
router.get('/:chatId/export', chatController.exportChat);

module.exports = router;