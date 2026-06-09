@echo off
REM Wrapper so double-clicking runs seed-via-api.js through Node.
REM Windows by default sends .js files to Windows Script Host, which
REM would error out -- this .bat forces Node to be the interpreter.
REM
REM IMPORTANT: the API must already be running before you run this,
REM because this script seeds the database over HTTP (not directly).

cd /d "%~dp0"
node "%~dp0seed-via-api.js"

echo.
echo --- Press any key to close ---
pause >nul
