import { cpSync, mkdirSync, writeFileSync } from 'node:fs';

const rawApiBase = process.env.CALCULATOR_API_BASE_URL?.trim();
if (!rawApiBase) {
  throw new Error('Set the CALCULATOR_API_BASE_URL repository variable to the HTTPS backend origin.');
}

let apiUrl;
try {
  apiUrl = new URL(rawApiBase);
} catch {
  throw new Error('CALCULATOR_API_BASE_URL must be a complete HTTPS URL.');
}

if (
  apiUrl.protocol !== 'https:' ||
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.pathname !== '/' ||
  apiUrl.search ||
  apiUrl.hash
) {
  throw new Error('CALCULATOR_API_BASE_URL must be an HTTPS origin without a path, credentials, query, or fragment.');
}

const source = new URL('../src/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
mkdirSync(output, { recursive: true });
cpSync(source, output, { recursive: true, force: true });
writeFileSync(new URL('config.js', output), `window.CALCULATOR_API_BASE_URL = ${JSON.stringify(apiUrl.origin)};\n`);
