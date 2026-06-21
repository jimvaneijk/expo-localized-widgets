const fs = require('fs');
const path = require('path');

fs.rmSync(path.join(__dirname, '..', 'dist'), { force: true, recursive: true });
