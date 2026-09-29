@echo off
REM Wrapper so double-clicking runs seed-data.js through Node.
REM Windows by default sends .js files to Windows Script Host, which
REM would error out -- this .bat forces Node to be the interpreter.

cd /d "%~dp0"
node "%~dp0seed-data.js"

echo.
echo --- Press any key to close ---
pause >nul
