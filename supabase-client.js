// Supabase Client Configuration
// Replace these with your actual Supabase project credentials
const SUPABASE_URL = 'https://vnhrwcerlaoipycsbigi.supabase.co'; // e.g., https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuaHJ3Y2VybGFvaXB5Y3NiaWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNTA3NTksImV4cCI6MjA4NDkyNjc1OX0.LOlRKqiOzsCBX2R6qcYukt3IG5onX3e4O-RIjcWWMnU'; // From your Supabase project settings

// Initialize Supabase client and make it globally available
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to get current user
window.getCurrentUser = async function() {
    const { data: { session }, error } = await window.supabaseClient.auth.getSession();
    if (error) {
        console.error('Error getting session:', error);
        return null;
    }
    return session?.user || null;
};

// Helper function to get user profile from database
window.getUserProfile = async function(userId) {
    const { data, error } = await window.supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
};

// Helper function to check if user is admin (uses role-based check)
window.isAdmin = async function() {
    const user = await window.getCurrentUser();
    if (!user) return false;

    const profile = await window.getUserProfile(user.id);
    return window.hasAdminAccess(profile);
};

// Helper function to update last login
window.updateLastLogin = async function(userId) {
    const { error } = await window.supabaseClient
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);

    if (error) {
        console.error('Error updating last login:', error);
    }
};

// Helper function to get user IP address
window.getUserIP = async function() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return 'Unknown';
    }
};

// Sign out helper
window.signOut = async function() {
    try {
        // Check if there's an active session first
        const { data: { session } } = await window.supabaseClient.auth.getSession();

        // Only attempt sign out if there's an active session
        if (session) {
            const { error } = await window.supabaseClient.auth.signOut();
            if (error) {
                console.error('Error signing out:', error);
            }
        }

        // Redirect to auth page regardless
        window.location.href = '/auth';
    } catch (error) {
        console.error('Sign out error:', error);
        // Even if there's an error, redirect to auth page
        window.location.href = '/auth';
    }
};

// ============================================================
// ROLE-BASED PERMISSION HELPERS
// ============================================================
// Roles: owner, super_admin, admin, sales_team, user

window.getUserRole = function(profile) {
    return profile?.role || 'user';
};

// Can access admin panel at all
window.hasAdminAccess = function(profile) {
    return ['owner', 'super_admin', 'admin', 'sales_team'].includes(profile?.role);
};

// Can delete customers (owner + super_admin only)
window.canDeleteCustomers = function(profile) {
    return ['owner', 'super_admin'].includes(profile?.role);
};

// Can manage content, announcements, workflows, notifications
window.canManageContent = function(profile) {
    return ['owner', 'super_admin', 'admin'].includes(profile?.role);
};

// Can access settings page and manage team
window.canManageSettings = function(profile) {
    return ['owner', 'super_admin'].includes(profile?.role);
};

// Can manage team members (assign roles)
window.canManageTeam = function(profile) {
    return ['owner', 'super_admin'].includes(profile?.role);
};

// Can create new users from admin panel
window.canCreateUsers = function(profile) {
    return ['owner', 'super_admin', 'admin'].includes(profile?.role);
};

// Can change customer status
window.canChangeStatus = function(profile) {
    return ['owner', 'super_admin', 'admin'].includes(profile?.role);
};

// SVG icons for sidebar
window._sidebarIcons = {
    dashboard: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" /></svg>',
    customers: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>',
    conversations: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>',
    content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
    announcements: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>',
    workflows: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>',
    notifications: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>'
};

