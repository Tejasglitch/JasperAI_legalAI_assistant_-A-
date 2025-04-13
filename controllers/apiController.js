const axios = require('axios');
const config = require('../config/config');
const Config = require('../models/Config');

/**
 * Query CrimeCheck API for legal information
 * @route POST /api/fallback/crime-check
 */
exports.queryCrimeCheck = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    
    const results = await exports.queryCrimeCheckInternal(query);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('CrimeCheck API error:', error);
    res.status(500).json({ success: false, message: 'Error querying CrimeCheck API' });
  }
};

/**
 * Internal function to query CrimeCheck API
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
exports.queryCrimeCheckInternal = async (query) => {
  try {
    // Get API config from database or use environment variables
    const apiConfig = await Config.getConfig('api', 'crimecheck') || {
      url: 'https://api.crimecheck.example.com',
      apiKey: config.api.crimecheck,
      enabled: true
    };
    
    if (!apiConfig.enabled) {
      return [];
    }
    
    // Make API request
    const response = await axios.get(`${apiConfig.url}/search`, {
      params: { q: query },
      headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` }
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('CrimeCheck API error:', error);
    return [];
  }
};

/**
 * Query BlackBox API for legal precedents
 * @route POST /api/fallback/blackbox/precedents
 */
exports.queryLegalPrecedents = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    
    const results = await exports.queryLegalPrecedentsInternal(query);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('BlackBox Precedents API error:', error);
    res.status(500).json({ success: false, message: 'Error querying BlackBox Precedents API' });
  }
};

/**
 * Internal function to query BlackBox API for legal precedents
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
exports.queryLegalPrecedentsInternal = async (query) => {
  try {
    // Get API config from database or use environment variables
    const apiConfig = await Config.getConfig('api', 'blackbox') || {
      url: 'https://api.blackbox.example.com',
      apiKey: config.api.blackbox,
      enabled: true
    };
    
    if (!apiConfig.enabled) {
      return [];
    }
    
    // Make API request
    const response = await axios.get(`${apiConfig.url}/precedents`, {
      params: { q: query },
      headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` }
    });
    
    return response.data.precedents || [];
  } catch (error) {
    console.error('BlackBox Precedents API error:', error);
    return [];
  }
};

/**
 * Query BlackBox API for general legal data
 * @route POST /api/fallback/blackbox/legal-data
 */
exports.queryLegalData = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    
    const results = await exports.queryLegalDataInternal(query);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('BlackBox Legal Data API error:', error);
    res.status(500).json({ success: false, message: 'Error querying BlackBox Legal Data API' });
  }
};

/**
 * Internal function to query BlackBox API for general legal data
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
exports.queryLegalDataInternal = async (query) => {
  try {
    // Get API config from database or use environment variables
    const apiConfig = await Config.getConfig('api', 'blackbox') || {
      url: 'https://api.blackbox.example.com',
      apiKey: config.api.blackbox,
      enabled: true
    };
    
    if (!apiConfig.enabled) {
      return [];
    }
    
    // Make API request
    const response = await axios.get(`${apiConfig.url}/legal-data`, {
      params: { q: query },
      headers: { 'Authorization': `Bearer ${apiConfig.apiKey}` }
    });
    
    return response.data.results || [];
  } catch (error) {
    console.error('BlackBox Legal Data API error:', error);
    return [];
  }
};

/**
 * Query Google Custom Search API
 * @route POST /api/fallback/google-search
 */
exports.queryGoogleSearch = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }
    
    const results = await exports.queryGoogleSearchInternal(query);
    
    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Google Search API error:', error);
    res.status(500).json({ success: false, message: 'Error querying Google Search API' });
  }
};

/**
 * Internal function to query Google Custom Search API
 * @param {string} query - Search query
 * @returns {Array} Search results
 */
exports.queryGoogleSearchInternal = async (query) => {
  try {
    // Get API config from database or use environment variables
    const apiConfig = await Config.getConfig('api', 'google') || {
      url: 'https://www.googleapis.com/customsearch/v1',
      apiKey: config.api.google.apiKey,
      searchEngineId: config.api.google.searchEngineId,
      enabled: true
    };
    
    if (!apiConfig.enabled) {
      return [];
    }
    
    // Make API request
    const response = await axios.get(apiConfig.url, {
      params: {
        key: apiConfig.apiKey,
        cx: apiConfig.searchEngineId,
        q: query + ' legal india',
        num: 10
      }
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('Google Search API error:', error);
    return [];
  }
};

/**
 * Get legal news articles
 * @route GET /api/fallback/legal-news
 */
exports.getLegalNews = async (req, res) => {
  try {
    const { category, limit = 10 } = req.query;
    
    // Get API config from database or use environment variables
    const apiConfig = await Config.getConfig('api', 'news') || {
      url: 'https://newsapi.org/v2',
      apiKey: config.api.news,
      enabled: true
    };
    
    if (!apiConfig.enabled) {
      return res.status(503).json({ success: false, message: 'News API is currently disabled' });
    }
    
    // Formulate query based on category
    let query = 'legal india law';
    if (category) {
      query += ` ${category}`;
    }
    
    // Make API request
    const response = await axios.get(`${apiConfig.url}/everything`, {
      params: {
        q: query,
        sortBy: 'publishedAt',
        pageSize: limit,
        language: 'en',
        apiKey: apiConfig.apiKey
      }
    });
    
    res.status(200).json({
      success: true,
      data: response.data.articles || []
    });
  } catch (error) {
    console.error('News API error:', error);
    res.status(500).json({ success: false, message: 'Error fetching legal news' });
  }
};