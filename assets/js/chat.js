/**
 * DOJ India AI Legal Assistant - Chat Interface Logic
 * Handles all chat functionality and interactions
 */

// DOM Elements
const chatForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.getElementById('chat-messages');
const uploadBtn = document.getElementById('upload-btn');
const voiceBtn = document.getElementById('voice-btn');
const fileUpload = document.getElementById('file-upload');
const optionsBtn = document.getElementById('options-btn');
const optionsDropdown = document.getElementById('options-dropdown');
const voiceToggle = document.getElementById('voice-toggle');
const shareBtn = document.getElementById('share-btn');
const downloadBtn = document.getElementById('download-btn');
const uploadModal = document.getElementById('upload-modal');
const closeUploadModal = document.getElementById('close-upload-modal');
const uploadArea = document.getElementById('upload-area');
const browseBtn = document.getElementById('browse-btn');
const uploadPreview = document.getElementById('upload-preview');
const uploadProgress = document.getElementById('upload-progress');
const uploadFilename = document.getElementById('upload-filename');
const uploadStatus = document.getElementById('upload-status');
const cancelUpload = document.getElementById('cancel-upload');
const submitUpload = document.getElementById('submit-upload');
const logoutBtn = document.getElementById('logout-btn');
const newChatBtn = document.getElementById('new-chat-btn');

// State
let isVoiceEnabled = false;
let isRecording = false;
let currentUpload = null;
let chatHistory = [];

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Setup event listeners
    setupEventListeners();
    
    // Handle suggestion cards
    setupSuggestionCards();
    
    // Check for user session
    checkUserSession();
});

/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Chat form submission
    chatForm.addEventListener('submit', function(e) {
        e.preventDefault();
        sendMessage();
    });
    
    // Options dropdown toggle
    optionsBtn.addEventListener('click', function() {
        optionsDropdown.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!optionsBtn.contains(e.target) && !optionsDropdown.contains(e.target)) {
            optionsDropdown.classList.remove('active');
        }
    });
    
    // Voice toggle
    voiceToggle.addEventListener('click', function(e) {
        e.preventDefault();
        isVoiceEnabled = !isVoiceEnabled;
        this.innerHTML = isVoiceEnabled ? 
            '<i class="fas fa-microphone-slash"></i> Disable Voice' : 
            '<i class="fas fa-microphone"></i> Voice Assistant';
    });
    
    // Voice input button
    voiceBtn.addEventListener('click', handleVoiceInput);
    
    // File upload button
    uploadBtn.addEventListener('click', function() {
        uploadModal.classList.add('active');
    });
    
    // Browse button
    browseBtn.addEventListener('click', function() {
        fileUpload.click();
    });
    
    // File input change
    fileUpload.addEventListener('change', handleFileSelection);
    
    // Close upload modal
    closeUploadModal.addEventListener('click', function() {
        uploadModal.classList.remove('active');
    });
    
    // Cancel upload
    cancelUpload.addEventListener('click', function() {
        uploadModal.classList.remove('active');
        resetUploadForm();
    });
    
    // Submit upload
    submitUpload.addEventListener('click', processUpload);
    
    // Drag and drop functionality
    setupDragAndDrop();
    
    // Share button
    shareBtn.addEventListener('click', shareConversation);
    
    // Download button
    downloadBtn.addEventListener('click', downloadTranscript);
    
    // Logout button
    logoutBtn.addEventListener('click', handleLogout);
    
    // New chat button
    newChatBtn.addEventListener('click', startNewChat);
}

/**
 * Setup suggestion cards for quick queries
 */
function setupSuggestionCards() {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    
    suggestionCards.forEach(card => {
        card.addEventListener('click', function() {
            const query = this.getAttribute('data-query');
            messageInput.value = query;
            sendMessage();
        });
    });
}

/**
 * Check if user is logged in
 */
