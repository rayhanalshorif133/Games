const fs = require('fs');

const html = fs.readFileSync('index.html', 'utf8');
const js = fs.readFileSync('game.js', 'utf8');

const htmlIds = new Set();
const reHtml = /id=["']([^"']+)["']/g;
let m;
while ((m = reHtml.exec(html)) !== null) {
    htmlIds.add(m[1]);
}

const reJs = /getElementById\((['"])(.*?)\1\)/g;
const jsIds = new Set();
while ((m = reJs.exec(js)) !== null) {
    jsIds.add(m[2]);
}

let hasError = false;
console.log('--- Verifying JS getElementById IDs ---');
for (const id of jsIds) {
    if (!htmlIds.has(id)) {
        console.error('FAIL: JS queries ID not found in HTML:', id);
        hasError = true;
    } else {
        console.log('PASS:', id);
    }
}

if (!hasError) {
    console.log('SUCCESS: All', jsIds.size, 'IDs exist in index.html!');
} else {
    process.exit(1);
}

