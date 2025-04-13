const Chat = require('../models/Chat');
const Document = require('../models/Document');
const nlpProcessor = require('../utils/nlpProcessor');
const vectorSearch = require('../utils/vectorSearch');

/**
 * Get user's chat history
 * @route GET /api/chat/history
 */
exports.getChatHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get all chat history for the user
    const chats = await Chat.find({ userId })
      .sort({ lastUpdated: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get only titles of user's chat history
 * @route GET /api/chat/history-titles
 */
exports.getChatHistoryTitles = async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get only titles and IDs
    const chats = await Chat.find({ userId })
      .select('chatId title createdAt lastUpdated')
      .sort({ lastUpdated: -1 })
      .lean();
    
    res.status(200).json({
      success: true,
      data: chats
    });
  } catch (error) {
    console.error('Get chat history titles error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get specific chat by ID
 * @route GET /api/chat/:chatId
 */
exports.getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    // Find chat
    const chat = await Chat.findOne({ chatId, userId }).lean();
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    res.status(200).json({
      success: true,
      data: chat
    });
  } catch (error) {
    console.error('Get chat by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete chat
 * @route DELETE /api/chat/:chatId
 */
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    
    // Find and delete chat
    const result = await Chat.findOneAndDelete({ chatId, userId });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete chat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Send message to chatbot
 * @route POST /api/chat/send
 */
exports.sendMessage = async (req, res) => {
  try {
    const { message, chatId } = req.body;
    const userId = req.user.userId;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    // Process message with NLP
    const processedMessage = await nlpProcessor.processQuery(
      message, 
      userId, 
      req.user.role
    );
    
    let chat;
    
    // Find existing chat or create new one
    if (chatId) {
      chat = await Chat.findOne({ chatId, userId });
      
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }
    } else {
      chat = new Chat({
        userId,
        title: message.length > 30 ? message.substring(0, 30) + '...' : message,
        messages: []
      });
    }
    
    // Add user message
    chat.messages.push({
      sender: 'user',
      content: message,
      timestamp: Date.now()
    });
    
    // Add bot response
    chat.messages.push({
      sender: 'bot',
      content: processedMessage.response,
      timestamp: Date.now(),
      metadata: processedMessage.metadata
    });
    
    // Update chat
    chat.lastUpdated = Date.now();
    await chat.save();
    
    res.status(200).json({
      success: true,
      data: {
        chatId: chat.chatId,
        response: processedMessage.response,
        metadata: processedMessage.metadata
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Upload document for analysis
 * @route POST /api/chat/upload
 */
exports.uploadDocument = async (req, res) => {
  try {
    // In a real implementation, we would use middleware to handle file upload
    // For this project, we'll assume the file content is in the request body
    const { fileContent, fileName, chatId } = req.body;
    const userId = req.user.userId;
    
    if (!fileContent || !fileName) {
      return res.status(400).json({ success: false, message: 'File content and name required' });
    }
    
    // Process document
    const processedDocument = await nlpProcessor.processDocument(
      fileContent,
      fileName,
      userId,
      req.user.role
    );
    
    let chat;
    
    // Find existing chat or create new one
    if (chatId) {
      chat = await Chat.findOne({ chatId, userId });
      
      if (!chat) {
        return res.status(404).json({ success: false, message: 'Chat not found' });
      }
    } else {
      chat = new Chat({
        userId,
        title: `Document Analysis: ${fileName}`,
        messages: []
      });
    }
    
    // Add upload message
    chat.messages.push({
      sender: 'user',
      content: `Uploaded document: ${fileName}`,
      timestamp: Date.now(),
      attachments: [{
        fileName,
        fileType: fileName.split('.').pop().toLowerCase()
      }]
    });
    
    // Add bot response
    chat.messages.push({
      sender: 'bot',
      content: processedDocument.analysis,
      timestamp: Date.now(),
      metadata: processedDocument.metadata
    });
    
    // Update chat
    chat.lastUpdated = Date.now();
    await chat.save();
    
    res.status(200).json({
      success: true,
      data: {
        chatId: chat.chatId,
        analysis: processedDocument.analysis,
        metadata: processedDocument.metadata
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get document by ID
 * @route GET /api/chat/document/:docId
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { docId } = req.params;
    const userRole = req.user.role;
    
    // Find document
    const document = await Document.findOne({ docId }).lean();
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Check access level
    const accessLevels = {
      'public': 1,
      'legal': 2,
      'judiciary': 3
    };
    
    const userAccessLevel = accessLevels[userRole] || 1;
    
    if (userAccessLevel < document.accessLevel) {
      return res.status(403).json({ success: false, message: 'Insufficient access rights' });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Export chat as PDF or text
 * @route GET /api/chat/:chatId/export
 */
exports.exportChat = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { format = 'text' } = req.query;
    const userId = req.user.userId;
    
    // Find chat
    const chat = await Chat.findOne({ chatId, userId }).lean();
    
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }
    
    // In a real implementation, we would generate PDF
    // For this project, we'll just format as text
    let exportContent = `Chat: ${chat.title}\n`;
    exportContent += `Date: ${new Date(chat.createdAt).toLocaleString()}\n\n`;
    
    chat.messages.forEach(message => {
      const sender = message.sender === 'user' ? 'You' : 'Jasper AI';
      const time = new Date(message.timestamp).toLocaleTimeString();
      
      exportContent += `[${time}] ${sender}:\n${message.content}\n\n`;
    });
    
    // For text format, just send as plain text
    if (format === 'text') {
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename="chat-${chatId}.txt"`);
      return res.send(exportContent);
    }
    
    // For other formats, just return success with the content
    res.status(200).json({
      success: true,
      data: {
        content: exportContent,
        format
      }
    });
  } catch (error) {
    console.error('Export chat error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};