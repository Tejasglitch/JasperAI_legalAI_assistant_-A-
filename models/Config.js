const mongoose = require('mongoose');
const crypto = require('crypto');

const ConfigSchema = new mongoose.Schema({
  configType: {
    type: String,
    required: true
  },
  key: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  encryptedValue: {
    type: String
  },
  description: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    ref: 'User'
  },
  environment: {
    type: String,
    enum: ['development', 'testing', 'production'],
    default: 'development'
  },
  isSecret: {
    type: Boolean,
    default: false
  }
});

// Create a compound index for configType and key for faster lookups
ConfigSchema.index({ configType: 1, key: 1 }, { unique: true });

// Encrypt sensitive values
ConfigSchema.pre('save', function(next) {
  if (this.isSecret && !this.isModified('value')) {
    return next();
  }
  
  if (this.isSecret) {
    try {
      const algorithm = 'aes-256-ctr';
      const secretKey = process.env.CONFIG_ENCRYPTION_KEY || 'default-config-encryption-key';
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
      const encrypted = Buffer.concat([
        cipher.update(JSON.stringify(this.value)),
        cipher.final()
      ]);
      
      this.encryptedValue = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
      this.value = undefined;
    } catch (error) {
      return next(error);
    }
  }
  
  next();
});

// Decrypt sensitive values when accessed
ConfigSchema.methods.getDecryptedValue = function() {
  if (!this.isSecret || !this.encryptedValue) {
    return this.value;
  }
  
  try {
    const algorithm = 'aes-256-ctr';
    const secretKey = process.env.CONFIG_ENCRYPTION_KEY || 'default-config-encryption-key';
    
    const [ivHex, encryptedHex] = this.encryptedValue.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    
    const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return JSON.parse(decrypted.toString());
  } catch (error) {
    console.error('Error decrypting config value:', error);
    return null;
  }
};

// Static method to get config value by type and key
ConfigSchema.statics.getConfig = async function(configType, key) {
  const config = await this.findOne({ configType, key });
  if (!config) return null;
  
  if (config.isSecret) {
    return config.getDecryptedValue();
  }
  return config.value;
};

// Static method to set config value
ConfigSchema.statics.setConfig = async function(configType, key, value, options = {}) {
  const { description, updatedBy, environment, isSecret } = options;
  
  try {
    const config = await this.findOneAndUpdate(
      { configType, key },
      {
        value,
        description,
        updatedBy,
        environment,
        isSecret,
        lastUpdated: Date.now()
      },
      { upsert: true, new: true }
    );
    
    return config;
  } catch (error) {
    console.error('Error saving config:', error);
    throw error;
  }
};

module.exports = mongoose.model('Config', ConfigSchema);