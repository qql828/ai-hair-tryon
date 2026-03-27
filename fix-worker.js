const fs = require('fs');
const path = require('path');

const workerDir = '.vercel/output/static/_worker.js';
const workerFile = '.vercel/output/static/_worker.js.bak';
const indexFile = path.join(workerDir, 'index.js');

// 备份目录
if (fs.existsSync(workerDir) && fs.statSync(workerDir).isDirectory()) {
  fs.renameSync(workerDir, workerFile);
  fs.copyFileSync(path.join(workerFile, 'index.js'), workerDir);
  console.log('✅ Fixed _worker.js');
}
