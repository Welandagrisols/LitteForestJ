
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building LittleForest Mobile App...\n');

try {
  // Clean previous builds
  console.log('1. Cleaning previous builds...');
  if (fs.existsSync('out')) {
    fs.rmSync('out', { recursive: true, force: true });
  }

  // Build Next.js app
  console.log('2. Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Copy Capacitor assets
  console.log('3. Copying mobile assets...');
  
  // Add Android platform if not exists
  console.log('4. Setting up Android platform...');
  try {
    execSync('npx cap add android', { stdio: 'inherit' });
  } catch (e) {
    console.log('Android platform already exists');
  }

  // Sync with Capacitor
  console.log('5. Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });

  console.log('\n✅ Mobile app build complete!');
  console.log('\nNext steps:');
  console.log('- Run "npx cap open android" to open in Android Studio');
  console.log('- Or run "npm run mobile:dev" to test in browser');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
