// ============================================================
// ACTIVITY TRACKER - Include on all portal pages
// Automatically logs page views and provides manual tracking
// ============================================================

(function() {
    let _userId = null;
    let _ip = null;

    // Initialize tracker
    async function init() {
        try {
            const user = await window.getCurrentUser();
            if (user) {
                _userId = user.id;
                // Get IP in background
                window.getUserIP().then(ip => { _ip = ip; });
                // Auto-track page view
                trackActivity('page_view', window.location.pathname);
            }
        } catch (e) {
            console.error('Activity tracker init error:', e);
        }
    }

    // Track an activity
    async function trackActivity(action, page, details) {
        if (!_userId) return;

        try {
            await window.supabaseClient.from('activity_log').insert({
                user_id: _userId,
                action: action,
                page: page || window.location.pathname,
                details: details || {},
                ip_address: _ip || 'Unknown',
                user_agent: navigator.userAgent
            });
        } catch (e) {
            console.error('Activity tracking error:', e);
        }
    }

    // Expose globally
    window.trackActivity = trackActivity;

    // Initialize when Supabase is ready
    if (window.supabaseClient) {
        init();
    } else {
        window.addEventListener('load', () => setTimeout(init, 500));
    }
})();
