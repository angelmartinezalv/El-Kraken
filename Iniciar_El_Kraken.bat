@echo off
chcp 65001 >nul
title El Kraken POS
cd /d "%~dp0"

echo ========================================
echo   Iniciando El Kraken POS...
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
    echo ERROR: No se encontro Node.js instalado en esta computadora.
    echo.
    echo Para usar El Kraken, primero instala Node.js una sola vez desde:
    echo   https://nodejs.org
    echo ^(descarga la version "LTS" e instala con "siguiente, siguiente, finalizar"^)
    echo.
    echo Despues de instalarlo, vuelve a abrir este archivo.
    echo.
    pause
    exit /b 1
)

echo Abriendo el navegador en unos segundos...
start "" cmd /c "timeout /t 2 >nul && start http://localhost:3000"

node server.js

pause
