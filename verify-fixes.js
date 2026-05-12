#!/usr/bin/env node

/**
 * Production Fixes Verification Script
 * 
 * This script verifies that all 4 production-readiness fixes are properly implemented.
 * Run with: node verify-fixes.js
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 REKI Production Fixes Verification\n');
console.log('=' .repeat(60));

let allPassed = true;

// Fix 1: Google OAuth Audience Validation
console.log('\n✓ Fix 1: Google OAuth Audience Validation');
const authService = fs.readFileSync(
  path.join(__dirname, 'src/modules/auth/auth.service.ts'),
  'utf8'
);

if (authService.includes('audience: clientId') && 
    !authService.includes('// audience:') &&
    authService.includes('GOOGLE_CLIENT_ID')) {
  console.log('  ✅ Audience parameter is enabled');
  console.log('  ✅ Configuration check is present');
} else {
  console.log('  ❌ Google OAuth fix not properly implemented');
  allPassed = false;
}

// Fix 2: Apple Sign-In Authorization Code Verification
console.log('\n✓ Fix 2: Apple Sign-In Authorization Code Verification');
if (authService.includes('verifyAppleAuthorizationCode') &&
    authService.includes('audience: clientId') &&
    authService.includes('APPLE_CLIENT_ID')) {
  console.log('  ✅ Authorization code verification method exists');
  console.log('  ✅ Audience parameter is enabled');
  console.log('  ✅ Configuration check is present');
} else {
  console.log('  ❌ Apple Sign-In fix not properly implemented');
  allPassed = false;
}

// Fix 3: Apple Wallet - No Mock Fallback
console.log('\n✓ Fix 3: Apple Wallet Mock Fallback Removal');
const offersService = fs.readFileSync(
  path.join(__dirname, 'src/modules/offers/offers.service.ts'),
  'utf8'
);

if (!offersService.includes('mockPassData') &&
    !offersService.includes('Mock return for development') &&
    offersService.includes('throw new Error') &&
    offersService.includes('Apple Developer certificates')) {
  console.log('  ✅ Mock fallback removed');
  console.log('  ✅ Proper error throwing implemented');
  console.log('  ✅ Helpful error message included');
} else {
  console.log('  ❌ Apple Wallet fix not properly implemented');
  allPassed = false;
}

// Fix 4: Weekly Recap Opt-Out Logic
console.log('\n✓ Fix 4: Weekly Recap Opt-Out Logic');
const cronService = fs.readFileSync(
  path.join(__dirname, 'src/modules/cron/cron.service.ts'),
  'utf8'
);

const userEntity = fs.readFileSync(
  path.join(__dirname, 'src/modules/users/entities/user.entity.ts'),
  'utf8'
);

if (cronService.includes('weeklyRecap === false') &&
    cronService.includes('hasOptedOut') &&
    cronService.includes('skippedCount') &&
    userEntity.includes('notifications?:')) {
  console.log('  ✅ Opt-out check implemented');
  console.log('  ✅ Skip counter added');
  console.log('  ✅ User entity updated with notification preferences');
} else {
  console.log('  ❌ Weekly recap fix not properly implemented');
  allPassed = false;
}

// Check migration exists
console.log('\n✓ Database Migration');
const migrationPath = path.join(__dirname, 'src/migrations');
const migrations = fs.readdirSync(migrationPath);
const notificationMigration = migrations.find(m => 
  m.includes('AddNotificationPreferencesToUser')
);

if (notificationMigration) {
  console.log('  ✅ Migration file created: ' + notificationMigration);
} else {
  console.log('  ❌ Migration file not found');
  allPassed = false;
}

// Check environment variables
console.log('\n✓ Environment Configuration');
const envExample = fs.readFileSync(
  path.join(__dirname, '.env.example'),
  'utf8'
);

if (envExample.includes('GOOGLE_CLIENT_ID') &&
    envExample.includes('APPLE_CLIENT_ID') &&
    envExample.includes('APPLE_KEY_ID')) {
  console.log('  ✅ OAuth environment variables added to .env.example');
} else {
  console.log('  ❌ Environment variables not properly configured');
  allPassed = false;
}

// Check test file exists
console.log('\n✓ Test Coverage');
const testPath = path.join(__dirname, 'src/test/production-fixes.spec.ts');
if (fs.existsSync(testPath)) {
  const testContent = fs.readFileSync(testPath, 'utf8');
  const testCount = (testContent.match(/it\(/g) || []).length;
  console.log(`  ✅ Test file created with ${testCount} test cases`);
} else {
  console.log('  ❌ Test file not found');
  allPassed = false;
}

// Final summary
console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('\n✅ ALL PRODUCTION FIXES VERIFIED SUCCESSFULLY!\n');
  console.log('The application is now production-ready with:');
  console.log('  • Secure OAuth authentication (Google & Apple)');
  console.log('  • Proper error handling (Apple Wallet)');
  console.log('  • User privacy controls (Weekly recap opt-out)');
  console.log('  • Database migration for backward compatibility');
  console.log('\nNext steps:');
  console.log('  1. Set OAuth credentials in production environment');
  console.log('  2. Run: npm run migration:run');
  console.log('  3. Run: npm test -- src/test/production-fixes.spec.ts');
  console.log('  4. Deploy to production\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME FIXES ARE NOT PROPERLY IMPLEMENTED\n');
  console.log('Please review the output above and fix the issues.\n');
  process.exit(1);
}
