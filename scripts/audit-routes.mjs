import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) results = results.concat(walk(p));
    else if (f === 'route.ts') results.push(p);
  }
  return results;
}

const routes = walk('app/api');
console.log(`Total API routes found: ${routes.length}`);
for (const r of routes) {
  const c = fs.readFileSync(r, 'utf8');
  const hasMut = c.includes('export async function POST') || c.includes('export async function PATCH') || c.includes('export async function PUT');
  const hasZod = c.includes('zod') || c.includes('z.');
  console.log(`${r} -> ${hasMut ? (hasZod ? 'VALIDATED_WITH_ZOD' : 'MUTATION_WITHOUT_ZOD') : 'READ_ONLY_OR_DELETE'}`);
}
