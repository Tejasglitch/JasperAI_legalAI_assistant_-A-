const vectorSearch = require('./vectorSearch');
const apiController = require('../controllers/apiController');

/**
 * Process user query
 * @param {string} query - User query
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {object} Processed response
 */
exports.processQuery = async (query, userId, userRole) => {
  try {
    // Extract intent and entities from query
    const analysis = await analyzeQuery(query);
    
    // Get relevant documents based on query and user access level
    let relevantDocs = await vectorSearch.searchDocuments(
      query,
      getUserAccessLevel(userRole),
      5 // Top 5 most relevant documents
    );
    
    // If no documents found, try to fetch from external APIs
    if (relevantDocs.length === 0) {
      relevantDocs = await fetchFromExternalApis(query, userRole);
    }
    
    // Generate response
    const response = generateResponse(query, analysis, relevantDocs, userRole);
    
    return {
      response,
      metadata: {
        intent: analysis.intent,
        confidence: analysis.confidence,
        sources: relevantDocs.map(doc => doc.docId || doc.id || 'external')
      }
    };
  } catch (error) {
    console.error('Error processing query:', error);
    return {
      response: "I'm sorry, I'm having difficulty processing your query right now. Please try again later.",
      metadata: {
        intent: 'error',
        confidence: 0,
        sources: []
      }
    };
  }
};

/**
 * Process uploaded document
 * @param {string} content - Document content
 * @param {string} fileName - Document file name
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {object} Document analysis
 */
exports.processDocument = async (content, fileName, userId, userRole) => {
  try {
    // Extract document information
    const documentInfo = extractDocumentInfo(content, fileName);
    
    // Generate analysis
    const analysis = generateDocumentAnalysis(documentInfo, userRole);
    
    return {
      analysis,
      metadata: {
        documentType: documentInfo.type,
        confidence: documentInfo.confidence,
        sources: []
      }
    };
  } catch (error) {
    console.error('Error processing document:', error);
    return {
      analysis: "I'm sorry, I'm having difficulty analyzing this document. Please ensure it's a valid legal document and try again.",
      metadata: {
        documentType: 'unknown',
        confidence: 0,
        sources: []
      }
    };
  }
};

/**
 * Analyze query to extract intent and entities
 * @param {string} query - User query
 * @returns {object} Query analysis
 */
async function analyzeQuery(query) {
  // In a real implementation, this would use a trained NLP model
  // For this project, we'll use a simplified rule-based approach
  
  const lowerQuery = query.toLowerCase();
  
  // Define intents and their keywords
  const intents = {
    'arrest_rights': ['arrest', 'rights', 'detained', 'custody', 'police'],
    'fir_filing': ['fir', 'file', 'complaint', 'report', 'police'],
    'property_registration': ['property', 'registration', 'sale deed', 'real estate', 'land'],
    'consumer_complaint': ['consumer', 'complaint', 'product', 'service', 'refund'],
    'legal_aid': ['legal aid', 'free', 'assistance', 'lawyer', 'advocate'],
    'general_info': []
  };
  
  // Find matching intent
  let matchedIntent = 'general_info';
  let maxMatches = 0;
  let confidence = 0.5; // Default confidence
  
  for (const [intent, keywords] of Object.entries(intents)) {
    let matches = 0;
    
    for (const keyword of keywords) {
      if (lowerQuery.includes(keyword)) {
        matches++;
      }
    }
    
    if (matches > maxMatches) {
      matchedIntent = intent;
      maxMatches = matches;
      confidence = Math.min(0.5 + (matches * 0.1), 0.95); // Increase confidence with more matches
    }
  }
  
  // Extract entities (simplified)
  const entities = [];
  
  // Look for dates
  const dateMatches = query.match(/\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}/g);
  if (dateMatches) {
    dateMatches.forEach(date => {
      entities.push({
        type: 'date',
        value: date
      });
    });
  }
  
  // Look for amounts
  const amountMatches = query.match(/₹\s*\d+(?:,\d+)*(?:\.\d+)?|\d+(?:,\d+)*(?:\.\d+)?\s*rupees/gi);
  if (amountMatches) {
    amountMatches.forEach(amount => {
      entities.push({
        type: 'amount',
        value: amount
      });
    });
  }
  
  return {
    intent: matchedIntent,
    entities,
    confidence
  };
}