function checkUserSession() {
    // In production, this would verify the JWT token and user session
    // For demonstration, we'll simulate a logged-in user
    
    // Get user info from localStorage (set during login)
    const userInfo = localStorage.getItem('userInfo');
    
    if (!userInfo) {
        // Redirect to login page if not logged in
        window.location.href = 'index.html';
    } else {
        // Parse user info and update UI
        try {
            const user = JSON.parse(userInfo);
            document.querySelector('.user-name').textContent = user.name || 'User';
            document.querySelector('.user-type').textContent = user.userType || 'Public User';
            
            // Load chat history
            loadChatHistory();
        } catch (error) {
            console.error('Error parsing user info:', error);
        }
    }
}

/**
 * Load chat history for the current user
 */
function loadChatHistory() {
    // In production, this would be an API call to fetch chat history
    // For demonstration, we'll use local storage
    
    const historyContainer = document.getElementById('chat-history');
    const emptyMessage = document.querySelector('.empty-history-message');
    
    // Get chat history from localStorage
    const storedHistory = localStorage.getItem('chatHistory');
    
    if (storedHistory) {
        try {
            chatHistory = JSON.parse(storedHistory);
            
            if (chatHistory.length > 0) {
                // Hide empty message
                emptyMessage.style.display = 'none';
                
                // Render chat history
                chatHistory.forEach((chat, index) => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'history-item';
                    historyItem.setAttribute('data-index', index);
                    
                    historyItem.innerHTML = `
                        <div class="history-icon">
                            <i class="fas fa-comment"></i>
                        </div>
                        <div class="history-details">
                            <h4>${chat.title}</h4>
                            <p>Last updated: ${formatTimestamp(chat.timestamp)}</p>
                        </div>
                    `;
                    
                    historyItem.addEventListener('click', function() {
                        loadChatSession(index);
                    });
                    
                    historyContainer.appendChild(historyItem);
                });
            }
        } catch (error) {
            console.error('Error parsing chat history:', error);
        }
    }
}

/**
 * Format timestamp to relative time
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Formatted relative time
 */
function formatTimestamp(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
        return 'Just now';
    } else if (minutes < 60) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (hours < 24) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
        return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
}

/**
 * Load a specific chat session
 * @param {number} index - Index of the chat in history
 */
function loadChatSession(index) {
    const chat = chatHistory[index];
    
    if (chat) {
        // Clear current chat
        chatMessages.innerHTML = '';
        
        // Render messages
        chat.messages.forEach(message => {
            appendMessage(message.sender, message.text, message.html);
        });
        
        // Scroll to bottom
        scrollToBottom();
    }
}

/**
 * Send a message to the chatbot
 */
function sendMessage() {
    const message = messageInput.value.trim();
    
    if (message) {
        // Append user message to chat
        appendMessage('user', message);
        
        // Clear input
        messageInput.value = '';
        
        // Focus input
        messageInput.focus();
        
        // Scroll to bottom
        scrollToBottom();
        
        // Send message to backend and get response
        processMessage(message);
    }
}

/**
 * Process the user message and get a response
 * @param {string} message - User message
 */
