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
    const lines = s.split(/\r?\n/);
    let firstNonEmptyIdx = lines.findIndex(l => l.trim().length>0);
    if (firstNonEmptyIdx===-1) continue;
    const header = lines[firstNonEmptyIdx].trim();
    const rest = s.slice(s.indexOf(header) + header.length);
    const secondIdx = rest.indexOf('\n' + header);
    if (secondIdx !== -1) {
      const cutPos = s.indexOf(header) + header.length + secondIdx + 1; // position of second header
      const newContent = s.slice(0, cutPos).trimEnd() + '\n';
      fs.writeFileSync(p, newContent, 'utf8');
      console.log('deduped', p);
    }
  }
}

walk(path.join(__dirname, '..', 'src'));
