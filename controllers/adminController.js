const User = require('../models/User');
const Document = require('../models/Document');
const Config = require('../models/Config');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const axios = require('axios');

/**
 * Get dashboard statistics
 * @route GET /api/admin/stats
 */
exports.getStats = async (req, res) => {
  try {
    // Get user statistics
    const userStats = {
      total: await User.countDocuments({}),
      active: await User.countDocuments({ status: 'active' }),
      suspended: await User.countDocuments({ status: 'suspended' }),
      publicUsers: await User.countDocuments({ role: 'public' }),
      legalUsers: await User.countDocuments({ role: 'legal' }),
      judiciaryUsers: await User.countDocuments({ role: 'judiciary' })
    };
    
    // Get document statistics
    const documentStats = {
      total: await Document.countDocuments({}),
      published: await Document.countDocuments({ status: 'published' }),
      draft: await Document.countDocuments({ status: 'draft' }),
      archived: await Document.countDocuments({ status: 'archived' }),
      public: await Document.countDocuments({ accessLevel: 1 }),
      legal: await Document.countDocuments({ accessLevel: 2 }),
      judiciary: await Document.countDocuments({ accessLevel: 3 })
    };
    
    // Get document types statistics
    const documentTypes = await Document.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);
    
    // Get recent activity
    const recentUsers = await User.find({})
      .sort({ created: -1 })
      .limit(5)
      .select('name email role status created')
      .lean();
    
    const recentDocuments = await Document.find({})
      .sort({ uploadDate: -1 })
      .limit(5)
      .select('title documentType category accessLevel uploadDate')
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        userStats,
        documentStats,
        documentTypes,
        recentUsers,
        recentDocuments
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get all users
 * @route GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total matching users
    const total = await User.countDocuments(query);
    
    // Get users with pagination
    const users = await User.find(query)
      .sort({ created: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get user by ID
 * @route GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId }).lean();
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create a new user
 * @route POST /api/admin/users
 */
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    
    // Create new user
    const user = new User({
      name,
      email,
      passwordHash: password, // will be hashed by pre-save hook
      phone,
      role: role || 'public',
      isVerified: true, // Admin-created users are automatically verified
      status: 'active'
    });
    
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update a user
 * @route PUT /api/admin/users/:userId
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, status, profileData } = req.body;
    
    // Find user
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (role) user.role = role;
    if (status) user.status = status;
    if (profileData) user.profileData = { ...user.profileData, ...profileData };
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update user status
 * @route PUT /api/admin/users/:userId/status
 */
exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Valid status required' });
    }
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      { userId },
      { status },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a user
 * @route DELETE /api/admin/users/:userId
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find and delete user
    const result = await User.findOneAndDelete({ userId });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get all documents
 * @route GET /api/admin/documents
 */
