const path = require('path');
const fs = require('fs');
const dbPath = process.env.DB_PATH || path.join(__dirname, 'data/gpa.db');
console.log('DB Path:', dbPath);
const dbDir = path.dirname(dbPath);
console.log('DB Dir:', dbDir);
console.log('Dir exists:', fs.existsSync(dbDir));
