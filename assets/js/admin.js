/**
 * DOJ India AI Legal Assistant - Admin Panel Logic
 * Includes password protection and panel functionality
 */

// Constants
const ADMIN_PASSWORD = "Zefolicus-trident@123";

// DOM Elements
const adminLoginOverlay = document.getElementById('admin-login-overlay');
const adminContainer = document.getElementById('admin-container');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminPasswordInput = document.getElementById('admin-password');
const adminLoginError = document.getElementById('admin-login-error');
const sidebar = document.querySelector('.admin-sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const navItems = document.querySelectorAll('.nav-item');
const contentSections = document.querySelectorAll('.content-section');
const adminLogoutBtn = document.getElementById('admin-logout-btn');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    checkAdminAuth();
    
    // Set up password protection events
    setupPasswordProtection();
    
    // Set up admin panel events (only runs if authenticated)
    if (!adminLoginOverlay || adminLoginOverlay.style.display === 'none') {
        setupAdminPanel();
    }
});

/**
 * Check if admin is authenticated
 */
function checkAdminAuth() {
    // Check for admin token in localStorage
    if (localStorage.getItem('adminToken') === 'admin-logged-in') {
        // Hide login overlay and show admin panel
        if (adminLoginOverlay) adminLoginOverlay.style.display = 'none';
        if (adminContainer) adminContainer.style.display = 'flex';
        
        // Load admin panel data
        loadAdminData();
    }
}

/**
 * Set up password protection events
 */
function setupPasswordProtection() {
    if (adminLoginBtn) {
        // Admin login button click handler
        adminLoginBtn.addEventListener('click', function() {
            const password = adminPasswordInput.value;
            
            if (password === ADMIN_PASSWORD) {
                // Set admin token
                localStorage.setItem('adminToken', 'admin-logged-in');
                
                // Hide login overlay and show admin panel
                adminLoginOverlay.style.display = 'none';
                adminContainer.style.display = 'flex';
                
                // Load admin panel data
                loadAdminData();
            } else {
                // Show error
                adminLoginError.style.display = 'block';
                adminPasswordInput.value = '';
            }
        });
    }
    
    if (adminPasswordInput) {
        // Enter key in password field
        adminPasswordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                adminLoginBtn.click();
            }
        });
    }
    
    if (adminLogoutBtn) {
        // Logout button
        adminLogoutBtn.addEventListener('click', function() {
            localStorage.removeItem('adminToken');
            window.location.reload();
        });
    }
}

/**
 * Set up admin panel events
 */
function setupAdminPanel() {
    // Toggle sidebar
    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', toggleSidebar);
    }
    
    // Navigation items
    if (navItems) {
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const target = this.getAttribute('data-target');
                switchSection(target);
            });
        });
    }
    
    // Handle responsiveness
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);
}

/**
 * Load admin panel data
 */
function loadAdminData() {
    // Load profile
    loadAdminProfile();
    
    // Load initial section data
    loadSectionData('dashboard');
}

/**
 * Load admin profile data
 */
function loadAdminProfile() {
    const adminProfileContainer = document.getElementById('admin-profile');
    
    if (adminProfileContainer) {
        // In a real app, fetch this from the backend
        const adminData = {
            name: 'Admin User',
            role: 'System Administrator'
        };
        
        // Update DOM
        adminProfileContainer.innerHTML = `
            <div class="admin-avatar">
                <i class="fas fa-user-shield"></i>
            </div>
            <div class="admin-info">
                <h3 class="admin-name">${adminData.name}</h3>
                <p class="admin-role">${adminData.role}</p>
            </div>
        `;
    }
}

/**
 * Toggle sidebar expanded/collapsed state
 */
function toggleSidebar() {
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
}

/**
 * Handle responsive sidebar behavior
 */
function handleResponsiveSidebar() {
    if (!sidebar) return;
    
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        sidebar.classList.add('mobile');
        
        // On mobile, sidebar is hidden by default and can be toggled
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && e.target !== toggleSidebarBtn) {
                sidebar.classList.remove('active');
            }
        });
    } else {
        sidebar.classList.remove('mobile', 'active');
    }
}

/**
 * Switch between content sections
 * @param {string} sectionId - ID of the section to display
 */
function switchSection(sectionId) {
    // Update navigation items
    if (navItems) {
        navItems.forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-target') === sectionId) {
                item.classList.add('active');
            }
        });
    }
    
    // Update content sections
    if (contentSections) {
        contentSections.forEach(section => {
            section.classList.remove('active');
            if (section.id === sectionId) {
                section.classList.add('active');
            }
        });
    }
    
    // Load section data if needed
    loadSectionData(sectionId);
    
    // Close mobile sidebar after selection
    if (window.innerWidth <= 768 && sidebar) {
        sidebar.classList.remove('active');
    }
}

/**
 * Load data for specific sections
 * @param {string} sectionId - ID of the section
 */
function loadSectionData(sectionId) {
    switch (sectionId) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'user-management':
            loadUserData();
            break;
        case 'document-upload':
            loadDocumentData();
            break;
        case 'content-management':
            loadContentData();
            break;
        case 'system-config':
            loadSystemConfigData();
            break;
    }
}

/**
 * Load dashboard data
 */
function loadDashboardData() {
    // In a real app, fetch this data from the backend
    console.log('Loading dashboard data...');
    // Implementation would fetch stats and update the dashboard UI
}

/**
 * Load user management data
 */
function loadUserData() {
    // In a real app, fetch this data from the backend
    console.log('Loading user management data...');
    // Implementation would fetch user data and update the table
}

/**
 * Load document upload data
 */
function loadDocumentData() {
    // In a real app, fetch this data from the backend
    console.log('Loading document data...');
    // Implementation would fetch document data and update the table
}

/**
 * Load content management data
 */
function loadContentData() {
    // In a real app, fetch this data from the backend
    console.log('Loading content data...');
    // Implementation would fetch content data and update the UI
}

/**
 * Load system configuration data
 */
function loadSystemConfigData() {
    // In a real app, fetch this data from the backend
    console.log('Loading system configuration data...');
    // Implementation would fetch config data and update the UI
}