#!/usr/bin/env node
import { readFileSync } from 'fs';

const [cmd, key, inlineValue] = process.argv.slice(2);

// Default to list
if (!cmd || cmd === 'list') {
  const secretsJson = process.env.AGENT_JOB_SECRETS;
  if (!secretsJson) {
    console.log('No agent secrets configured.');
    process.exit(0);
  }
  const secrets = JSON.parse(secretsJson);
  const keys = Object.keys(secrets);
  if (keys.length === 0) {
    console.log('No agent secrets configured.');
  } else {
    console.log('Available secrets:');
    keys.forEach(k => {
      const fetchRequired = secrets[k] === null;
      console.log(`  - ${k}${fetchRequired ? '  (use agent-job-secrets skill to fetch)' : ''}`);
    });
  }
  process.exit(0);
}

const apiKey = process.env.AGENT_JOB_TOKEN;
const appUrl = process.env.APP_URL;
if (!apiKey) { console.error('AGENT_JOB_TOKEN not available'); process.exit(1); }
if (!appUrl) { console.error('APP_URL not available'); process.exit(1); }

if (cmd === 'get') {
  if (!key) { console.error('Usage: agent-job-secrets get KEY_NAME'); process.exit(1); }
  const url = `${appUrl}/api/get-agent-job-secret?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    headers: { 'x-api-key': apiKey },
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`GET ${url} → ${res.status} ${body}`);
    process.exit(1);
  }
  const json = await res.json();
  console.log(json.value);
  process.exit(0);
}

if (cmd === 'set') {
  if (!key) {
    console.error('Usage: agent-job-secrets set KEY_NAME [value]');
    console.error('       echo "value" | agent-job-secrets set KEY_NAME');
    process.exit(1);
  }
  let value = inlineValue;
  if (value === undefined) {
    value = readFileSync('/dev/stdin', 'utf8').trim();
  }
  const url = `${appUrl}/api/set-agent-job-secret`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`POST ${url} → ${res.status} ${body}`);
    process.exit(1);
  }
  const json = await res.json();
  console.log(`Secret "${key}" updated.`);
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`);
process.exit(1);
