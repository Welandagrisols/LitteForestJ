
#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔧 Starting mobile development server...\n');

try {
  // Build the app first
  console.log('Building app...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Sync with Capacitor
  console.log('Syncing with Capacitor...');
  execSync('npx cap sync', { stdio: 'inherit' });
  
  // Run in browser with mobile viewport
  console.log('Starting Capacitor development server...');
  execSync('npx cap run android --livereload --external', { stdio: 'inherit' });
  
} catch (error) {
  console.error('❌ Development server failed:', error.message);
  process.exit(1);
}
