@echo off
echo ============================================
echo   TESLA DELIVERY HUB - Installation
echo   Rennes Saint-Jacques
echo ============================================
echo.

:: Check if Node.js is available
where node >nul 2>&1
if %errorlevel%==0 (
    echo [OK] Node.js found
    goto :install
)

:: Check Nova bundled Node
if exist "%LOCALAPPDATA%\Nova\Binaries\node\24.16.0\node.exe" (
    set "NODE=%LOCALAPPDATA%\Nova\Binaries\node\24.16.0\node.exe"
    set "NPM=%LOCALAPPDATA%\Nova\Binaries\node\24.16.0\npm.cmd"
    echo [OK] Using Nova Node.js
    goto :install
)

echo [ERROR] Node.js not found!
echo Install Nova Desktop or Node.js first.
pause
exit /b 1

:install
echo.
echo [1/3] Creating project folder...
set "HUB=%LOCALAPPDATA%\Temp\opencode\tesla-delivery-hub"
if not exist "%HUB%\server" mkdir "%HUB%\server"

echo [2/3] Downloading from GitHub...
cd /d "%HUB%"
if exist "%LOCALAPPDATA%\Temp\opencode\git\cmd\git.exe" (
    "%LOCALAPPDATA%\Temp\opencode\git\cmd\git.exe" clone https://github.com/BenTEsla/tesla-hub.git temp-clone 2>nul
    xcopy /s /y temp-clone\* . >nul 2>nul
    rmdir /s /q temp-clone 2>nul
) else (
    echo [INFO] Git not found - copying from network...
    echo Please copy server files manually from Ben's PC or GitHub
)

echo [3/3] Installing dependencies...
cd /d "%HUB%\server"
if defined NPM (
    call "%NPM%" install 2>nul
) else (
    call npm install 2>nul
)

echo.
echo ============================================
echo   Installation complete!
echo ============================================
echo.
echo Starting server...
echo.

:: Open firewall
netsh advfirewall firewall add rule name="Tesla Delivery Hub" dir=in action=allow protocol=TCP localport=3000 >nul 2>nul

:: Start server
if defined NODE (
    "%NODE%" server.js
) else (
    node server.js
)

pause
