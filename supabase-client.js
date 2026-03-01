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
        const ip = data.ip || 'Unknown';
        window._geoData = { ip: ip, city: '', region: '', country: '' };
        // Try to get geo data in background (non-blocking)
        fetch('https://freeipapi.com/api/json/' + ip)
            .then(r => r.json())
            .then(geo => {
                window._geoData.city = geo.cityName || '';
                window._geoData.region = geo.regionName || '';
                window._geoData.country = geo.countryName || '';
            })
            .catch(() => {});
        return ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        window._geoData = { ip: 'Unknown', city: '', region: '', country: '' };
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

    // Prefetch admin pages for instant navigation
    items.forEach(item => {
        if (item.roles.includes(role) && activePage !== item.id) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = item.href;
            document.head.appendChild(link);
        }
    });

    // Populate theme toggle icons in admin sidebar
    window.initAdminThemeToggle();
};

window.initAdminThemeToggle = function() {
    var isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    document.querySelectorAll('.theme-toggle-icon').forEach(function(el) {
        el.innerHTML = isDark ? window._themeSunIcon : window._themeMoonIcon;
    });
    document.querySelectorAll('.theme-toggle-label').forEach(function(el) {
        el.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    });
};

// ============================================================
// CLIENT PORTAL SIDEBAR
// ============================================================

window._clientSidebarIcons = {
    dashboard: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><polyline stroke-linecap="round" stroke-linejoin="round" points="9 22 9 12 15 12 15 22"/></svg>',
    content: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path stroke-linecap="round" stroke-linejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    announcements: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>',
    messages: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>',
    performance: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>',
    account: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>'
};

