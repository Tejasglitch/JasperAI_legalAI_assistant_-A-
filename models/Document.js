const mongoose = require('mongoose');

const ChunkSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    startIndex: Number,
    endIndex: Number,
    section: String
  }
});

const DocumentSchema = new mongoose.Schema({
  docId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  documentType: {
    type: String,
    enum: ['act', 'judgment', 'circular', 'notification', 'form', 'template', 'other'],
    required: true
  },
  category: {
    type: String,
    required: true
  },
  accessLevel: {
    type: Number, // 1: Public, 2: Legal, 3: Judiciary
    required: true,
    default: 1
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    author: String,
    datePublished: Date,
    jurisdiction: String,
    keywords: [String],
    citations: [String],
    sections: [String],
    summary: String
  },
  fileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File'
  },
  embedding: [Number], // Document-level embedding
  chunks: [ChunkSchema],
  title:String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  }
});

// Update lastUpdated timestamp
DocumentSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.lastUpdated = Date.now();
    
    // Increment version if content changes
    if (this.isModified('content')) {
      this.version += 1;
    }
  }
  next();
});

// Generate a unique docId
DocumentSchema.pre('save', function(next) {
  if (this.docId) return next();
  
  // Create a prefix based on document type
  const typePrefix = {
    'act': 'ACT',
    'judgment': 'JDG',
    'circular': 'CIR',
    'notification': 'NOT',
    'form': 'FRM',
    'template': 'TPL',
    'other': 'DOC'
  }[this.documentType] || 'DOC';
  
  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  const random = Math.floor(Math.random() * 10000).toString(36);
  
  this.docId = `${typePrefix}-${timestamp}-${random}`.toUpperCase();
  next();
});

module.exports = mongoose.model('Document', DocumentSchema);