// Apply role-based sidebar filtering - call after auth check
window.applySidebarRole = function(profile, activePage) {
    const role = window.getUserRole(profile);
    const navEl = document.querySelector('.sidebar-nav');
    if (!navEl) return;

    const allRoles = ['owner', 'super_admin', 'admin', 'sales_team'];
    const contentRoles = ['owner', 'super_admin', 'admin'];
    const settingsRoles = ['owner', 'super_admin'];

    const items = [
        { href: '/admin/', icon: 'dashboard', label: 'Dashboard', roles: allRoles, id: 'dashboard' },
        { href: '/admin/customers.html', icon: 'customers', label: 'Customers', roles: allRoles, id: 'customers' },
        { href: '/admin/conversations.html', icon: 'conversations', label: 'Conversations', roles: allRoles, id: 'conversations' },
        { href: '/admin/content.html', icon: 'content', label: 'Content', roles: contentRoles, id: 'content' },
        { href: '/admin/announcements.html', icon: 'announcements', label: 'Announcements', roles: contentRoles, id: 'announcements' },
        { href: '/admin/workflows.html', icon: 'workflows', label: 'Workflows', roles: contentRoles, id: 'workflows' },
        { href: '/admin/notifications.html', icon: 'notifications', label: 'Notifications', roles: contentRoles, id: 'notifications' },
        { href: '/admin/settings.html', icon: 'settings', label: 'Settings', roles: settingsRoles, id: 'settings' },
    ];

    let html = '';
    for (const item of items) {
        if (!item.roles.includes(role)) continue;
        const activeClass = activePage === item.id ? ' active' : '';
        html += `<a href="${item.href}" class="nav-item${activeClass}">
            <span class="nav-icon">${window._sidebarIcons[item.icon]}</span>
            <span class="nav-label">${item.label}</span>
        </a>\n`;
    }

    navEl.innerHTML = html;
};

// ============================================================
// CLIENT PORTAL SIDEBAR
// ============================================================

window._clientSidebarIcons = {
    dashboard: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/></svg>',
    content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    announcements: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>',
    messages: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    account: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
};

