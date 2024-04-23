@echo off

node index
set NODE_ERRORLEVEL=%ERRORLEVEL%

if %NODE_ERRORLEVEL% NEQ 0 (
    echo Node index returned an error. Exiting...
    pause
    exit /b %NODE_ERRORLEVEL%
)

set "folder=%cd%\files\%lastFile%"
for /f "delims=" %%a in ('dir /b /od /a-d "%folder%\*.txt" 2^>nul') do set "latest=%%a"

if defined latest (
    start "" "%folder%\%latest%"
) else (
    echo No txt files found
)