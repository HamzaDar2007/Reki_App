@echo off
echo ========================================
echo REKI Backend - Database Setup
echo ========================================
echo.

echo Step 1: Checking database connection...
node setup-database.js
if errorlevel 1 (
    echo.
    echo ERROR: Database connection failed!
    echo Make sure PostgreSQL is running and credentials in .env are correct.
    pause
    exit /b 1
)

echo.
echo Step 2: Starting server to create tables...
echo (This will run for 10 seconds to let TypeORM create schema)
echo.

start /B npm run start:dev > server-init.log 2>&1

echo Waiting for TypeORM to create tables...
timeout /t 10 /nobreak > nul

echo.
echo Step 3: Verifying tables were created...
node setup-database.js

echo.
echo Step 4: Stopping temporary server...
taskkill /F /IM node.exe > nul 2>&1

echo.
echo ========================================
echo Setup complete! Now you can:
echo 1. npm run start:dev  (start development server)
echo 2. npm test           (run test suites)
echo ========================================
pause