function processMessage(message) {
    // Show typing indicator
    showTypingIndicator();
    
    // In production, this would be an API call to process the message
    // For demonstration, we'll simulate a response after a delay
    
    setTimeout(() => {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Get simulated response
        const response = getSimulatedResponse(message);
        
        // Append bot message to chat
        appendMessage('bot', null, response);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Save to chat history
        saveChatMessage('user', message);
        saveChatMessage('bot', response, true);
        
        // Speak response if voice is enabled
        if (isVoiceEnabled) {
            speakText(stripHtml(response));
        }
    }, 1500);
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'message bot-message typing-indicator';
    typingIndicator.id = 'typing-indicator';
    
    typingIndicator.innerHTML = `
        <div class="message-avatar">
            <i class="fas fa-robot"></i>
        </div>
        <div class="message-content">
            <div class="message-text">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingIndicator);
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Append a message to the chat
 * @param {string} sender - 'user' or 'bot'
 * @param {string} text - Plain text message (for user messages)
 * @param {string} html - HTML content (for bot messages)
 */
function appendMessage(sender, text, html) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message fade-in`;
    
    let content = '';
    
    if (sender === 'user') {
        content = `
            <div class="message-avatar">
                <i class="fas fa-user"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    <p>${escapeHtml(text)}</p>
                </div>
            </div>
        `;
    } else {
        content = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content">
                <div class="message-text">
                    ${html || '<p>I\'m not sure how to respond to that.</p>'}
                </div>
            </div>
        `;
    }
    
    messageDiv.innerHTML = content;
    chatMessages.appendChild(messageDiv);
}

/**
 * Save chat message to history
 * @param {string} sender - 'user' or 'bot'
 * @param {string} content - Message content
 * @param {boolean} isHtml - Whether content is HTML
 */
function saveChatMessage(sender, content, isHtml = false) {
    // Get current chat or create new one
    let currentChat = chatHistory[0];
    
    if (!currentChat) {
        // Create new chat
        currentChat = {
            title: extractChatTitle(content),
            timestamp: Date.now(),
            messages: []
        };
        
        // Add to history
        chatHistory.unshift(currentChat);
    } else {
        // Update timestamp
        currentChat.timestamp = Date.now();
    }
    
    // Add message
    currentChat.messages.push({
        sender,
        text: isHtml ? stripHtml(content) : content,
        html: isHtml ? content : null,
        timestamp: Date.now()
    });
    
    // Save to localStorage
    localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    
    // Update UI if this is the first message in a new chat
    if (currentChat.messages.length === 2 && sender === 'bot') {
        updateChatHistoryUI(currentChat);
    }
}

/**
 * Update chat history UI with new chat
 * @param {object} chat - Chat object
 */
function updateChatHistoryUI(chat) {
    const historyContainer = document.getElementById('chat-history');
    const emptyMessage = document.querySelector('.empty-history-message');
    
    // Hide empty message
    emptyMessage.style.display = 'none';
    
    // Create history item
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item slide-up';
    historyItem.setAttribute('data-index', 0);
    
    historyItem.innerHTML = `
        <div class="history-icon">
            <i class="fas fa-comment"></i>
        </div>
        <div class="history-details">
            <h4>${chat.title}</h4>
            <p>Last updated: Just now</p>
        </div>
    `;
    
    historyItem.addEventListener('click', function() {
        loadChatSession(0);
    });
    
    // Insert at beginning
    if (historyContainer.firstChild) {
        historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    } else {
        historyContainer.appendChild(historyItem);
    }
}

/**
 * Extract a title from the first user message
 * @param {string} message - User message
 * @returns {string} Extracted title
 */
function extractChatTitle(message) {
    // Get first 3-5 words as title
    const words = message.split(' ');
    let title = words.slice(0, Math.min(5, words.length)).join(' ');
    
    // Add ellipsis if truncated
    if (words.length > 5) {
        title += '...';
    }
    
    return title;
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Strip HTML tags from string
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
function stripHtml(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Handle voice input
 */
function handleVoiceInput() {
    if (!isRecording) {
        // Check if browser supports Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            // Start recording
            startVoiceRecording();
        } else {
            alert('Voice input is not supported in your browser.');
        }
    } else {
        // Stop recording
        stopVoiceRecording();
    }
}

/**
 * Start voice recording
 */
function startVoiceRecording() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = function() {
        isRecording = true;
        voiceBtn.innerHTML = '<i class="fas fa-stop"></i>';
        voiceBtn.classList.add('recording');
        
        // Show recording indicator
        messageInput.placeholder = 'Listening...';
    };
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        messageInput.value = transcript;
    };
    
    recognition.onend = function() {
        stopVoiceRecording();
        
        // If we have text, send the message
        if (messageInput.value.trim()) {
            sendMessage();
        }
    };
    
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        stopVoiceRecording();
    };
    
    recognition.start();
}

/**
 * Stop voice recording
 */
function stopVoiceRecording() {
    isRecording = false;
    voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
    voiceBtn.classList.remove('recording');
    
    // Reset placeholder
    messageInput.placeholder = 'Type to know the legal measures...';
}

/**
 * Speak text using Speech Synthesis
 * @param {string} text - Text to speak
 */
function speakText(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

/**
 * Setup drag and drop for file uploads
 */
function setupDragAndDrop() {
    // Prevent default drag behaviors
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    // Highlight drop area when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    // Handle dropped files
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        const files = e.dataTransfer.files;
        handleFiles(files);
    }
}

/**
 * Handle file selection from input
 */
function handleFileSelection() {
    const files = fileUpload.files;
    handleFiles(files);
}

/**
 * Handle files for upload
 * @param {FileList} files - Selected files
 */
function handleFiles(files) {
    if (files.length > 0) {
        const file = files[0];
        
        // Check file type
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
        
        if (!allowedTypes.includes(file.type)) {
            alert('Please upload a PDF, DOCX, or TXT file.');
            return;
        }
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size exceeds the limit of 10MB.');
            return;
        }
        
        // Update preview
        uploadArea.style.display = 'none';
        uploadPreview.style.display = 'block';
        uploadFilename.textContent = file.name;
        uploadStatus.textContent = 'Ready to upload';
        
        // Store file
        currentUpload = file;
    }
}

/**
 * Process the uploaded file
 */
function processUpload() {
    if (!currentUpload) {
        alert('Please select a file to upload.');
        return;
    }
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        uploadProgress.style.width = `${progress}%`;
        uploadStatus.textContent = `Uploading... ${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            uploadStatus.textContent = 'Processing file...';
            
            // Simulate processing delay
            setTimeout(() => {
                // Hide modal
                uploadModal.classList.remove('active');
                
                // Reset form
                resetUploadForm();
                
                // Show message about document
                showDocumentProcessingMessage(currentUpload.name);
                
                // Clear current upload
                currentUpload = null;
            }, 1500);
        }
    }, 300);
}

