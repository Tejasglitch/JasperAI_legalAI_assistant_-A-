const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['public', 'legal', 'judiciary'],
    default: 'public'
  },
  aadhaarNumber: {
    type: String,
    trim: true,
    sparse: true  // Allows null values but still enforces uniqueness
  },
  bciId: {
    type: String,
    trim: true,
    sparse: true
  },
  govId: {
    type: String,
    trim: true,
    sparse: true
  },
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date
  },
  created: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  profileData: {
    address: String,
    city: String,
    state: String,
    pincode: String,
    preferredLanguage: String
  },
  settings: {
    notifications: {
      type: Boolean,
      default: true
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    fontSize: {
      type: String,
      default: 'medium'
    }
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  lastFailedLogin: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
UserSchema.methods.comparePassword = async function(password) {
  try {
    return await bcrypt.compare(password, this.passwordHash);
  } catch (error) {
    throw error;
  }
};

// Generate a unique userId
UserSchema.pre('save', function(next) {
  if (this.userId) return next();
  
  // Create a userId based on role and timestamp
  const rolePrefix = {
    'public': 'PUB',
    'legal': 'LEG',
    'judiciary': 'JUD'
  }[this.role];
  
  const timestamp = Math.floor(Date.now() / 1000).toString(36);
  const random = Math.floor(Math.random() * 10000).toString(36);
  
  this.userId = `${rolePrefix}-${timestamp}-${random}`.toUpperCase();
  next();
});

module.exports = mongoose.model('User', UserSchema);