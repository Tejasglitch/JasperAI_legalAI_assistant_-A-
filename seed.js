const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '../.env' });

// Import models
const User = require('../backend/models/User');
const Document = require('../backend/models/Document');
const Chat = require('../backend/models/Chat');
const Config = require('../backend/models/Config');

// Load preloaded data
const preloadedDataPath = path.join(__dirname, '../data/preloaded_data.json');
let preloadedData = { aadhaar: {}, bci: {}, gov: {} };

try {
  preloadedData = JSON.parse(fs.readFileSync(preloadedDataPath, 'utf8'));
} catch (error) {
  console.error('Error loading preloaded verification data:', error);
  process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jasper-legal-assistant', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected for seeding');
  seedDatabase();
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Seed the database with initial data
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Document.deleteMany({});
    await Chat.deleteMany({});
    await Config.deleteMany({});
    
    console.log('Existing data cleared');
    
    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@doj.gov.in',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'judiciary',
      userId:'JUD-' + Date.now().toString(36) + '-' +Math.random().toString(36).substr(2,5),
      isVerified: true,
      govId: 'GOV12345',
      status: 'active'
    });
    
    await adminUser.save();
    console.log('Admin user created');
    
    // Create sample users from preloaded data
    const users = [];
    
    // Public users
    for (const aadhaarId in preloadedData.aadhaar) {
      const aadhaarInfo = preloadedData.aadhaar[aadhaarId];
      
      const user = new User({
        name: aadhaarInfo.name,
        email: aadhaarInfo.name.toLowerCase().replace(' ', '.') + '@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        phone: aadhaarInfo.phone,
        role: 'public',
        userId: 'PUB-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        aadhaarNumber: aadhaarId,
        isVerified: true,
        status: 'active'
      });
      
      users.push(user);
    }
    
    // Legal professionals
    for (const bciId in preloadedData.bci) {
      const bciInfo = preloadedData.bci[bciId];
      
      const user = new User({
        name: bciInfo.name,
        email: bciInfo.email,
        passwordHash: await bcrypt.hash('legal123', 10),
        phone: bciInfo.phone,
        role: 'legal',
        userId: 'LEG-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        bciId: bciId,
        isVerified: true,
        status: 'active'
      });
      
      users.push(user);
    }
    
    // Judiciary members
    for (const govId in preloadedData.gov) {
      if (govId === 'GOV12345') continue; // Skip the admin user
      
      const govInfo = preloadedData.gov[govId];
      
      const user = new User({
        name: govInfo.name,
        email: govInfo.email,
        passwordHash: await bcrypt.hash('judiciary123', 10),
        phone: govInfo.phone,
        role: 'judiciary',
        userId: 'JUD-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        govId: govId,
        isVerified: true,
        status: 'active'
      });
      
      users.push(user);
    }
    
    await User.insertMany(users);
    console.log(`${users.length} sample users created`);
    
    // Create sample documents - USING STATIC CONTENT INSTEAD OF READING FILES
    // This avoids issues with missing files
    const documents = [
      {
        title: 'Indian Penal Code (IPC)',
        documentType: 'act',
        category: 'Criminal Law',
        accessLevel: 1, // Public
        docId: 'ACT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        content: "THE INDIAN PENAL CODE, 1860 ACT NO. 45 OF 1860 [6th October, 1860]\n\nCHAPTER I INTRODUCTION\n\n1. Title and extent of operation of the Code.—This Act shall be called the Indian Penal Code, and shall extend to the whole of India except the State of Jammu and Kashmir.",
        metadata: {
          author: 'Government of India',
          datePublished: new Date('1860-10-06'),
          jurisdiction: 'India',
          keywords: ['criminal', 'penal', 'code', 'law', 'offence'],
          sections: ['Section 1', 'Section 2', 'Section 3']
        },
        uploadedBy: adminUser._id,
        status: 'published'
      },
      {
        title: 'Consumer Protection Act, 2019',
        documentType: 'act',
        category: 'Consumer Law',
        accessLevel: 1, // Public
        docId: 'ACT-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        content: "THE CONSUMER PROTECTION ACT, 2019 ACT NO. 35 OF 2019 [9th August, 2019]\n\nAn Act to provide for protection of the interests of consumers and for the said purpose, to establish authorities for timely and effective administration and settlement of consumers' disputes and for matters connected therewith or incidental thereto.",
        metadata: {
          author: 'Government of India',
          datePublished: new Date('2019-08-09'),
          jurisdiction: 'India',
          keywords: ['consumer', 'protection', 'complaint', 'rights'],
          sections: ['Chapter I', 'Chapter II', 'Chapter III']
        },
        uploadedBy: adminUser._id,
        status: 'published'
      },
      {
        title: 'Supreme Court Judgment - K.S. Puttaswamy vs. Union of India',
        documentType: 'judgment',
        category: 'Constitutional Law',
        accessLevel: 2, // Legal
        docId: 'JDG-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        content: "SUPREME COURT OF INDIA Justice K.S. Puttaswamy (Retd.) vs Union Of India Writ Petition (Civil) No. 494 of 2012 Decided on: 24.08.2017\n\nJUDGMENT\n\nDr. D.Y. Chandrachud, J.\n\n1. Nine judges of this Court assembled to determine whether privacy is a constitutionally protected value. The issue reaches out to the foundation of a constitutional culture based on the protection of human rights and enables this Court to revisit the basic principles on which our Constitution has been founded and their consequences for a way of life it seeks to protect.",
        metadata: {
          author: 'Supreme Court of India',
          datePublished: new Date('2017-08-24'),
          jurisdiction: 'India',
          keywords: ['privacy', 'fundamental right', 'constitution', 'aadhaar'],
          citations: ['(2017) 10 SCC 1']
        },
        uploadedBy: adminUser._id,
        status: 'published'
      },
      {
        title: 'Confidential Judiciary Guidelines',
        documentType: 'circular',
        category: 'Judiciary',
        accessLevel: 3, // Judiciary
        docId: 'CIR-' + Date.now().toString(36) + '-' + Math.random().toString(36).substr(2, 5),
        content: "CONFIDENTIAL INTERNAL JUDICIARY GUIDELINES SUPREME COURT OF INDIA January 15, 2022\n\nSECTION A: CASE ALLOCATION AND MANAGEMENT\n\n1. Case Assignment Principles\n   1.1 Cases shall be assigned to judges based on subject matter expertise, workload distribution, and potential conflicts of interest.\n   1.2 The Chief Justice of India shall maintain the primary responsibility for case allocation.",
        metadata: {
          author: 'Supreme Court of India',
          datePublished: new Date('2022-01-15'),
          jurisdiction: 'India',
          keywords: ['judiciary', 'guidelines', 'confidential', 'procedure'],
          sections: ['Section A', 'Section B', 'Section C']
        },
        uploadedBy: adminUser._id,
        status: 'published'
      }
    ];
    
    for (const doc of documents) {
      const document = new Document(doc);
      await document.save();
    }
    
    console.log(`${documents.length} sample documents created`);
    
    // Create system configurations
    const configs = [
      {
        configType: 'api',
        key: 'crimecheck',
        value: {
          url: 'https://api.crimecheck.example.com',
          apikey:'',
          enabled: true
        },
        description: 'CrimeCheck API configuration',
        updatedBy: adminUser._id,
        environment: 'development'
      },
      {
        configType: 'api',
        key: 'blackbox',
        value: {
          url: 'https://api.blackbox.example.com',
          apikey:'',
          enabled: true
        },
        description: 'BlackBox API configuration',
        updatedBy: adminUser._id,
        environment: 'development'
      },
      {
        configType: 'api',
        key: 'google',
        value: {
          url: 'https://www.googleapis.com/customsearch/v1',
          apikey:'',
          enabled: true
        },
        description: 'Google Custom Search API configuration',
        updatedBy: adminUser._id,
        environment: 'development'
      },
      {
        configType: 'api',
        key: 'news',
        value: {
          url: 'https://newsapi.org/v2',
          apiKey: 'your_news_api_key', 
          enabled: true
        },
        description: 'News API configuration',
        updatedBy: adminUser._id,
        environment: 'development'
     },
      {
        configType: 'security',
        key: 'maxLoginAttempts',
        value: 5,
        description: 'Maximum number of failed login attempts before account lockout',
        updatedBy: adminUser._id,
        environment: 'development'
      },
      {
        configType: 'security',
        key: 'jwtExpiryHours',
        value: 24,
        description: 'JWT token expiry time in hours',
        updatedBy: adminUser._id,
        environment: 'development'
      }
    ];
    
    for (const config of configs) {
      await Config.setConfig(config.configType, config.key, config.value, {
        description: config.description,
        updatedBy: config.updatedBy,
        environment: config.environment
      });
    }
    
    console.log(`${configs.length} system configurations created`);
    
    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}