/**
 * Fetch information from external APIs
 * @param {string} query - User query
 * @param {string} userRole - User role
 * @returns {Array} Relevant documents
 */
async function fetchFromExternalApis(query, userRole) {
  try {
    // Try different APIs based on the query and user role
    
    // For legal professionals and judiciary, try CrimeCheck API
    if (userRole === 'legal' || userRole === 'judiciary') {
      try {
        const crimeCheckData = await apiController.queryCrimeCheckInternal(query);
        if (crimeCheckData && crimeCheckData.length > 0) {
          return crimeCheckData;
        }
      } catch (error) {
        console.error('CrimeCheck API error:', error);
      }
    }
    
    // Try BlackBox API for legal precedents
    try {
      const precedentsData = await apiController.queryLegalPrecedentsInternal(query);
      if (precedentsData && precedentsData.length > 0) {
        return precedentsData;
      }
    } catch (error) {
      console.error('BlackBox Precedents API error:', error);
    }
    
    // Try BlackBox API for general legal data
    try {
      const legalData = await apiController.queryLegalDataInternal(query);
      if (legalData && legalData.length > 0) {
        return legalData;
      }
    } catch (error) {
      console.error('BlackBox Legal Data API error:', error);
    }
    
    // As a last resort, try Google Custom Search
    try {
      const googleResults = await apiController.queryGoogleSearchInternal(query);
      if (googleResults && googleResults.length > 0) {
        return googleResults;
      }
    } catch (error) {
      console.error('Google Search API error:', error);
    }
    
    // If all APIs fail, return empty array
    return [];
  } catch (error) {
    console.error('Error fetching from external APIs:', error);
    return [];
  }
}

/**
 * Generate response based on analysis and documents
 * @param {string} query - Original user query
 * @param {object} analysis - Query analysis
 * @param {Array} documents - Relevant documents
 * @param {string} userRole - User role
 * @returns {string} Generated response
 */