exports.getAllDocuments = async (req, res) => {
  try {
    const { type, category, accessLevel, status, search, page = 1, limit = 10 } = req.query;
    
    // Build query
    const query = {};
    
    if (type) {
      query.documentType = type;
    }
    
    if (category) {
      query.category = category;
    }
    
    if (accessLevel) {
      query.accessLevel = parseInt(accessLevel);
    }
    
    if (status) {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'metadata.keywords': { $regex: search, $options: 'i' } }
      ];
    }
    
    // Count total matching documents
    const total = await Document.countDocuments(query);
    
    // Get documents with pagination
    const documents = await Document.find(query)
      .sort({ uploadDate: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean();
    
    res.status(200).json({
      success: true,
      data: {
        documents,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get document by ID
 * @route GET /api/admin/documents/:docId
 */
exports.getDocumentById = async (req, res) => {
  try {
    const { docId } = req.params;
    
    const document = await Document.findOne({ docId }).lean();
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Upload a new document
 * @route POST /api/admin/documents
 */
exports.uploadDocument = async (req, res) => {
  try {
    const { title, documentType, category, accessLevel, content, metadata } = req.body;
    
    // Create new document
    const document = new Document({
      title,
      documentType,
      category,
      accessLevel: parseInt(accessLevel) || 1,
      content,
      metadata,
      uploadedBy: req.user.userId,
      status: 'published'
    });
    
    await document.save();
    
    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        docId: document.docId,
        title: document.title
      }
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update a document
 * @route PUT /api/admin/documents/:docId
 */
exports.updateDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    const { title, documentType, category, accessLevel, content, metadata, status } = req.body;
    
    // Find document
    const document = await Document.findOne({ docId });
    
    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    // Update fields
    if (title) document.title = title;
    if (documentType) document.documentType = documentType;
    if (category) document.category = category;
    if (accessLevel) document.accessLevel = parseInt(accessLevel);
    if (content) document.content = content;
    if (metadata) document.metadata = { ...document.metadata, ...metadata };
    if (status) document.status = status;
    
    await document.save();
    
    res.status(200).json({
      success: true,
      message: 'Document updated successfully'
    });
  } catch (error) {
    console.error('Update document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a document
 * @route DELETE /api/admin/documents/:docId
 */
exports.deleteDocument = async (req, res) => {
  try {
    const { docId } = req.params;
    
    // Find and delete document
    const result = await Document.findOneAndDelete({ docId });
    
    if (!result) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }
    
    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get document types
 * @route GET /api/admin/document-types
 */
exports.getDocumentTypes = async (req, res) => {
  try {
    // Get all unique document types
    const types = await Document.distinct('documentType');
    
    res.status(200).json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('Get document types error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get document categories
 * @route GET /api/admin/document-categories
 */
exports.getDocumentCategories = async (req, res) => {
  try {
    // Get all unique document categories
    const categories = await Document.distinct('category');
    
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Get document categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Add a new document type
 * @route POST /api/admin/document-types
 */
exports.addDocumentType = async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ success: false, message: 'Document type is required' });
    }
    
    // Check if type already exists
    const existingTypes = await Document.distinct('documentType');
    if (existingTypes.includes(type)) {
      return res.status(400).json({ success: false, message: 'Document type already exists' });
    }
    
    // For demonstration, we'll create a sample document with the new type
    const sampleDocument = new Document({
      title: `Sample ${type}`,
      documentType: type,
      category: 'Other',
      accessLevel: 1,
      content: `This is a sample document of type "${type}"`,
      uploadedBy: req.user.userId,
      status: 'draft'
    });
    
    await sampleDocument.save();
    
    res.status(201).json({
      success: true,
      message: 'Document type added successfully',
      data: { type }
    });
  } catch (error) {
    console.error('Add document type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Add a new document category
 * @route POST /api/admin/document-categories
 */
exports.addDocumentCategory = async (req, res) => {
  try {
       const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ success: false, message: 'Document category is required' });
    }
    
    // Check if category already exists
    const existingCategories = await Document.distinct('category');
    if (existingCategories.includes(category)) {
      return res.status(400).json({ success: false, message: 'Document category already exists' });
    }
    
    // For demonstration, we'll create a sample document with the new category
    const sampleDocument = new Document({
      title: `Sample ${category} Document`,
      documentType: 'other',
      category: category,
      accessLevel: 1,
      content: `This is a sample document in the "${category}" category`,
      uploadedBy: req.user.userId,
      status: 'draft'
    });
    
    await sampleDocument.save();
    
    res.status(201).json({
      success: true,
      message: 'Document category added successfully',
      data: { category }
    });
  } catch (error) {
    console.error('Add document category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get legal database status
 * @route GET /api/admin/content/legal-database
 */
exports.getLegalDatabase = async (req, res) => {
  try {
    // Get statistics about the legal database
    const stats = {
      totalDocuments: await Document.countDocuments({}),
      documentsByType: {},
      documentsByCategory: {},
      documentsByAccessLevel: {
        public: await Document.countDocuments({ accessLevel: 1 }),
        legal: await Document.countDocuments({ accessLevel: 2 }),
        judiciary: await Document.countDocuments({ accessLevel: 3 })
      },
      lastUpdated: new Date(),
      storageUsed: '45.2 MB' // In a real app, this would be calculated
    };
    
    // Get document counts by type
    const typeStats = await Document.aggregate([
      { $group: { _id: '$documentType', count: { $sum: 1 } } }
    ]);
    
    typeStats.forEach(stat => {
      stats.documentsByType[stat._id] = stat.count;
    });
    
    // Get document counts by category
    const categoryStats = await Document.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    
    categoryStats.forEach(stat => {
      stats.documentsByCategory[stat._id] = stat.count;
    });
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get legal database error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get NLP training data
 * @route GET /api/admin/content/training-data
 */
exports.getTrainingData = async (req, res) => {
  try {
    // In a real app, this would fetch NLP training data from a database or file
    // For demonstration, return sample data
    const trainingData = {
      intents: [
        { name: 'arrest_rights', samples: 25, accuracy: 92.5 },
        { name: 'fir_filing', samples: 18, accuracy: 88.7 },
        { name: 'property_registration', samples: 30, accuracy: 94.1 },
        { name: 'consumer_complaint', samples: 22, accuracy: 90.3 },
        { name: 'legal_aid', samples: 15, accuracy: 85.9 }
      ],
      entities: [
        { name: 'date', samples: 120, accuracy: 97.2 },
        { name: 'location', samples: 85, accuracy: 92.8 },
        { name: 'person', samples: 110, accuracy: 90.5 },
        { name: 'organization', samples: 95, accuracy: 88.9 },
        { name: 'legal_term', samples: 150, accuracy: 93.4 }
      ],
      lastTrained: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      overallAccuracy: 91.8
    };
    
    res.status(200).json({
      success: true,
      data: trainingData
    });
  } catch (error) {
    console.error('Get training data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update NLP training data
 * @route PUT /api/admin/content/training-data/:queryId
 */
exports.updateTrainingData = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { intent, entities, correctResponse } = req.body;
    
    // In a real app, this would update the training data in a database
    // For demonstration, return a success response
    
    res.status(200).json({
      success: true,
      message: 'Training data updated successfully',
      data: {
        queryId,
        intent,
        entities,
        correctResponse
      }
    });
  } catch (error) {
    console.error('Update training data error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get system configuration by type
 * @route GET /api/admin/config/:configType
 */
exports.getConfigByType = async (req, res) => {
  try {
    const { configType } = req.params;
    
    if (!configType) {
      return res.status(400).json({ success: false, message: 'Configuration type is required' });
    }
    
    // Find all configurations of the specified type
    const configs = await Config.find({ configType }).lean();
    
    // Transform array to object with key-value pairs
    const configData = {};
    
    configs.forEach(config => {
      configData[config.key] = config.isSecret ? '[PROTECTED]' : config.value;
    });
    
    res.status(200).json({
      success: true,
      data: {
        type: configType,
        config: configData
      }
    });
  } catch (error) {
    console.error('Get config by type error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Update system configuration
 * @route PUT /api/admin/config/:configType
 */
exports.updateConfig = async (req, res) => {
  try {
    const { configType } = req.params;
    const { key, value, description, isSecret } = req.body;
    
    if (!configType || !key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Configuration type, key, and value are required' });
    }
    
    // Update configuration
    await Config.setConfig(configType, key, value, {
      description,
      updatedBy: req.user.userId,
      environment: process.env.NODE_ENV || 'development',
      isSecret: isSecret || false
    });
    
    res.status(200).json({
      success: true,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get API connection status
 * @route GET /api/admin/api-status
 */
exports.getApiStatus = async (req, res) => {
  try {
    // Get API configurations
    const apiConfigs = await Config.find({ configType: 'api' }).lean();
    
    // Initialize status object
    const apiStatus = {};
    
    // Check each API connection
    for (const config of apiConfigs) {
      const apiKey = config.key;
      let status = 'unknown';
      let lastChecked = null;
      let error = null;
      
      try {
        // Try to connect to the API
        switch (apiKey) {
          case 'crimecheck':
            // Simulate API check
            status = Math.random() > 0.2 ? 'online' : 'offline';
            break;
          case 'blackbox':
            status = Math.random() > 0.2 ? 'online' : 'offline';
            break;
          case 'google':
            status = Math.random() > 0.2 ? 'online' : 'offline';
            break;
          case 'news':
            status = Math.random() > 0.2 ? 'online' : 'offline';
            break;
          default:
            status = 'unknown';
        }
        
        lastChecked = new Date();
      } catch (err) {
        status = 'error';
        error = err.message;
        lastChecked = new Date();
      }
      
      apiStatus[apiKey] = {
        status,
        lastChecked,
        error
      };
    }
    
    res.status(200).json({
      success: true,
      data: apiStatus
    });
  } catch (error) {
    console.error('Get API status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Test API connection
 * @route POST /api/admin/api-test
 */
exports.testApiConnection = async (req, res) => {
  try {
    const { apiKey, testQuery } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'API key is required' });
    }
    
    // Get API configuration
    const apiConfig = await Config.getConfig('api', apiKey);
    
    if (!apiConfig) {
      return res.status(404).json({ success: false, message: 'API configuration not found' });
    }
    
    // Test API connection based on key
    let testResult = null;
    
    switch (apiKey) {
      case 'crimecheck':
        // Simulate API test
        testResult = {
          success: true,
          responseTime: Math.floor(Math.random() * 500) + 100, // 100-600ms
          data: { message: 'Connection successful' }
        };
        break;
      case 'blackbox':
        testResult = {
          success: true,
          responseTime: Math.floor(Math.random() * 500) + 100,
          data: { message: 'Connection successful' }
        };
        break;
      case 'google':
        testResult = {
          success: true,
          responseTime: Math.floor(Math.random() * 500) + 100,
          data: { message: 'Connection successful' }
        };
        break;
      case 'news':
        testResult = {
          success: true,
          responseTime: Math.floor(Math.random() * 500) + 100,
          data: { message: 'Connection successful' }
        };
        break;
      default:
        return res.status(400).json({ success: false, message: 'Unsupported API key' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        apiKey,
        testQuery,
        result: testResult
      }
    });
  } catch (error) {
    console.error('Test API connection error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get system backups
 * @route GET /api/admin/backups
 */
exports.getBackups = async (req, res) => {
  try {
    // In a real app, this would list actual backups
    // For demonstration, return sample backup data
    const backups = [
      {
        id: 'backup-001',
        name: 'Daily Backup',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        size: '128.5 MB',
        type: 'automatic'
      },
      {
        id: 'backup-002',
        name: 'Weekly Backup',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        size: '256.2 MB',
        type: 'automatic'
      },
      {
        id: 'backup-003',
        name: 'Pre-Update Backup',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        size: '201.8 MB',
        type: 'manual'
      }
    ];
    
    res.status(200).json({
      success: true,
      data: backups
    });
  } catch (error) {
    console.error('Get backups error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Create a new backup
 * @route POST /api/admin/backups
 */
exports.createBackup = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // In a real app, this would create an actual backup
    // For demonstration, return a success response
    
    const backup = {
      id: `backup-${Date.now().toString(36)}`,
      name: name || `Manual Backup ${new Date().toLocaleDateString()}`,
      description,
      date: new Date(),
      size: `${Math.floor(Math.random() * 300) + 100} MB`,
      type: 'manual'
    };
    
    res.status(201).json({
      success: true,
      message: 'Backup created successfully',
      data: backup
    });
  } catch (error) {
    console.error('Create backup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Restore from backup
 * @route POST /api/admin/backups/:backupId/restore
 */
exports.restoreBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    // In a real app, this would restore from a backup
    // For demonstration, return a success response after a delay
    
    // Simulate restore process
    setTimeout(() => {
      res.status(200).json({
        success: true,
        message: 'Backup restored successfully',
        data: {
          backupId,
          restoreDate: new Date()
        }
      });
    }, 2000);
  } catch (error) {
    console.error('Restore backup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Delete a backup
 * @route DELETE /api/admin/backups/:backupId
 */
exports.deleteBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    
    // In a real app, this would delete an actual backup
    // For demonstration, return a success response
    
    res.status(200).json({
      success: true,
      message: 'Backup deleted successfully',
      data: {
        backupId
      }
    });
  } catch (error) {
    console.error('Delete backup error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/**
 * Get activity logs
 * @route GET /api/admin/logs
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { type, user, page = 1, limit = 20 } = req.query;
    
    // In a real app, this would fetch logs from a database
    // For demonstration, return sample logs
    
    const logs = [
      {
        id: 'log-001',
        type: 'user',
        action: 'login',
        user: 'admin@doj.gov.in',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        details: 'Admin user login from 192.168.1.1'
      },
      {
        id: 'log-002',
        type: 'document',
        action: 'create',
        user: 'admin@doj.gov.in',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        details: 'Created document: Consumer Protection Act, 2019'
      },
      {
        id: 'log-003',
        type: 'system',
        action: 'config',
        user: 'admin@doj.gov.in',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        details: 'Updated API configuration for BlackBox'
      }
    ];
    
    // Filter logs by type
    let filteredLogs = logs;
    if (type) {
      filteredLogs = logs.filter(log => log.type === type);
    }
    
    // Filter logs by user
    if (user) {
      filteredLogs = filteredLogs.filter(log => log.user.includes(user));
    }
    
    res.status(200).json({
      success: true,
      data: {
        logs: filteredLogs,
        pagination: {
          total: filteredLogs.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredLogs.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};