window.applyClientSidebar = function(activePage) {
    const navEl = document.querySelector('.client-sidebar-nav');
    if (!navEl) return;

    const items = [
        { href: '/', icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
        { href: '/portal/content', icon: 'content', label: 'Content', id: 'content' },
        { href: '/portal/announcements', icon: 'announcements', label: 'Announcements', id: 'announcements' },
        { href: '/portal/chat', icon: 'messages', label: 'Messages', id: 'messages' },
        { href: '/portal/account', icon: 'account', label: 'Account', id: 'account' },
    ];

    let html = '';
    for (const item of items) {
        const activeClass = activePage === item.id ? ' active' : '';
        html += `<a href="${item.href}" class="cs-nav-item${activeClass}">
            <span class="cs-nav-icon">${window._clientSidebarIcons[item.icon]}</span>
            <span class="cs-nav-label">${item.label}</span>
        </a>\n`;
    }

    navEl.innerHTML = html;
};

// Client sidebar CSS (injected once per page)
window.CLIENT_SIDEBAR_CSS = `
    .client-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        width: 60px;
        height: 100vh;
        background: rgba(10, 10, 10, 0.95);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-right: 1px solid #2a2a2a;
        z-index: 200;
        display: flex;
        flex-direction: column;
        transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
    }
    .client-sidebar:hover {
        width: 240px;
    }
    .cs-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px 14px;
        border-bottom: 1px solid #2a2a2a;
        flex-shrink: 0;
        height: 60px;
        overflow: hidden;
    }
    .cs-logo img {
        width: 32px;
        height: 32px;
        object-fit: contain;
        flex-shrink: 0;
        filter: drop-shadow(0 0 8px rgba(240, 200, 50, 0.4));
    }
    .cs-logo-text {
        font-family: 'Gilroy ExtraBold', 'Manrope', sans-serif;
        font-size: 16px;
        font-weight: 800;
        background: linear-gradient(135deg, #f7d954 0%, #f0c832 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        white-space: nowrap;
        opacity: 0;
        transition: opacity 0.2s ease 0.1s;
    }
    .client-sidebar:hover .cs-logo-text {
        opacity: 1;
    }
    .client-sidebar-nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 8px 0;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .cs-nav-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px;
        margin: 2px 8px;
        border-radius: 10px;
        text-decoration: none;
        color: #9ca3af;
        transition: all 0.2s ease;
        border-left: 3px solid transparent;
        white-space: nowrap;
        overflow: hidden;
    }
    .cs-nav-item:hover {
        background: rgba(240, 200, 50, 0.05);
        color: #ffffff;
    }
    .cs-nav-item.active {
        background: rgba(240, 200, 50, 0.15);
        color: #f0c832;
        border-left-color: #f0c832;
    }
    .cs-nav-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .cs-nav-icon svg {
        width: 20px;
        height: 20px;
    }
    .cs-nav-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.2s ease 0.1s;
    }
    .client-sidebar:hover .cs-nav-label {
        opacity: 1;
    }
    .cs-bottom {
        border-top: 1px solid #2a2a2a;
        padding: 8px 0;
        flex-shrink: 0;
    }
    .cs-signout {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 18px;
        margin: 2px 8px;
        border-radius: 10px;
        text-decoration: none;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        background: none;
        font-family: 'Manrope', sans-serif;
        width: calc(100% - 16px);
        white-space: nowrap;
        overflow: hidden;
    }
    .cs-signout:hover {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
    }
    .cs-signout svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
    .cs-signout-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.2s ease 0.1s;
    }
    .client-sidebar:hover .cs-signout-label {
        opacity: 1;
    }
    .cs-main-content {
        margin-left: 60px;
        min-height: 100vh;
        transition: margin-left 0.3s ease;
    }
    /* Mobile sidebar */
    .cs-mobile-toggle {
        display: none;
        position: fixed;
        top: 16px;
        left: 16px;
        z-index: 201;
        background: rgba(20, 20, 20, 0.9);
        border: 1px solid #2a2a2a;
        border-radius: 10px;
        padding: 10px;
        cursor: pointer;
        color: #ffffff;
    }
    .cs-mobile-toggle svg {
        width: 22px;
        height: 22px;
        display: block;
    }
    .cs-overlay {
        display: none;
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.6);
        z-index: 199;
    }
    @media (max-width: 768px) {
        .client-sidebar {
            transform: translateX(-100%);
            width: 240px;
        }
        .client-sidebar.open {
            transform: translateX(0);
        }
        .client-sidebar.open .cs-nav-label,
        .client-sidebar.open .cs-logo-text,
        .client-sidebar.open .cs-signout-label {
            opacity: 1;
        }
        .cs-overlay.open {
            display: block;
        }
        .cs-mobile-toggle {
            display: block;
        }
        .cs-main-content {
            margin-left: 0;
        }
    }
`;

// Client sidebar HTML template
window.CLIENT_SIDEBAR_HTML = `
    <button class="cs-mobile-toggle" onclick="toggleClientSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
    </button>
    <div class="cs-overlay" id="cs-overlay" onclick="toggleClientSidebar()"></div>
    <nav class="client-sidebar" id="client-sidebar">
        <div class="cs-logo">
            <img src="${window._csLogoPath || 'logo.png'}" alt="Profit Insider">
            <span class="cs-logo-text">Profit Insider</span>
        </div>
        <div class="client-sidebar-nav"></div>
        <div class="cs-bottom">
            <button class="cs-signout" onclick="window.signOut()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span class="cs-signout-label">Sign Out</span>
            </button>
        </div>
    </nav>
`;

window.toggleClientSidebar = function() {
    document.getElementById('client-sidebar').classList.toggle('open');
    document.getElementById('cs-overlay').classList.toggle('open');
};

window.injectClientSidebar = function(activePage, logoPath) {
    window._csLogoPath = logoPath || 'logo.png';
    // Inject CSS
    if (!document.getElementById('client-sidebar-css')) {
        const style = document.createElement('style');
        style.id = 'client-sidebar-css';
        style.textContent = window.CLIENT_SIDEBAR_CSS;
        document.head.appendChild(style);
    }
    // Inject HTML
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = window.CLIENT_SIDEBAR_HTML;
        window.applyClientSidebar(activePage);
    }
};

// ============================================================
// CRM HELPER FUNCTIONS
// ============================================================

// Mark onboarding as complete
window.markOnboardingComplete = async function(userId) {
    const { error } = await window.supabaseClient
        .from('users')
        .update({
            onboarding_completed: true,
            onboarding_completed_at: new Date().toISOString(),
            status: 'member'
        })
        .eq('id', userId);

    if (error) {
        console.error('Error marking onboarding complete:', error);
        return false;
    }
    return true;
};

