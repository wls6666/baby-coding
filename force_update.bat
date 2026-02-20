@echo off
setlocal EnableDelayedExpansion

echo [BabyCoding] Finding Git...

:: 1. Try to find git in PATH
where git >nul 2>&1
if %errorlevel% equ 0 (
    set "GIT_CMD=git"
    goto :FoundGit
)

:: 2. Try common paths
if exist "C:\Program Files\Git\cmd\git.exe" (
    set "GIT_CMD=C:\Program Files\Git\cmd\git.exe"
    goto :FoundGit
)
if exist "%LOCALAPPDATA%\Programs\Git\cmd\git.exe" (
    set "GIT_CMD=%LOCALAPPDATA%\Programs\Git\cmd\git.exe"
    goto :FoundGit
)

echo [Error] Git not found. Please install Git and restart VS Code.
pause
exit /b 1

:FoundGit
echo [BabyCoding] Using Git: "!GIT_CMD!"

:: Ensure repo exists
if not exist .git (
    "!GIT_CMD!" init
)

:: Configure simple user identity for this repo (prevents commit errors)
"!GIT_CMD!" config user.email "babycoding@example.com"
"!GIT_CMD!" config user.name "BabyCoding User"

:: Force switch to main branch
"!GIT_CMD!" checkout -B main

:: Add all files
echo [BabyCoding] Adding files...
"!GIT_CMD!" add .

:: Commit
echo [BabyCoding] Committing...
"!GIT_CMD!" commit -m "Update project code"

:: Setup Remote
echo [BabyCoding] Setting remote...
"!GIT_CMD!" remote remove origin >nul 2>&1
"!GIT_CMD!" remote add origin https://github.com/wls6666/baby-coding.git

:: Force Push (The "Just make it work" option)
echo [BabyCoding] Uploading to GitHub (Force Push)...
"!GIT_CMD!" push -u origin main --force

if %errorlevel% equ 0 (
    echo.
    echo [Success] Upload complete!
    echo.
) else (
    echo.
    echo [Error] Upload failed. Please check your network or GitHub permissions.
    echo.
)

pause