window.applyClientSidebar = function(activePage) {
    const navEl = document.querySelector('.client-sidebar-nav');
    if (!navEl) return;

    const items = [
        { href: '/', icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
        { href: '/portal/performance.html', icon: 'performance', label: 'Performance', id: 'performance' },
        { href: '/portal/content.html', icon: 'content', label: 'Content', id: 'content' },
        { href: '/portal/announcements.html', icon: 'announcements', label: 'Announcements', id: 'announcements' },
        { href: '/portal/chat.html', icon: 'messages', label: 'Support', id: 'messages' },
        { href: '/portal/account.html', icon: 'account', label: 'Account', id: 'account' },
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

    // Prefetch client pages for instant navigation
    items.forEach(item => {
        if (activePage !== item.id) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = item.href;
            document.head.appendChild(link);
        }
    });
};

// ============================================================
// THEME SYSTEM (dark/light mode)
// ============================================================
window.THEME_LIGHT_CSS = `
    [data-theme="light"] {
        --bg-dark: #f5f5f7;
        --bg-card: #ffffff;
        --accent: #c49b00;
        --accent-light: #b38d00;
        --accent-dim: rgba(196, 155, 0, 0.1);
        --accent-glow: rgba(196, 155, 0, 0.15);
        --text-primary: #111111;
        --text-secondary: #4b5563;
        --text-muted: #9ca3af;
        --border: #e5e7eb;
        --success: #16a34a;
        --error: #dc2626;
    }
    [data-theme="light"] .client-sidebar,
    [data-theme="light"] .sidebar {
        background: rgba(255, 255, 255, 0.97) !important;
        border-right-color: var(--border) !important;
    }
    [data-theme="light"] .cs-logo,
    [data-theme="light"] .cs-bottom {
        border-color: var(--border) !important;
    }
    [data-theme="light"] .cs-nav-item {
        color: var(--text-secondary);
    }
    [data-theme="light"] .cs-nav-item:hover {
        color: var(--text-primary);
    }
    [data-theme="light"] .cs-nav-item.active {
        color: var(--accent);
    }
    [data-theme="light"] .cs-signout,
    [data-theme="light"] .cs-theme-toggle {
        color: var(--text-secondary);
    }
    [data-theme="light"] .cs-mobile-toggle {
        background: rgba(255, 255, 255, 0.95);
        border-color: var(--border);
        color: var(--text-primary);
    }
    [data-theme="light"] .dot-pattern {
        background-image: radial-gradient(rgba(196, 155, 0, 0.08) 1px, transparent 1px) !important;
    }
    [data-theme="light"] .sidebar-logo {
        border-color: var(--border) !important;
    }
    [data-theme="light"] .sidebar-bottom {
        border-color: var(--border) !important;
    }
    [data-theme="light"] .nav-item {
        color: var(--text-secondary);
    }
    [data-theme="light"] .nav-item:hover {
        color: var(--text-primary);
    }
    [data-theme="light"] .nav-item.active {
        color: var(--accent);
        background: var(--accent-dim);
    }
`;

window._themeSunIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="5"/><path stroke-linecap="round" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>';
window._themeMoonIcon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" width="20" height="20"><path stroke-linecap="round" stroke-linejoin="round" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z"/></svg>';

window.initTheme = function() {
    var saved = localStorage.getItem('pi-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    // Inject light mode CSS if not present
    if (!document.getElementById('pi-theme-css')) {
        var s = document.createElement('style');
        s.id = 'pi-theme-css';
        s.textContent = window.THEME_LIGHT_CSS;
        document.head.appendChild(s);
    }
};

window.toggleTheme = function() {
    var current = document.documentElement.getAttribute('data-theme') || 'dark';
    var next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pi-theme', next);
    // Update all toggle icons/labels
    document.querySelectorAll('.theme-toggle-icon').forEach(function(el) {
        el.innerHTML = next === 'dark' ? window._themeSunIcon : window._themeMoonIcon;
    });
    document.querySelectorAll('.theme-toggle-label').forEach(function(el) {
        el.textContent = next === 'dark' ? 'Light Mode' : 'Dark Mode';
    });
};

// Apply theme immediately on script load
window.initTheme();

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
        border-right: 1px solid rgba(42, 42, 42, 0.6);
        z-index: 200;
        display: flex;
        flex-direction: column;
        transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;
        will-change: width;
    }
    .client-sidebar:hover {
        width: 240px;
    }
    .cs-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 18px 0;
        padding-left: 15px;
        border-bottom: 1px solid #2a2a2a;
        flex-shrink: 0;
        height: 68px;
        overflow: hidden;
        transition: padding-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .client-sidebar:hover .cs-logo {
        padding-left: 16px;
    }
    .cs-logo img {
        width: 30px;
        height: 30px;
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
        transition: opacity 0.15s ease 0.05s;
    }
    .client-sidebar:hover .cs-logo-text {
        opacity: 1;
    }
    .client-sidebar-nav {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 16px 0;
        gap: 2px;
        overflow-y: auto;
        overflow-x: hidden;
    }
    .cs-nav-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 0;
        padding-left: 19px;
        margin: 0 6px;
        border-radius: 10px;
        text-decoration: none;
        color: #9ca3af;
        transition: all 0.2s ease;
        white-space: nowrap;
        min-height: 44px;
        position: relative;
    }
    .client-sidebar:hover .cs-nav-item {
        padding-left: 16px;
    }
    .cs-nav-item:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
    }
    .cs-nav-item.active {
        background: rgba(255, 255, 255, 0.04);
        color: #f0c832;
    }
    .cs-nav-item.active::before {
        content: '';
        position: absolute;
        left: 0;
        top: 25%;
        height: 50%;
        width: 2px;
        background: #f0c832;
        border-radius: 2px;
    }
    .cs-nav-icon {
        width: 22px;
        height: 22px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .cs-nav-icon svg {
        width: 22px;
        height: 22px;
    }
    .cs-nav-label {
        font-size: 14px;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.15s ease 0.05s;
    }
    .client-sidebar:hover .cs-nav-label {
        opacity: 1;
    }
    .cs-bottom {
        border-top: 1px solid #2a2a2a;
        padding: 8px 0;
        flex-shrink: 0;
    }
    .cs-theme-toggle,
    .cs-signout {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 0;
        padding-left: 20px;
        margin: 0 6px;
        border-radius: 10px;
        text-decoration: none;
        color: #9ca3af;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        background: none;
        font-family: 'Manrope', sans-serif;
        font-size: 14px;
        width: calc(100% - 12px);
        white-space: nowrap;
        min-height: 44px;
    }
    .client-sidebar:hover .cs-theme-toggle,
    .client-sidebar:hover .cs-signout {
        padding-left: 16px;
    }
    .cs-theme-toggle:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #ffffff;
    }
    .cs-signout:hover {
        background: rgba(239, 68, 68, 0.08);
        color: #ef4444;
    }
    .cs-theme-toggle svg,
    .cs-signout svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
    }
    .cs-signout-label,
    .cs-theme-label {
        font-size: 13px;
        font-weight: 600;
        opacity: 0;
        transition: opacity 0.15s ease 0.05s;
    }
    .client-sidebar:hover .cs-signout-label,
    .client-sidebar:hover .cs-theme-label {
        opacity: 1;
    }
    .cs-main-content {
        padding-left: 60px;
        min-height: 100vh;
        transition: padding-left 0.25s ease;
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
        .client-sidebar.open .cs-nav-item {
            justify-content: flex-start;
            padding-left: 16px;
        }
        .client-sidebar.open .cs-theme-toggle,
        .client-sidebar.open .cs-signout {
            justify-content: flex-start;
            padding-left: 16px;
        }
        .client-sidebar.open .cs-nav-label,
        .client-sidebar.open .cs-logo-text,
        .client-sidebar.open .cs-signout-label,
        .client-sidebar.open .cs-theme-label {
            opacity: 1;
        }
        .cs-overlay.open {
            display: block;
        }
        .cs-mobile-toggle {
            display: block;
        }
        .cs-main-content {
            padding-left: 0;
        }
    }
