const { execSync } = require('child_process');
const fs = require('fs');
require('dotenv').config();

const targetFile = './types/directus-schema.ts';
const backupFile = './types/directus-schema.backup.ts';

console.log('🚀 Generating Directus types...');

if (fs.existsSync(targetFile)) {
  fs.copyFileSync(targetFile, backupFile);
  console.log('✅ Backed up existing types');
}

try {
  execSync(
    `npx directus-sdk-typegen --url ${process.env.DIRECTUS_URL} --token ${process.env.DIRECTUS_STATIC_TOKEN} --output ${targetFile}`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Types generated successfully!');
  
  if (fs.existsSync(backupFile)) {
    fs.unlinkSync(backupFile);
  }
} catch (error) {
  console.error('❌ Failed to generate types');
  
  if (fs.existsSync(backupFile)) {
    fs.copyFileSync(backupFile, targetFile);
    fs.unlinkSync(backupFile);
    console.log('✅ Restored backup');
  }
  
  process.exit(1);
}
