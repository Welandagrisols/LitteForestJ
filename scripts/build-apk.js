
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Building LittleForest APK with Expo...\n');

try {
  // Step 1: Install dependencies
  console.log('1. Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Step 2: Fix Expo dependencies
  console.log('2. Fixing Expo dependencies...');
  execSync('npx expo install --fix', { stdio: 'inherit' });

  // Step 3: Check and configure EAS project
  console.log('3. Configuring EAS project...');
  try {
    execSync('npx eas project:info', { stdio: 'pipe' });
    console.log('EAS project already configured');
  } catch (error) {
    console.log('Initializing EAS project...');
    execSync('npx eas init --non-interactive', { stdio: 'inherit' });
  }

  // Step 4: Build APK with EAS
  console.log('4. Building APK with EAS...');
  execSync('npx eas build --platform android --profile preview --non-interactive', { stdio: 'inherit' });

  console.log('\n✅ APK build initiated successfully!');
  console.log('\n📱 Your APK will be available in the EAS dashboard when complete.');
  console.log('\nNext steps:');
  console.log('1. Check your EAS dashboard at: https://expo.dev/');
  console.log('2. Download the APK when build is complete');
  console.log('3. Install on your Android device');

} catch (error) {
  console.error('❌ Build failed:', error.message);

  console.log('\n🔧 Troubleshooting tips:');
  console.log('1. Make sure you are logged in to EAS: npx eas login');
  console.log('2. Check your eas.json configuration');
  console.log('3. Verify your Expo account has build credits');
  console.log('4. Make sure your EXPO_TOKEN is valid in GitHub secrets');

  process.exit(1);
}
