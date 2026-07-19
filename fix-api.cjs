const fs = require('fs');
const path = require('path');

const pagesDir = path.join('artifacts', 'octopus-os', 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));
let totalFixes = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix 1: Still has relative "/api/ paths (missed by previous fix or in toggle/other functions)
  if (content.includes('"/api/') || content.includes("'/api/") || content.match(/`\/api\//)) {
    if (!content.includes('import { API_BASE }')) {
      // Add API_BASE import after first import line
      content = content.replace(/(import .+;)/, '$1\nimport { API_BASE } from "@/lib/api";');
    }
    // Replace "/api/xyz" with `${API_BASE}/xyz`
    content = content.replace(/"\/api\/([^"]+)"/g, '`${API_BASE}/$1`');
    // Replace '/api/xyz' with `${API_BASE}/xyz`
    content = content.replace(/'\/api\/([^']+)'/g, '`${API_BASE}/$1`');
    // Replace template literals that have /api/ at start like `/api/agents/${id}/...`
    content = content.replace(/`\/api\//g, '`${API_BASE}/');
    changed = true;
    console.log(`[API_PATH] Fixed relative API paths in: ${file}`);
  }

  // Fix 2: Agent response parsing - API returns {agents:[...]} not bare array
  // Pattern: const data = await res.json(); if (data.length > 0) { setAgents(data.map(
  // Fix to: const raw = await res.json(); const data = Array.isArray(raw) ? raw : (raw.agents || raw.data || []);
  if (file === 'WorkforcePage.tsx') {
    // Fix fetchWorkers
    if (content.includes('const data = await res.json();') && content.includes('data.length > 0')) {
      content = content.replace(
        /const data = await res\.json\(\);\s*\n\s*\n?\s*if \(data\.length > 0\)/g,
        'const raw = await res.json();\n      const data = Array.isArray(raw) ? raw : (raw.agents || raw.data || []);\n\n      if (data.length > 0)'
      );
      changed = true;
      console.log(`[RESPONSE] Fixed agents response parsing in: ${file}`);
    }
    // Fix reFetch
    if (content.includes('const freshData = await reFetch.json();') && content.includes('freshData.map')) {
      content = content.replace(
        /const freshData = await reFetch\.json\(\);/g,
        'const freshRaw = await reFetch.json();\n          const freshData = Array.isArray(freshRaw) ? freshRaw : (freshRaw.agents || freshRaw.data || []);'
      );
      changed = true;
      console.log(`[RESPONSE] Fixed reFetch response parsing in: ${file}`);
    }
  }

  // Fix 3: In AgentsPage, fix reFetch too
  if (file === 'AgentsPage.tsx') {
    if (content.includes('const freshData = await reFetch.json();') && content.includes('freshData.map')) {
      content = content.replace(
        /const freshData = await reFetch\.json\(\);/g,
        'const freshRaw = await reFetch.json();\n          const freshData = Array.isArray(freshRaw) ? freshRaw : (freshRaw.agents || freshRaw.data || []);'
      );
      changed = true;
      console.log(`[RESPONSE] Fixed reFetch response parsing in: ${file}`);
    }
  }

  // Fix 4: CommandCenter response parsing - similar issue
  if (file === 'CommandCenter.tsx') {
    // Agents in CommandCenter also need the same fix
    if (content.includes('.json()') && content.includes('agentsData')) {
      // Already uses different var names, check the actual pattern
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content);
    totalFixes++;
  }
}

console.log(`\nTotal files fixed: ${totalFixes}`);
