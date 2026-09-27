const fs = require('fs');
const path = require('path');

const src = path.resolve(__dirname, '../src/generated');
const dest = path.resolve(__dirname, '../dist/generated');

if (fs.existsSync(src)) {
  fs.cpSync(src, dest, { recursive: true });
}
