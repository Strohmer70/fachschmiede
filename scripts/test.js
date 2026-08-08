const fs = require('fs');
const path = require('path');

const dirs = fs.readdirSync('public/blog');
for (const t of dirs) {
  const tPath = path.join('public/blog', t);
  if (!fs.statSync(tPath).isDirectory()) continue;
  const cities = fs.readdirSync(tPath);
  for (const c of cities) {
    const cPath = path.join(tPath, c);
    if (!fs.statSync(cPath).isDirectory()) continue;
    console.log(t + '/' + c);
  }
}
