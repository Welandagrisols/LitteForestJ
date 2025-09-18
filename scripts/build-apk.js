
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building LittleForest APK directly...\n');

try {
  // Ensure mobile build is complete
  console.log('1. Building mobile app...');
  execSync('npm run mobile:build', { stdio: 'inherit' });

  // Build APK using Gradle directly
  console.log('2. Building APK with Gradle...');
  process.chdir('android');
  
  // Make gradlew executable
  execSync('chmod +x ./gradlew', { stdio: 'inherit' });
  
  // Build debug APK
  execSync('./gradlew assembleDebug', { stdio: 'inherit' });
  
  // Check if APK was created
  const apkPath = 'app/build/outputs/apk/debug/app-debug.apk';
  if (fs.existsSync(apkPath)) {
    console.log('\n✅ APK built successfully!');
    console.log(`📱 APK location: android/${apkPath}`);
    console.log('\nTo download:');
    console.log('1. Navigate to the android/app/build/outputs/apk/debug/ folder');
    console.log('2. Download app-debug.apk to your phone');
    console.log('3. Enable "Install from Unknown Sources" on your phone');
    console.log('4. Install the APK');
  } else {
    console.log('❌ APK not found. Building with alternative method...');
    
    // Alternative: Build release APK
    execSync('./gradlew assembleRelease', { stdio: 'inherit' });
  }

} catch (error) {
  console.error('❌ APK build failed:', error.message);
  console.log('\nTrying alternative build method...');
  
  try {
    // Fallback: Use capacitor build
    process.chdir('..');
    execSync('npx cap build android', { stdio: 'inherit' });
  } catch (fallbackError) {
    console.error('❌ Fallback build also failed:', fallbackError.message);
    process.exit(1);
  }
}
