@echo off
title Tesla Delivery Hub - Installation
echo.
echo   ========================================
echo   TESLA DELIVERY HUB - Installation
echo   Rennes Saint-Jacques
echo   ========================================
echo.

set HUB=%LOCALAPPDATA%\Tesla\DeliveryHub
if not exist "%HUB%" mkdir "%HUB%"
if not exist "%HUB%\templates" mkdir "%HUB%\templates"
if not exist "%HUB%\public" mkdir "%HUB%\public"
if not exist "%HUB%\downloads" mkdir "%HUB%\downloads"

echo [1/3] Downloading files...
powershell -Command "foreach($f in @('server/server.js','server/config.json','server/package.json','server/templates/page-de-garde.html','server/public/index.html')){ $u='https://raw.githubusercontent.com/BenTEsla/tesla-hub/main/'+$f; $p=Join-Path '%HUB%' ($f -replace '^server/',''); Write-Host ('  -> '+$p); Invoke-WebRequest -Uri $u -OutFile $p }"

echo.
echo [2/3] Installing dependencies...
cd /d "%HUB%"
call npm install express node-fetch@2 puppeteer-core pdf-to-printer --silent 2>nul

echo.
echo [3/3] Done! Starting server...
echo.
echo   ========================================
echo   1. Open http://localhost:3000 in Chrome
echo   2. Drag the red button to bookmarks bar
echo   3. Go to dro.tesla.com, click the bookmark!
echo   ========================================
echo.
start http://localhost:3000
node server.js