`;

// Notification system CSS (injected once per page)
window.NOTIFICATION_SYSTEM_CSS = `
    /* Bell icon */
    .notif-bell {
        position: fixed;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255,255,255,0.1);
        color: #e5e7eb;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 300;
        transition: background 0.2s, transform 0.15s;
    }
    .notif-bell:hover {
        background: rgba(255,255,255,0.14);
        transform: scale(1.05);
    }
    .notif-bell svg { width: 20px; height: 20px; }
    .notif-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        border-radius: 9px;
        background: #ef4444;
        color: #fff;
        font-size: 11px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
        line-height: 1;
    }
    .notif-badge.hidden { display: none; }

    /* Dropdown */
    .notif-dropdown {
        position: fixed;
        top: 64px;
        right: 16px;
        width: 360px;
        max-height: 480px;
        background: rgba(20,20,20,0.95);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        z-index: 301;
        overflow: hidden;
        display: none;
        box-shadow: 0 16px 48px rgba(0,0,0,0.5);
    }
    .notif-dropdown.open { display: block; }
    .notif-dd-header {
        padding: 14px 16px;
        font-weight: 700;
        font-size: 14px;
        color: #f5f5f5;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        font-family: 'Gilroy-ExtraBold', sans-serif;
    }
    .notif-dd-list {
        overflow-y: auto;
        max-height: 420px;
        padding: 6px 0;
    }
    .notif-dd-empty {
        padding: 32px 16px;
        text-align: center;
        color: #8b919a;
        font-size: 13px;
    }
    .notif-dd-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
        padding: 12px 16px;
        cursor: pointer;
        transition: background 0.15s;
    }
    .notif-dd-item:hover { background: rgba(255,255,255,0.05); }
    .notif-dd-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #f0c832;
        flex-shrink: 0;
        margin-top: 5px;
    }
    .notif-dd-body { flex: 1; min-width: 0; }
    .notif-dd-title {
        font-weight: 600;
        font-size: 13px;
        color: #f5f5f5;
        margin-bottom: 3px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .notif-dd-preview {
        font-size: 12px;
        color: #8b919a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .notif-dd-time {
        font-size: 11px;
        color: #6b7280;
        flex-shrink: 0;
        margin-top: 2px;
    }

    /* Modal overlay */
    .notif-modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.6);
        backdrop-filter: blur(4px);
        z-index: 400;
        display: none;
        align-items: center;
        justify-content: center;
    }
    .notif-modal-overlay.open { display: flex; }
    .notif-modal {
        background: rgba(20,20,20,0.97);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(240,200,50,0.25);
        border-radius: 14px;
        width: 480px;
        max-width: 90vw;
        max-height: 80vh;
        overflow-y: auto;
        padding: 28px;
        position: relative;
        box-shadow: 0 20px 60px rgba(0,0,0,0.6);
    }
    .notif-modal-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: rgba(255,255,255,0.08);
        border: none;
        color: #9ca3af;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        transition: background 0.15s, color 0.15s;
    }
    .notif-modal-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
    .notif-modal-title {
        font-family: 'Gilroy-ExtraBold', sans-serif;
        font-size: 20px;
        color: #f5f5f5;
        margin-bottom: 6px;
        padding-right: 36px;
    }
    .notif-modal-meta {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 18px;
    }
    .notif-modal-message {
        font-size: 14px;
        color: #d1d5db;
        line-height: 1.65;
        white-space: pre-wrap;
    }

    /* Toast container */
    .notif-toast-container {
        position: fixed;
        top: 68px;
        right: 16px;
        z-index: 350;
        display: flex;
        flex-direction: column;
        gap: 8px;
        pointer-events: none;
        max-width: 340px;
    }
    .notif-toast {
        background: rgba(20,20,20,0.95);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(240,200,50,0.3);
        border-radius: 10px;
        padding: 12px 16px;
        pointer-events: auto;
        cursor: pointer;
        animation: notifSlideIn 0.35s ease-out;
        transition: opacity 0.3s, transform 0.3s;
        box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .notif-toast.removing {
        opacity: 0;
        transform: translateX(100%);
    }
    .notif-toast-title {
        font-weight: 600;
        font-size: 13px;
        color: #f5f5f5;
        margin-bottom: 3px;
    }
    .notif-toast-preview {
        font-size: 12px;
        color: #8b919a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    @keyframes notifSlideIn {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }

    /* Light theme overrides */
    [data-theme="light"] .notif-bell {
        background: rgba(0,0,0,0.06);
        border-color: rgba(0,0,0,0.1);
        color: #374151;
    }
    [data-theme="light"] .notif-bell:hover { background: rgba(0,0,0,0.1); }
    [data-theme="light"] .notif-dropdown {
        background: rgba(255,255,255,0.97);
        border-color: rgba(0,0,0,0.1);
        box-shadow: 0 16px 48px rgba(0,0,0,0.15);
    }
    [data-theme="light"] .notif-dd-header { color: #111827; border-bottom-color: rgba(0,0,0,0.08); }
    [data-theme="light"] .notif-dd-item:hover { background: rgba(0,0,0,0.04); }
    [data-theme="light"] .notif-dd-title { color: #111827; }
    [data-theme="light"] .notif-dd-preview { color: #6b7280; }
    [data-theme="light"] .notif-dd-empty { color: #9ca3af; }
    [data-theme="light"] .notif-modal {
        background: rgba(255,255,255,0.98);
        border-color: rgba(240,200,50,0.35);
        box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    }
    [data-theme="light"] .notif-modal-overlay { background: rgba(0,0,0,0.35); }
    [data-theme="light"] .notif-modal-close { background: rgba(0,0,0,0.06); color: #6b7280; }
    [data-theme="light"] .notif-modal-close:hover { background: rgba(0,0,0,0.1); color: #111; }
    [data-theme="light"] .notif-modal-title { color: #111827; }
    [data-theme="light"] .notif-modal-message { color: #374151; }
    [data-theme="light"] .notif-toast {
        background: rgba(255,255,255,0.97);
        border-color: rgba(240,200,50,0.4);
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    [data-theme="light"] .notif-toast-title { color: #111827; }
    [data-theme="light"] .notif-toast-preview { color: #6b7280; }

    /* Mobile responsive */
    @media (max-width: 600px) {
        .notif-bell { top: 12px; right: 12px; width: 36px; height: 36px; }
        .notif-bell svg { width: 18px; height: 18px; }
        .notif-dropdown { right: 8px; left: 8px; width: auto; top: 56px; }
        .notif-modal { width: 95vw; padding: 20px; }
        .notif-toast-container { right: 8px; left: 8px; max-width: none; top: 56px; }
    }
`;

// Client sidebar HTML builder (function so logoPath resolves at call time)
window.buildClientSidebarHTML = function(logoPath) {
    var isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
    var themeIcon = isDark ? window._themeSunIcon : window._themeMoonIcon;
    var themeLabel = isDark ? 'Light Mode' : 'Dark Mode';
    return `
    <button class="cs-mobile-toggle" onclick="toggleClientSidebar()">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
    </button>
    <div class="cs-overlay" id="cs-overlay" onclick="toggleClientSidebar()"></div>
    <nav class="client-sidebar" id="client-sidebar">
        <div class="cs-logo">
            <img src="${logoPath || 'logo.png'}" alt="Profit Insider">
            <span class="cs-logo-text">Profit Insider</span>
        </div>
        <div class="client-sidebar-nav"></div>
        <div class="cs-bottom">
            <button class="cs-theme-toggle" onclick="window.toggleTheme()">
                <span class="theme-toggle-icon">${themeIcon}</span>
                <span class="cs-theme-label theme-toggle-label">${themeLabel}</span>
            </button>
            <button class="cs-signout" onclick="window.signOut()">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                <span class="cs-signout-label">Sign Out</span>
            </button>
        </div>
    </nav>`;
};

window.toggleClientSidebar = function() {
    document.getElementById('client-sidebar').classList.toggle('open');
    document.getElementById('cs-overlay').classList.toggle('open');
};

window.injectClientSidebar = function(activePage, logoPath) {
    // Inject CSS
    if (!document.getElementById('client-sidebar-css')) {
        const style = document.createElement('style');
        style.id = 'client-sidebar-css';
        style.textContent = window.CLIENT_SIDEBAR_CSS;
        document.head.appendChild(style);
    }
    // Inject notification CSS
    if (!document.getElementById('notif-system-css')) {
        const nStyle = document.createElement('style');
        nStyle.id = 'notif-system-css';
        nStyle.textContent = window.NOTIFICATION_SYSTEM_CSS;
        document.head.appendChild(nStyle);
    }
    // Inject HTML
    const sidebarContainer = document.getElementById('sidebar-container');
    if (sidebarContainer) {
        sidebarContainer.innerHTML = window.buildClientSidebarHTML(logoPath);
        window.applyClientSidebar(activePage);
    }
    // Inject notification UI elements
    if (!document.getElementById('notif-bell')) {
        // Bell button
        const bell = document.createElement('button');
        bell.id = 'notif-bell';
        bell.className = 'notif-bell';
        bell.onclick = function() { window._toggleNotifDropdown(); };
        bell.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg><span class="notif-badge hidden" id="notif-badge">0</span>';
        document.body.appendChild(bell);

        // Dropdown
        const dd = document.createElement('div');
        dd.id = 'notif-dropdown';
        dd.className = 'notif-dropdown';
        dd.innerHTML = '<div class="notif-dd-header">Notifications</div><div class="notif-dd-list" id="notif-dd-list"></div>';
        document.body.appendChild(dd);

        // Modal overlay
        const modal = document.createElement('div');
        modal.id = 'notif-modal-overlay';
        modal.className = 'notif-modal-overlay';
        modal.innerHTML = '<div class="notif-modal" id="notif-modal"><button class="notif-modal-close" id="notif-modal-close">&times;</button><div class="notif-modal-title" id="notif-modal-title"></div><div class="notif-modal-meta" id="notif-modal-meta"></div><div class="notif-modal-message" id="notif-modal-message"></div></div>';
        document.body.appendChild(modal);

        // Toast container
        const tc = document.createElement('div');
        tc.id = 'notif-toast-container';
        tc.className = 'notif-toast-container';
        document.body.appendChild(tc);

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            const dropdown = document.getElementById('notif-dropdown');
            const bellEl = document.getElementById('notif-bell');
            if (dropdown && dropdown.classList.contains('open') && !dropdown.contains(e.target) && !bellEl.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });

        // Modal close button
        document.getElementById('notif-modal-close').onclick = function() { window._closeNotifModal(true); };
        // Close modal on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) window._closeNotifModal(true);
        });

        // Init notification system (async, non-blocking)
        window.initNotificationSystem();
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

// ============================================================
// AI CHAT CONFIG
// ============================================================

window.getAIChatConfig = async function() {
    try {
        const { data, error } = await window.supabaseClient
            .from('admin_settings')
            .select('value')
            .eq('key', 'ai_chat_config')
            .single();
        if (error) throw error;
        return data?.value || {};
    } catch (err) {
        console.error('Error fetching AI config:', err);
        return { enabled: true, webhook_url: '', greeting_message: 'Hi! How can I help you today?', ai_display_name: 'Support Team' };
    }
};

window.updateAIChatConfig = async function(config) {
    const { error } = await window.supabaseClient
        .from('admin_settings')
        .upsert({ key: 'ai_chat_config', value: config, updated_at: new Date().toISOString() });
    if (error) { console.error('Error updating AI config:', error); return false; }
    return true;
};

// ============================================================
// CONVERSATION HANDLER MANAGEMENT
// ============================================================

window.setConversationHandler = async function(conversationId, handlerType, adminId) {
    const updateData = { handler_type: handlerType };
    if (handlerType === 'human' && adminId) {
        updateData.assigned_admin_id = adminId;
        updateData.category = 'open';
    } else if (handlerType === 'ai') {
        updateData.assigned_admin_id = null;
        updateData.category = 'ai';
    }
    const { error } = await window.supabaseClient
        .from('chat_conversations')
        .update(updateData)
        .eq('id', conversationId);
    if (error) { console.error('Error setting handler:', error); return false; }
    return true;
};

window.escalateConversation = async function(conversationId) {
    const { error } = await window.supabaseClient
        .from('chat_conversations')
        .update({
            is_escalated: true,
            escalated_at: new Date().toISOString(),
            handler_type: 'human',
            category: 'escalated'
        })
        .eq('id', conversationId);
    if (error) { console.error('Error escalating:', error); return false; }
    return true;
};

window.getConversationCategory = function(conv) {
    if (conv.status === 'resolved') return 'resolved';
    if (conv.is_escalated) return 'escalated';
    if (conv.handler_type === 'ai') return 'ai';
    return 'open';
};

// ============================================================
// USER TAGS
// ============================================================

window.getUserTags = function(profile) {
    return Array.isArray(profile?.tags) ? profile.tags : [];
};

window.addUserTag = async function(userId, tag) {
    const profile = await window.getUserProfile(userId);
    if (!profile) return false;
    const tags = Array.isArray(profile.tags) ? [...profile.tags] : [];
    if (tags.includes(tag)) return true;
    tags.push(tag);
    const { error } = await window.supabaseClient
        .from('users')
        .update({ tags })
        .eq('id', userId);
    if (error) { console.error('Error adding tag:', error); return false; }
    return true;
};

window.removeUserTag = async function(userId, tag) {
    const profile = await window.getUserProfile(userId);
    if (!profile) return false;
    const tags = (Array.isArray(profile.tags) ? profile.tags : []).filter(t => t !== tag);
    const { error } = await window.supabaseClient
        .from('users')
        .update({ tags })
        .eq('id', userId);
    if (error) { console.error('Error removing tag:', error); return false; }
    return true;
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

// ============================================================
// NOTIFICATION SYSTEM
// ============================================================

window._notifState = {
    notifications: [],
    userId: null,
    userStatus: null,
    subscription: null,
    initialized: false
};

// Get unread (not dismissed, not expired) notifications
window._getUnreadNotifications = function() {
    const now = new Date();
    return window._notifState.notifications.filter(function(n) {
        if (n.expires_at && new Date(n.expires_at) < now) return false;
        const readBy = n.is_read_by || [];
        return !readBy.includes(window._notifState.userId);
    });
};

// Update the red badge count
window._updateNotifBadge = function() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    const unread = window._getUnreadNotifications();
    const count = unread.length;
    badge.textContent = count > 99 ? '99+' : count;
    badge.classList.toggle('hidden', count === 0);
};

// Render dropdown list with unread notifications
window._renderNotifDropdown = function() {
    const list = document.getElementById('notif-dd-list');
    if (!list) return;
    const unread = window._getUnreadNotifications();
    if (unread.length === 0) {
        list.innerHTML = '<div class="notif-dd-empty">No new notifications</div>';
        return;
    }
    list.innerHTML = unread.map(function(n) {
        const preview = (n.message || '').substring(0, 60) + ((n.message || '').length > 60 ? '...' : '');
        const time = window.formatRelativeTime(n.created_at);
        return '<div class="notif-dd-item" data-id="' + n.id + '"><div class="notif-dd-dot"></div><div class="notif-dd-body"><div class="notif-dd-title">' + _escNotif(n.title) + '</div><div class="notif-dd-preview">' + _escNotif(preview) + '</div></div><div class="notif-dd-time">' + time + '</div></div>';
    }).join('');
    // Click handlers
    list.querySelectorAll('.notif-dd-item').forEach(function(item) {
        item.onclick = function() {
            const id = item.getAttribute('data-id');
            const notif = window._notifState.notifications.find(function(n) { return n.id === id; });
            if (notif) window._openNotifModal(notif);
        };
    });
};

// HTML escape helper
function _escNotif(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

// Toggle dropdown open/close
window._toggleNotifDropdown = function() {
    const dd = document.getElementById('notif-dropdown');
    if (!dd) return;
    const isOpen = dd.classList.contains('open');
    if (!isOpen) window._renderNotifDropdown();
    dd.classList.toggle('open');
};

// Open modal with full notification content
window._openNotifModal = function(notification) {
    // Close dropdown
    const dd = document.getElementById('notif-dropdown');
    if (dd) dd.classList.remove('open');

    document.getElementById('notif-modal-title').textContent = notification.title || '';
    document.getElementById('notif-modal-meta').textContent = window.formatFullDate(notification.created_at);
    document.getElementById('notif-modal-message').textContent = notification.message || '';

    const overlay = document.getElementById('notif-modal-overlay');
    overlay.classList.add('open');
    overlay._currentNotifId = notification.id;
};

// Close modal and optionally dismiss the notification
window._closeNotifModal = function(shouldDismiss) {
    const overlay = document.getElementById('notif-modal-overlay');
    if (!overlay) return;
    const notifId = overlay._currentNotifId;
    overlay.classList.remove('open');
    overlay._currentNotifId = null;

    if (shouldDismiss && notifId && window._notifState.userId) {
        // Optimistic local update
        const notif = window._notifState.notifications.find(function(n) { return n.id === notifId; });
        if (notif) {
            if (!notif.is_read_by) notif.is_read_by = [];
            if (!notif.is_read_by.includes(window._notifState.userId)) {
                notif.is_read_by.push(window._notifState.userId);
            }
        }
        window._updateNotifBadge();
        // Persist to DB
        window.dismissNotification(notifId, window._notifState.userId);
    }
};

// Show a toast notification
window._showNotifToast = function(notification) {
    const container = document.getElementById('notif-toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'notif-toast';
    const preview = (notification.message || '').substring(0, 80) + ((notification.message || '').length > 80 ? '...' : '');
    toast.innerHTML = '<div class="notif-toast-title">' + _escNotif(notification.title) + '</div><div class="notif-toast-preview">' + _escNotif(preview) + '</div>';
    toast.onclick = function() {
        toast.classList.add('removing');
        setTimeout(function() { toast.remove(); }, 300);
        window._openNotifModal(notification);
    };
    container.appendChild(toast);
    // Auto-remove after 5 seconds
    setTimeout(function() {
        if (toast.parentNode) {
            toast.classList.add('removing');
            setTimeout(function() { toast.remove(); }, 300);
        }
    }, 5000);
};

// Fetch all notifications from DB
window._fetchNotifications = async function() {
    const data = await window.getNotifications();
    window._notifState.notifications = data || [];
    window._updateNotifBadge();
};

// Subscribe to real-time notification inserts
window._subscribeNotifications = function() {
    if (window._notifState.subscription) return;
    const channel = window.supabaseClient
        .channel('client-notifications')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'push_notifications' }, function(payload) {
            const newNotif = payload.new;
            if (!newNotif) return;
            // Client-side target check
            const target = newNotif.target;
            const uid = window._notifState.userId;
            const status = window._notifState.userStatus;
            if (target !== 'all' && target !== status && target !== uid) return;
            // Check not expired
            if (newNotif.expires_at && new Date(newNotif.expires_at) < new Date()) return;
            // Add to local state
            window._notifState.notifications.unshift(newNotif);
            window._updateNotifBadge();
            window._showNotifToast(newNotif);
        })
        .subscribe();
    window._notifState.subscription = channel;
};

// Initialize the notification system
window.initNotificationSystem = async function() {
    if (window._notifState.initialized) return;

    // Check if user is authenticated
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session || !session.user) return;

    // Skip for admin users
    const { data: userData } = await window.supabaseClient
        .from('users')
        .select('is_admin, status')
        .eq('id', session.user.id)
        .single();

    if (!userData || userData.is_admin) return;

    window._notifState.userId = session.user.id;
    window._notifState.userStatus = userData.status || '';
    window._notifState.initialized = true;

    // Fetch existing notifications
    await window._fetchNotifications();

    // Show toasts for unread on login (max 3, staggered)
    const unread = window._getUnreadNotifications();
    const toShow = unread.slice(0, 3);
    toShow.forEach(function(n, i) {
        setTimeout(function() { window._showNotifToast(n); }, i * 800);
    });

    // Subscribe to real-time
    window._subscribeNotifications();
};
