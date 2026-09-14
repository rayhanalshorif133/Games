/**
 * Construct 3 HTML5 Build - Job Worker
 * Handles asynchronous background jobs and data decompression.
 */
'use strict';
self.addEventListener('message', function (e) {
    const data = e.data;
    if (data && data.type === 'ping') {
        self.postMessage({ type: 'pong' });
    }
});