/**
 * Reset the upload form
 */
function resetUploadForm() {
    uploadArea.style.display = 'block';
    uploadPreview.style.display = 'none';
    uploadProgress.style.width = '0';
    uploadStatus.textContent = 'Uploading...';
    fileUpload.value = '';
    currentUpload = null;
}

/**
 * Show message about document processing
 * @param {string} filename - Name of the uploaded file
 */
function showDocumentProcessingMessage(filename) {
    // Show typing indicator
    showTypingIndicator();
    
    // Simulate processing delay
    setTimeout(() => {
        // Hide typing indicator
        hideTypingIndicator();
        
        // Generate response about the document
        const response = `
            <h3>Document Uploaded: ${escapeHtml(filename)}</h3>
            <p>I've analyzed the document you uploaded. Here's what I found:</p>
            <ul>
                <li>Document type: Legal contract</li>
                <li>Key clauses identified: 5</li>
                <li>Potential issues found: 2</li>
            </ul>
            <p>Would you like me to explain any specific section of the document? Or do you have any questions about it?</p>
        `;
        
        // Append bot message to chat
        appendMessage('bot', null, response);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Save to chat history
        saveChatMessage('bot', response, true);
        
        // Speak response if voice is enabled
        if (isVoiceEnabled) {
            speakText(stripHtml(response));
        }
    }, 2000);
}

/**
 * Share conversation
 */
function shareConversation() {
    // In production, this would generate a shareable link
    alert('This feature would generate a shareable link to this conversation.');
}

/**
 * Download transcript
 */
