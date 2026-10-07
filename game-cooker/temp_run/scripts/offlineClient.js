'use strict';
// Construct 3 Offline Client Script
window.C3_OfflineClient = {
    init: function() {
        if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
            navigator.serviceWorker.register('sw.js').catch(function(err) {
                console.log('SW registration skipped:', err);
            });
        }
    }
};

