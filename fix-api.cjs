const fs = require('fs');
const path = require('path');

const pagesDir = path.join('artifacts', 'octopus-os', 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  if (content.includes('"/api/')) {
    if (!content.includes('import { API_BASE }')) {
      content = content.replace(/(import .+;)/, '$1\nimport { API_BASE } from "@/lib/api";');
    }
    
    // Replace all instances of fetch("/api/...) with fetch(`${API_BASE}/...)
    // Also captures await fetch("/api/...)
    content = content.replace(/"\/api\/([^"]+)"/g, '`${API_BASE}/$1`');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed:', file);
  }
}
console.log('All done.');
