/**
 * DOJ India AI Legal Assistant - Sidebar Functionality
 * Handles all sidebar interactions and history management
 */

// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set up sidebar toggle
    toggleSidebarBtn.addEventListener('click', toggleSidebar);
    
    // Handle responsive behavior
    handleResponsiveSidebar();
    
    // Handle window resize
    window.addEventListener('resize', handleResponsiveSidebar);
});

/**
 * Toggle sidebar visibility
 */
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
    
    // Store preference in localStorage
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebarCollapsed', isCollapsed);
}

/**
 * Handle responsive sidebar behavior
 */
function handleResponsiveSidebar() {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        // On mobile, sidebar is hidden by default and can be toggled
        sidebar.classList.add('mobile');
        
        // Update toggle button to show/hide instead of collapse
        toggleSidebarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            sidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', function(e) {
            if (sidebar.classList.contains('active') && !sidebar.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    } else {
        // On desktop, check if sidebar was previously collapsed
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        } else {
            sidebar.classList.remove('collapsed');
        }
        
        // Remove mobile-specific classes and handlers
        sidebar.classList.remove('mobile', 'active');
    }
}