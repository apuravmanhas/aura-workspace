@echo off
echo ===================================================
echo   Starting Aura Workspace (God-Level 3D Edition)
echo ===================================================
echo.
echo Starting local server to bypass browser security for 3D modules...
echo Please wait a moment...

:: Start the browser to the new port 8080 (avoids IIS conflicts on 5500)
timeout /t 2 >nul
start http://localhost:8080/

:: Start the PowerShell HTTP server script
powershell -ExecutionPolicy Bypass -File ".\server.ps1"