// Update user status (also syncs onboarding_completed flag)
window.updateUserStatus = async function(userId, status) {
    const isCompleted = ['member', 'verified_member', 'active'].includes(status);
    const updateData = {
        status: status,
        onboarding_completed: isCompleted
    };
    if (isCompleted) {
        updateData.onboarding_completed_at = new Date().toISOString();
    }

    const { error } = await window.supabaseClient
        .from('users')
        .update(updateData)
        .eq('id', userId);

    if (error) {
        console.error('Error updating user status:', error);
        return false;
    }
    return true;
};

// Delete a user (admin only) - removes from users table; auth user remains but can't access anything
window.deleteUser = async function(userId) {
    const { error } = await window.supabaseClient
        .from('users')
        .delete()
        .eq('id', userId);

    if (error) {
        console.error('Error deleting user:', error);
        return false;
    }
    return true;
};

// Update user notes (admin)
window.updateUserNotes = async function(userId, notes) {
    const { error } = await window.supabaseClient
        .from('users')
        .update({ notes: notes })
        .eq('id', userId);

    if (error) {
        console.error('Error updating user notes:', error);
        return false;
    }
    return true;
};

// Fetch activity log for a user
window.getActivityLog = async function(userId, limit = 50, offset = 0) {
    const { data, error } = await window.supabaseClient
        .from('activity_log')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    if (error) {
        console.error('Error fetching activity log:', error);
        return [];
    }
    return data;
};

// Fetch all announcements (published only for clients)
window.getAnnouncements = async function(publishedOnly = true) {
    let query = window.supabaseClient
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

    if (publishedOnly) {
        query = query.eq('is_published', true);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching announcements:', error);
        return [];
    }
    return data;
};

// Fetch content posts (published only for clients)
window.getContentPosts = async function(publishedOnly = true, category = null) {
    let query = window.supabaseClient
        .from('content_posts')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (publishedOnly) {
        query = query.eq('is_published', true);
    }
    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching content posts:', error);
        return [];
    }
    return data;
};

// Fetch notifications for current user
window.getNotifications = async function() {
    const { data, error } = await window.supabaseClient
        .from('push_notifications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data;
};

// Dismiss a notification
window.dismissNotification = async function(notificationId, userId) {
    const { data: notif } = await window.supabaseClient
        .from('push_notifications')
        .select('is_read_by')
        .eq('id', notificationId)
        .single();

    if (notif) {
        const readBy = notif.is_read_by || [];
        if (!readBy.includes(userId)) {
            readBy.push(userId);
            await window.supabaseClient
                .from('push_notifications')
                .update({ is_read_by: readBy })
                .eq('id', notificationId);
        }
    }
};

// Trigger an N8N workflow
window.triggerWorkflow = async function(workflowId, customerData, triggeredByEmail) {
    const { data: workflow, error } = await window.supabaseClient
        .from('workflows')
        .select('*')
        .eq('id', workflowId)
        .single();

    if (error || !workflow) {
        console.error('Error fetching workflow:', error);
        return { success: false, error: 'Workflow not found' };
    }

    const payload = {
        event: 'workflow_trigger',
        workflow_id: workflowId,
        workflow_name: workflow.name,
        customer: customerData,
        triggered_by: triggeredByEmail,
        timestamp: new Date().toISOString()
    };

    try {
        const response = await fetch(workflow.webhook_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const status = response.ok ? 'success' : 'failed';

        // Log the execution
        await window.supabaseClient.from('workflow_executions').insert({
            workflow_id: workflowId,
            user_id: customerData.id,
            status: status,
            response: { status_code: response.status },
            triggered_by: customerData.triggered_by_id
        });

        return { success: response.ok, status: response.status };
    } catch (err) {
        await window.supabaseClient.from('workflow_executions').insert({
            workflow_id: workflowId,
            user_id: customerData.id,
            status: 'failed',
            response: { error: err.message },
            triggered_by: customerData.triggered_by_id
        });
        return { success: false, error: err.message };
    }
};

// Format relative time
window.formatRelativeTime = function(dateString) {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Format full date
window.formatFullDate = function(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
};
