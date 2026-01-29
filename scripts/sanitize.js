const fs = require('fs');
const path = require('path');

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      walk(p);
      continue;
    }
    if (!p.endsWith('.ts') && !p.endsWith('.tsx')) continue;
    let s = fs.readFileSync(p, 'utf8');
    if (s.indexOf('\\"') !== -1 || s.indexOf('\\\"') !== -1) {
      const ns = s.replace(/\\\"/g, '"').replace(/\\"/g, '"');
      fs.writeFileSync(p, ns, 'utf8');
      console.log('sanitized', p);
    }
  }
}

walk(path.join(__dirname, '..', 'src'));
