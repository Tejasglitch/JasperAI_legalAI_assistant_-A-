const Document = require('../models/Document');

/**
 * Generate embedding for text query
 * @param {string} text - Text to generate embedding for
 * @returns {Array} Embedding vector
 */
exports.generateEmbedding = async (text) => {
  // In a real implementation, this would call an embedding model API
  // For this project, we'll use a simplified mock embedding
  
  // Create a deterministic vector based on the text
  // This is NOT a real embedding, just a simulation for the project
  const vector = [];
  const hash = simpleHash(text.toLowerCase());
  
  // Generate 128-dimensional vector
  for (let i = 0; i < 128; i++) {
    // Generate value between -1 and 1 based on the hash and position
    const value = Math.sin(hash * (i + 1) * 0.01) * Math.cos(i * 0.05);
    vector.push(value);
  }
  
  return vector;
};

/**
 * Search documents based on query embedding
 * @param {string} query - User query
 * @param {number} accessLevel - User access level
 * @param {number} limit - Maximum number of results
 * @returns {Array} Matching documents
 */
exports.searchDocuments = async (query, accessLevel, limit = 5) => {
  try {
    // In a real implementation, this would use vector similarity search
    // For this project, we'll use a simplified keyword search
    
    // Clean query for search
    const searchTerms = query.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)            // Split into words
      .filter(term => term.length > 3); // Filter out short words
    
    // Find documents that match the search terms and access level
    const documents = await Document.find({
      accessLevel: { $lte: accessLevel },
      status: 'published',
      $or: [
        { title: { $regex: searchTerms.join('|'), $options: 'i' } },
        { content: { $regex: searchTerms.join('|'), $options: 'i' } },
        { 'metadata.keywords': { $in: searchTerms } }
      ]
    })
    .limit(limit)
    .lean();
    
    return documents;
  } catch (error) {
    console.error('Error searching documents:', error);
    return [];
  }
};

/**
 * Search for similar documents
 * @param {Array} embedding - Document embedding
 * @param {number} accessLevel - User access level
 * @param {number} limit - Maximum number of results
 * @returns {Array} Similar documents
 */
exports.findSimilarDocuments = async (embedding, accessLevel, limit = 5) => {
  try {
    // In a real implementation, this would use vector similarity search
    // For this project, we'll return random documents as a placeholder
    
    const documents = await Document.find({
      accessLevel: { $lte: accessLevel },
      status: 'published'
    })
    .limit(limit)
    .lean();
    
    return documents;
  } catch (error) {
    console.error('Error finding similar documents:', error);
    return [];
  }
};

/**
 * Calculate cosine similarity between two vectors
 * @param {Array} vector1 - First vector
 * @param {Array} vector2 - Second vector
 * @returns {number} Similarity score (0-1)
 */
function cosineSimilarity(vector1, vector2) {
  if (vector1.length !== vector2.length) {
    throw new Error('Vectors must have the same dimension');
  }
  
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;
  
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    magnitude1 += vector1[i] * vector1[i];
    magnitude2 += vector2[i] * vector2[i];
  }
  
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Generate a simple hash code for a string
 * @param {string} str - String to hash
 * @returns {number} Hash code
 */
function simpleHash(str) {
  let hash = 0;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash;
}