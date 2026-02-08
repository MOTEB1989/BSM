import { readFileSync } from 'node:fs';

const content = readFileSync(new URL('./.env.example', import.meta.url), 'utf8');
const requiredKeys = [
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_API_KEY',
  'AZURE_OPENAI_API_KEY',
  'GROQ_API_KEY',
  'COHERE_API_KEY',
  'MISTRAL_API_KEY',
  'PERPLEXITY_API_KEY',
];

const missing = requiredKeys.filter((key) => !content.includes(`${key}=`));

if (missing.length) {
  console.error('Missing provider keys in .env.example:', missing);
  process.exit(1);
}

console.log('AI config template includes all 8 providers.');
