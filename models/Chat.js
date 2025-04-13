const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  attachments: [{
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File'
    },
    fileName: String,
    fileType: String
  }],
  metadata: {
    intent: String,
    confidence: Number,
    sources: [String] // References to legal documents
  }
});

const ChatSchema = new mongoose.Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  title: {
    type: String,
    required: true
  },
  messages: [MessageSchema],
  tags: [String], // User or auto-generated tags
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  isArchived: {
    type: Boolean,
    default: false
  }
});

// Update lastUpdated timestamp when messages are added
ChatSchema.pre('save', function(next) {
  if (this.isModified('messages')) {
    this.lastUpdated = Date.now();
  }
  next();
});

// Generate a unique chatId
ChatSchema.pre('save', function(next) {
  if (this.chatId) return next();
  
  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  const random = Math.floor(Math.random() * 10000).toString(36);
  
  this.chatId = `CHAT-${timestamp}-${random}`.toUpperCase();
  next();
});

// Generate title from first message if not provided
ChatSchema.pre('save', function(next) {
  if (this.title || !this.messages.length) return next();
  
  const firstUserMessage = this.messages.find(msg => msg.sender === 'user');
  
  if (firstUserMessage) {
    // Get first 5 words
    const words = firstUserMessage.content.split(' ');
    let title = words.slice(0, Math.min(5, words.length)).join(' ');
    
    // Add ellipsis if truncated
    if (words.length > 5) {
      title += '...';
    }
    
    this.title = title;
  } else {
    this.title = `Chat ${new Date().toLocaleString()}`;
  }
  
  next();
});

module.exports = mongoose.model('Chat', ChatSchema);