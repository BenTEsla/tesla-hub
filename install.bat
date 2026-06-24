@echo off
echo.
echo   ========================================
echo   TESLA DELIVERY HUB - Installation
echo   ========================================
echo.

:: Check if Node.js exists
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found. Installing...
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Create directory
set HUB_DIR=%LOCALAPPDATA%\Tesla\DeliveryHub
if not exist "%HUB_DIR%" mkdir "%HUB_DIR%"

echo [1/4] Downloading server files from GitHub...

:: Download server files
powershell -Command "& { $token=''; $headers=@{}; $api='https://api.github.com/repos/BenTEsla/tesla-hub/contents/server'; $files=Invoke-RestMethod -Uri $api -Headers $headers; foreach($f in $files){ if($f.type -eq 'file'){ $path=Join-Path '%HUB_DIR%' $f.name; Write-Host ('  -> ' + $f.name); $raw=Invoke-RestMethod -Uri $f.download_url -Headers $headers; Set-Content -Path $path -Value $raw -Encoding UTF8 } }; $tplDir=Join-Path '%HUB_DIR%' 'templates'; if(!(Test-Path $tplDir)){New-Item -ItemType Directory -Path $tplDir | Out-Null}; $tplFiles=Invoke-RestMethod -Uri ($api+'/templates') -Headers $headers; foreach($f in $tplFiles){ if($f.type -eq 'file'){ $path=Join-Path $tplDir $f.name; Write-Host ('  -> templates/' + $f.name); Invoke-WebRequest -Uri $f.download_url -OutFile $path } }; $pubDir=Join-Path '%HUB_DIR%' 'public'; if(!(Test-Path $pubDir)){New-Item -ItemType Directory -Path $pubDir | Out-Null}; $pubFiles=Invoke-RestMethod -Uri ($api+'/public') -Headers $headers; foreach($f in $pubFiles){ if($f.type -eq 'file'){ $path=Join-Path $pubDir $f.name; Write-Host ('  -> public/' + $f.name); Invoke-WebRequest -Uri $f.download_url -OutFile $path } } }"

echo.
echo [2/4] Installing dependencies...
cd /d "%HUB_DIR%"
call npm install express node-fetch@2 puppeteer-core pdf-to-printer 2>nul

echo.
echo [3/4] Creating downloads directory...
if not exist "%HUB_DIR%\downloads" mkdir "%HUB_DIR%\downloads"

echo.
echo [4/4] Starting server...
echo.
echo   ========================================
echo   Open http://localhost:3000 in Chrome
echo   to install the bookmarklet!
echo   ========================================
echo.
start http://localhost:3000
node server.js
pause
