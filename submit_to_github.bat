@echo off
setlocal EnableDelayedExpansion

echo [BabyCoding] Checking Git installation...

:: 1. Try to find git in PATH
where git >nul 2>&1
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
    goto :FoundGit
)

:: 2. Try common installation paths
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    goto :FoundGit
)
if exist "C:\Program Files\Git\bin\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\bin\git.exe"
    goto :FoundGit
)
if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    goto :FoundGit
)

:: 3. Git not found
echo [Error] Git command not found in PATH or common locations.
pause
exit /b 1

:FoundGit
echo [BabyCoding] Using Git at: "!GIT_CMD!"

echo [BabyCoding] Initializing repository...
if not exist .git (
    "!GIT_CMD!" init
)

echo [BabyCoding] Adding files...
"!GIT_CMD!" add .

echo [BabyCoding] Committing changes...
"!GIT_CMD!" commit -m "v0.2.0 release: Fix UI interaction and improve error handling"

echo [BabyCoding] Checking current branch...
for /f "tokens=*" %%a in ('"!GIT_CMD!" branch --show-current') do set CURRENT_BRANCH=%%a
if "%CURRENT_BRANCH%"=="" set CURRENT_BRANCH=master

echo [BabyCoding] Renaming branch to main...
"!GIT_CMD!" branch -M main

echo [BabyCoding] Setting up remote...
"!GIT_CMD!" remote remove origin >nul 2>&1
"!GIT_CMD!" remote add origin https://github.com/wls6666/baby-coding.git

echo [BabyCoding] Pulling remote changes (rebase)...
"!GIT_CMD!" pull origin main --rebase

echo [BabyCoding] Pushing to GitHub...
"!GIT_CMD!" push -u origin main

if %errorlevel% neq 0 (
    echo [Error] Push failed. Trying force push...
    "!GIT_CMD!" push -f origin main
)

echo [BabyCoding] Done!
pause
