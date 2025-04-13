/**
 * DOJ India AI Legal Assistant - Simplified Authentication Logic
 */

// Admin password
const ADMIN_PASSWORD = "Zefolicus-trident@123";

// Special passkeys
const LEGAL_PASSKEY = "legalpass123";
const JUDICIARY_CODE = "judiciarypass456";

document.addEventListener('DOMContentLoaded', function() {
    // Tab switching logic
    initTabSwitching();
    
    // Form submission handlers
    document.getElementById('signup-btn').addEventListener('click', handleAccess);
    document.getElementById('login-btn').addEventListener('click', handleLogin);
    document.getElementById('admin-login-btn').addEventListener('click', handleAdminLogin);
    
    // Switch between login and signup links
    const switchToLoginLinks = document.querySelectorAll('.switch-to-login');
    switchToLoginLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.tab[data-tab="login"]').click();
        });
    });
    
    const switchToSignupLinks = document.querySelectorAll('.switch-to-signup');
    switchToSignupLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            document.querySelector('.tab[data-tab="signup"]').click();
        });
    });
    
    // Forgot password handler
    document.getElementById('forgot-password').addEventListener('click', function(e) {
        e.preventDefault();
        alert('Password reset functionality would be implemented here.');
    });
});

/**
 * Initialize tab switching between login, signup, and admin
 */
function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all forms
            document.querySelectorAll('.form').forEach(f => f.classList.remove('active'));
            
            // Show selected form
            const formId = this.getAttribute('data-tab') + '-form';
            document.getElementById(formId).classList.add('active');
        });
    });
}

/**
 * Handle access button click
 * This function handles all types of access (public signup, legal admin, judiciary)
 */
function handleAccess() {
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const phone = document.getElementById('signup-phone').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;
    
    // CASE 1: Legal Professional - only confirm password field is filled with passkey
    if (!name && !email && !phone && !password && confirmPassword === LEGAL_PASSKEY) {
        // Direct access to chat for legal professionals
        localStorage.setItem('userInfo', JSON.stringify({
            name: 'Legal Professional',
            userType: 'legal',
            role: 'legal'
        }));
        
        window.location.href = 'chat.html';
        return;
    }
    
    // CASE 2: Judiciary Member - only password field is filled with secret code
    if (!name && !email && !phone && password === JUDICIARY_CODE && !confirmPassword) {
        // Direct access to chat for judiciary
        localStorage.setItem('userInfo', JSON.stringify({
            name: 'Judiciary Member',
            userType: 'judiciary',
            role: 'judiciary'
        }));
        
        window.location.href = 'chat.html';
        return;
    }
    
    // CASE 3: Normal public user signup - all fields should be filled
    if (!name || !email || !phone || !password || !confirmPassword) {
        showNotification('signup-notification', 'Please fill in all fields', 'error');
        
        // Clear all fields to restart
        clearAllFields();
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('signup-notification', 'Passwords do not match', 'error');
        
        // Clear password fields
        document.getElementById('signup-password').value = '';
        document.getElementById('signup-confirm-password').value = '';
        return;
    }
    
    // Register public user and redirect to chat
    registerPublicUser(name, email, phone, password);
}

/**
 * Clear all input fields
 */
function clearAllFields() {
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-phone').value = '';
    document.getElementById('signup-password').value = '';
    document.getElementById('signup-confirm-password').value = '';
}

/**
 * Register public user
 * @param {string} name - User's full name
 * @param {string} email - User's email
 * @param {string} phone - User's phone number
 * @param {string} password - User's password
 */
function registerPublicUser(name, email, phone, password) {
    // For demonstration, just store in localStorage and redirect
    localStorage.setItem('userInfo', JSON.stringify({
        name: name,
        email: email,
        phone: phone,
        userType: 'public',
        role: 'public'
    }));
    
    // Show success and redirect
    showNotification('signup-notification', 'Account created successfully! Redirecting...', 'success');
    
    setTimeout(() => {
        window.location.href = 'chat.html';
    }, 1500);
}

/**
 * Handle login form submission (for public users only)
 */
function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        showNotification('login-notification', 'Please fill in all fields', 'error');
        return;
    }
    
    // Simulate login (in a real app, this would check against database)
    const storedUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    
    if (storedUser.email === email) {
        // Login successful
        showNotification('login-notification', 'Login successful! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'chat.html';
        }, 1500);
    } else {
        showNotification('login-notification', 'Invalid credentials', 'error');
    }
}

/**
 * Handle admin login
 */
function handleAdminLogin() {
    const adminPassword = document.getElementById('admin-password').value;
    
    if (adminPassword === ADMIN_PASSWORD) {
        // Set admin session
        localStorage.setItem('adminToken', 'admin-logged-in');
        
        // Redirect to admin panel
        window.location.href = 'admin.html';
    } else {
        showNotification('admin-notification', 'Invalid admin password', 'error');
    }
}

/**
 * Show notification message
 * @param {string} id - ID of the notification element
 * @param {string} message - Message to display
 * @param {string} type - Type of notification ('success' or 'error')
 */
function showNotification(id, message, type) {
    const notification = document.getElementById(id);
    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}