
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building LittleForest APK...\n');

try {
  // Step 1: Build Next.js app
  console.log('1. Building Next.js app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Initialize Capacitor if needed
  console.log('2. Setting up Capacitor...');
  try {
    execSync('npx cap add android', { stdio: 'pipe' });
  } catch (e) {
    console.log('   Android platform already exists');
  }

  // Step 3: Sync with Capacitor
  console.log('3. Syncing with Capacitor...');
  execSync('npx cap sync android', { stdio: 'inherit' });

  // Step 4: Check if we have Android SDK
  console.log('4. Checking Android setup...');
  
  if (!fs.existsSync('android')) {
    throw new Error('Android platform not found. Run: npx cap add android');
  }

  // Step 5: Build APK using Capacitor's build command
  console.log('5. Building APK...');
  process.chdir('android');
  
  // Make gradlew executable
  if (fs.existsSync('./gradlew')) {
    execSync('chmod +x ./gradlew', { stdio: 'pipe' });
    
    // Try to build APK
    try {
      execSync('./gradlew assembleDebug --stacktrace', { stdio: 'inherit' });
    } catch (gradleError) {
      console.log('❌ Gradle build failed, trying alternative method...');
      process.chdir('..');
      execSync('npx cap build android --no-sync', { stdio: 'inherit' });
    }
  } else {
    console.log('❌ Gradle wrapper not found, using Capacitor build...');
    process.chdir('..');
    execSync('npx cap build android --no-sync', { stdio: 'inherit' });
  }
  
  // Check for APK
  const possibleApkPaths = [
    'android/app/build/outputs/apk/debug/app-debug.apk',
    'android/app/build/outputs/apk/release/app-release.apk'
  ];
  
  let apkFound = false;
  for (const apkPath of possibleApkPaths) {
    if (fs.existsSync(apkPath)) {
      console.log('\n✅ APK built successfully!');
      console.log(`📱 APK location: ${apkPath}`);
      console.log('\n🎉 Ready to install on your phone!');
      console.log('\nInstallation steps:');
      console.log('1. Download the APK file to your phone');
      console.log('2. Enable "Install from Unknown Sources" in Android Settings');
      console.log('3. Tap the APK file to install');
      console.log('4. Open LittleForest app and enjoy!');
      apkFound = true;
      break;
    }
  }
  
  if (!apkFound) {
    console.log('❌ APK not found in expected locations.');
    console.log('But the build completed - check android/app/build/outputs/ for APK files');
  }

} catch (error) {
  console.error('❌ Build failed:', error.message);
  console.log('\n🔧 Alternative: Use Replit Mobile App');
  console.log('1. Download Replit Mobile from Google Play Store');
  console.log('2. Sign in to your account');
  console.log('3. Open this project - works as mobile web app!');
  
  process.exit(1);
}