function generateResponse(query, analysis, documents, userRole) {
  // In a real implementation, this would use a more sophisticated approach
  // For this project, we'll use templates based on intent
  
  // Check if we have any documents to reference
  if (documents.length === 0) {
    return "I'm sorry, I don't have enough information to answer that question at the moment. Could you try rephrasing or asking about a different legal topic?";
  }
  
  // Generate response based on intent
  switch (analysis.intent) {
    case 'arrest_rights':
      return `
        <h3>Your Rights When Arrested in India</h3>
        <p>Based on Indian law, particularly Article 22 of the Constitution and the Criminal Procedure Code, you have the following rights when arrested:</p>
        <ul>
          <li>Right to know the grounds of arrest</li>
          <li>Right to legal representation</li>
          <li>Right to be produced before a magistrate within 24 hours</li>
          <li>Right against self-incrimination</li>
          <li>Right to inform a relative or friend about the arrest</li>
        </ul>
        <p>The police must follow the guidelines set by the Supreme Court in the D.K. Basu case.</p>
      `;
    
    case 'fir_filing':
      return `
        <h3>How to File an FIR in India</h3>
        <p>Here's the process for filing a First Information Report (FIR):</p>
        <ol>
          <li>Visit the police station that has jurisdiction over the area where the incident occurred</li>
          <li>Provide all relevant details to the officer in charge</li>
          <li>The officer will record your statement and prepare the FIR</li>
          <li>Review the FIR before signing it</li>
          <li>Obtain a free copy of the FIR (this is your right)</li>
        </ol>
        <p>If the police refuse to file your FIR, you can approach a higher officer, send a written complaint to the Superintendent of Police, or approach a magistrate under Section 156(3) of the CrPC.</p>
      `;
    
    case 'property_registration':
      return `
        <h3>Property Registration Process in India</h3>
        <p>The property registration process typically involves these steps:</p>
        <ol>
          <li>Draft and review the sale deed with legal assistance</li>
          <li>Pay stamp duty (which varies by state)</li>
          <li>Schedule an appointment with the Sub-Registrar's office</li>
          <li>Submit the documents along with ID proof, property papers, and photographs</li>
          <li>Complete biometric verification</li>
          <li>Pay registration fee (typically 1% of property value)</li>
          <li>Collect the registered document</li>
        </ol>
        <p>Required documents typically include the sale deed, previous title deeds, tax receipts, and ID proofs.</p>
      `;
    
    case 'consumer_complaint':
      return `
        <h3>Filing a Consumer Complaint in India</h3>
        <p>Under the Consumer Protection Act, 2019, you can file a complaint through these steps:</p>
        <ol>
          <li>Write a formal complaint to the business/service provider</li>
          <li>Gather evidence including bills, warranty cards, and correspondence</li>
          <li>Choose the appropriate forum based on claim amount:
            <ul>
              <li>District Commission (up to ₹1 crore)</li>
              <li>State Commission (₹1 crore to ₹10 crores)</li>
              <li>National Commission (above ₹10 crores)</li>
            </ul>
          </li>
          <li>Submit your complaint with necessary documents and fee</li>
          <li>Alternatively, file online through the NCDRC website</li>
        </ol>
        <p>The complaint must be filed within 2 years from the date of cause of action.</p>
      `;
    
    case 'legal_aid':
      return `
        <h3>Legal Aid in India</h3>
        <p>Legal Services Authorities provide free legal aid to eligible individuals:</p>
        <ul>
          <li>Women and children</li>
          <li>Members of Scheduled Castes/Scheduled Tribes</li>
          <li>Victims of disasters, trafficking, or disabilities</li>
          <li>Industrial workmen</li>
          <li>Persons in custody</li>
          <li>Those with annual income below specified limits</li>
        </ul>
        <p>You can approach the nearest Legal Services Authority, legal aid clinic, or Lok Adalat. Contact the National Legal Services Authority (NALSA) for more information.</p>
      `;
    
    default:
      // Default response using information from the documents
      let response = `<p>Based on the information I have:</p><ul>`;
      
      // Extract key points from documents (simplified)
      documents.slice(0, 3).forEach(doc => {
        const content = doc.content || doc.description || doc.summary || doc.snippet || '';
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20).slice(0, 2);
        
        sentences.forEach(sentence => {
          response += `<li>${sentence.trim()}.</li>`;
        });
      });
      
      response += `</ul><p>Is there anything specific you'd like to know more about?</p>`;
      
      return response;
  }
}

/**
 * Extract document information
 * @param {string} content - Document content
 * @param {string} fileName - Document file name
 * @returns {object} Document information
 */
function extractDocumentInfo(content, fileName) {
  // In a real implementation, this would use advanced document processing
  // For this project, we'll use a simplified approach
  
  // Detect document type from file extension and content
  let documentType = 'unknown';
  let confidence = 0.5;
  
  const fileExt = fileName.split('.').pop().toLowerCase();
  const lowerContent = content.toLowerCase();
  
  if (fileExt === 'pdf' || fileExt === 'docx' || fileExt === 'doc') {
    // Check content for keywords to determine document type
    if (lowerContent.includes('agreement') || lowerContent.includes('contract')) {
      documentType = 'contract';
      confidence = 0.8;
    } else if (lowerContent.includes('petition') || lowerContent.includes('court')) {
      documentType = 'court_filing';
      confidence = 0.8;
    } else if (lowerContent.includes('deed') || lowerContent.includes('property')) {
      documentType = 'property_document';
      confidence = 0.8;
    } else if (lowerContent.includes('will') || lowerContent.includes('testament')) {
      documentType = 'will';
      confidence = 0.8;
    }
  }
  
  // Extract key sections and information (simplified)
  const sections = [];
  const paragraphs = content.split('\n\n');
  
  paragraphs.forEach((para, index) => {
    if (para.trim().length > 50) {
      sections.push({
        index,
        content: para.trim(),
        isHeading: para.length < 100 && (para.toUpperCase() === para || para.endsWith(':'))
      });
    }
  });
  
  return {
    type: documentType,
    fileName,
    fileType: fileExt,
    sections,
    confidence,
    wordCount: content.split(/\s+/).length
  };
}