function downloadTranscript() {
    // Get current chat messages
    const messages = document.querySelectorAll('.message');
    
    if (messages.length === 0) {
        alert('No messages to download.');
        return;
    }
    
    // Prepare text content
    let content = 'DOJ India AI Legal Assistant - Chat Transcript\n';
    content += '=============================================\n\n';
    content += `Date: ${new Date().toLocaleString()}\n\n`;
    
    messages.forEach(message => {
        const isUser = message.classList.contains('user-message');
        const text = message.querySelector('.message-text').textContent.trim();
        
        content += `${isUser ? 'You' : 'Jasper AI'}: ${text}\n\n`;
    });
    
    // Create download link
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `legal-chat-transcript-${Date.now()}.txt`;
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handle logout
 */
function handleLogout() {
    // Clear user data
    localStorage.removeItem('userInfo');
    
    // Redirect to login page
    window.location.href = 'index.html';
}

/**
 * Start a new chat
 */
function startNewChat() {
    // Clear chat messages
    chatMessages.innerHTML = '';
    
    // Show welcome message
    showWelcomeMessage();
}

/**
 * Show welcome message
 */
function showWelcomeMessage() {
    const welcomeMessage = `
        <h3>Welcome to Jasper, your AI-powered legal assistant!</h3>
        <p>I provide instant, accurate information on Indian law and judiciary. How can I help you today?</p>
        <div class="suggestion-cards">
            <div class="suggestion-card" data-query="Tell me about arrest rights">
                <div class="card-icon">
                    <i class="fas fa-gavel"></i>
                </div>
                <h4>Arrest Rights</h4>
                <p>Learn about your legal rights when arrested</p>
            </div>
            <div class="suggestion-card" data-query="How do I file a consumer complaint?">
                <div class="card-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <h4>Consumer Complaints</h4>
                <p>Steps to file a consumer complaint</p>
            </div>
            <div class="suggestion-card" data-query="How to file an FIR?">
                <div class="card-icon">
                    <i class="fas fa-clipboard-list"></i>
                </div>
                <h4>Filing an FIR</h4>
                <p>Process and requirements for filing an FIR</p>
            </div>
            <div class="suggestion-card" data-query="Property registration process">
                <div class="card-icon">
                    <i class="fas fa-home"></i>
                </div>
                <h4>Property Registration</h4>
                <p>Required documents and process</p>
            </div>
        </div>
    `;
    
    appendMessage('bot', null, welcomeMessage);
    
    // Setup suggestion cards
    setupSuggestionCards();
}

/**
 * Get simulated response based on user query
 * @param {string} message - User message
 * @returns {string} HTML response
 */
function getSimulatedResponse(message) {
    // Convert to lowercase for easy matching
    const query = message.toLowerCase();
    
    // Arrest rights information
    if (query.includes('arrest') || query.includes('rights') || query.includes('detained')) {
        return `
            <h3>Your Rights When Arrested in India</h3>
            <p>Under Indian law, particularly Article 22 of the Constitution and the Code of Criminal Procedure (CrPC), you have the following rights when arrested:</p>
            <ol>
                <li><strong>Right to know the grounds of arrest</strong>: The police must inform you why you're being arrested.</li>
                <li><strong>Right to legal representation</strong>: You have the right to consult and be defended by a lawyer of your choice.</li>
                <li><strong>Right to be produced before a magistrate</strong>: You must be presented before the nearest magistrate within 24 hours of arrest.</li>
                <li><strong>Right against self-incrimination</strong>: You cannot be compelled to be a witness against yourself.</li>
                <li><strong>Right to medical examination</strong>: You can request a medical examination to document any injuries.</li>
            </ol>
            <p>Additionally, the Supreme Court in D.K. Basu vs. State of West Bengal established guidelines that police must follow during arrest and detention.</p>
            <p>Would you like more information on any specific aspect of arrest rights?</p>
        `;
    }
    
    // Consumer complaints
    else if (query.includes('consumer') || query.includes('complaint')) {
        return `
            <h3>Filing a Consumer Complaint in India</h3>
            <p>Under the Consumer Protection Act, 2019, you can file a complaint through these steps:</p>
            <ol>
                <li><strong>Write a formal complaint</strong>: Address it to the business/service provider detailing your grievance.</li>
                <li><strong>Gather evidence</strong>: Collect bills, warranty cards, and all correspondence.</li>
                <li><strong>Choose the appropriate forum</strong>:
                    <ul>
                        <li>District Commission: For claims up to ₹1 crore</li>
                        <li>State Commission: For claims between ₹1 crore and ₹10 crores</li>
                        <li>National Commission: For claims above ₹10 crores</li>
                    </ul>
                </li>
                <li><strong>File your complaint</strong>: Submit it along with necessary documents and prescribed fee.</li>
                <li><strong>Online filing</strong>: You can also file a complaint online through the National Consumer Disputes Redressal Commission website.</li>
            </ol>
            <p>The complaint can be filed within 2 years from the date of cause of action.</p>
            <p>Would you like information about e-filing or sample complaint formats?</p>
        `;
    }
    
    // FIR filing
    else if (query.includes('fir') || (query.includes('file') && query.includes('police'))) {
        return `
            <h3>Filing an FIR (First Information Report) in India</h3>
            <p>An FIR is the first step in the criminal justice process. Here's how to file one:</p>
            <ol>
                <li><strong>Visit the police station</strong>: Go to the station with jurisdiction where the offense occurred.</li>
                <li><strong>Provide information</strong>: Tell the officer all relevant details about the incident.</li>
                <li><strong>Review and sign</strong>: Read the FIR before signing to ensure accuracy.</li>
                <li><strong>Get a copy</strong>: You're entitled to a free copy of the FIR.</li>
            </ol>
            <p><strong>Important notes:</strong></p>
            <ul>
                <li>Police must register an FIR for cognizable offenses (serious crimes).</li>
                <li>If police refuse to file an FIR, you can:
                    <ul>
                        <li>Approach a higher police officer</li>
                        <li>Send a written complaint to the Superintendent of Police</li>
                        <li>File a complaint directly with a Magistrate under Section 156(3) CrPC</li>
                        <li>File a writ petition in the High Court</li>
                    </ul>
                </li>
                <li>Zero FIR: You can file an FIR at any police station, regardless of jurisdiction.</li>
            </ul>
            <p>Do you need information about any specific aspect of FIR filing?</p>
        `;
    }
    
    // Property registration
    else if (query.includes('property') || query.includes('registration')) {
        return `
            <h3>Property Registration Process in India</h3>
            <p>Property registration is governed by the Registration Act, 1908. Here's the general process:</p>
            <ol>
                <li><strong>Document preparation</strong>: Draft a sale deed/transfer deed with the help of a legal expert.</li>
                <li><strong>Stamp duty payment</strong>: Pay the applicable stamp duty (varies by state).</li>
                <li><strong>Registration appointment</strong>: Schedule an appointment with the Sub-Registrar's office.</li>
                <li><strong>Document submission</strong>: Submit the documents along with:
                    <ul>
                        <li>ID proof of all parties (Aadhaar, PAN, etc.)</li>
                        <li>Property documents (title deed, tax receipts)</li>
                        <li>Recent photographs</li>
                        <li>NOC from housing society/bank (if applicable)</li>
                    </ul>
                </li>
                <li><strong>Biometric verification</strong>: Provide fingerprints and photographs.</li>
                <li><strong>Registration fee payment</strong>: Pay the registration fee (typically 1% of property value).</li>
                <li><strong>Document collection</strong>: Collect the registered document after processing.</li>
            </ol>
            <p>Would you like specific information about property registration in a particular state?</p>
        `;
    }
    
    // Default response
    else {
        return `
            <p>I understand you're asking about "${escapeHtml(message)}".</p>
            <p>While I'm trained on various legal topics in Indian law, I may need more specific information to provide you with accurate assistance. Could you please provide more details about your legal query?</p>
            <p>You can ask me about:</p>
            <ul>
                <li>Criminal law matters (arrests, FIRs, bail)</li>
                <li>Civil disputes (property, contracts, family law)</li>
                <li>Consumer rights and protections</li>
                <li>Legal procedures and documentation</li>
                <li>Rights and remedies under Indian law</li>
            </ul>
        `;
    }
}