/**
 * Generate document analysis
 * @param {object} documentInfo - Document information
 * @param {string} userRole - User role
 * @returns {string} Document analysis
 */
function generateDocumentAnalysis(documentInfo, userRole) {
  // In a real implementation, this would provide a comprehensive analysis
  // For this project, we'll return a template based on document type
  
  let analysis = `
    <h3>Document Analysis: ${documentInfo.fileName}</h3>
    <p>I've analyzed the document you uploaded. Here's what I found:</p>
    <ul>
      <li>Document type: ${formatDocumentType(documentInfo.type)}</li>
      <li>File format: ${documentInfo.fileType.toUpperCase()}</li>
      <li>Word count: ${documentInfo.wordCount}</li>
  `;
  
  // Add more details based on document type
  switch (documentInfo.type) {
    case 'contract':
      analysis += `
        <li>This appears to be a legal contract or agreement</li>
        <li>Key sections identified: ${documentInfo.sections.filter(s => s.isHeading).length}</li>
        <li>Potential clauses to review: Liability, termination, governing law</li>
      </ul>
      <p>Would you like me to analyze any specific section or clause in detail?</p>
      `;
      break;
    
    case 'court_filing':
      analysis += `
        <li>This appears to be a court filing or legal petition</li>
        <li>Key sections identified: ${documentInfo.sections.filter(s => s.isHeading).length}</li>
        <li>Contains references to legal statutes and possibly case law</li>
      </ul>
      <p>Would you like me to summarize the main arguments or identify the relevant laws mentioned?</p>
      `;
      break;
    
    case 'property_document':
      analysis += `
        <li>This appears to be a property-related document</li>
        <li>Key sections identified: ${documentInfo.sections.filter(s => s.isHeading).length}</li>
        <li>Contains property description and possibly ownership details</li>
      </ul>
      <p>Would you like me to extract the key details such as property boundaries or transaction terms?</p>
      `;
      break;
    
    case 'will':
      analysis += `
        <li>This appears to be a will or testament</li>
        <li>Key sections identified: ${documentInfo.sections.filter(s => s.isHeading).length}</li>
        <li>Contains beneficiary information and asset distribution</li>
      </ul>
      <p>Would you like me to summarize the main provisions or beneficiary information?</p>
      `;
      break;
    
    default:
      analysis += `
        <li>The document contains ${documentInfo.sections.length} major sections</li>
        <li>Legal context requires further analysis</li>
      </ul>
      <p>Would you like me to explain any specific part of this document in more detail?</p>
      `;
  }
  
  return analysis;
}

/**
 * Format document type for display
 * @param {string} type - Document type
 * @returns {string} Formatted document type
 */
function formatDocumentType(type) {
  switch (type) {
    case 'contract':
      return 'Legal Contract';
    case 'court_filing':
      return 'Court Filing';
    case 'property_document':
      return 'Property Document';
    case 'will':
      return 'Will/Testament';
    default:
      return 'Legal Document';
  }
}

/**
 * Get numeric access level from user role
 * @param {string} userRole - User role
 * @returns {number} Access level
 */
function getUserAccessLevel(userRole) {
  const accessLevels = {
    'public': 1,
    'legal': 2,
    'judiciary': 3
  };
  
  return accessLevels[userRole] || 1;
}