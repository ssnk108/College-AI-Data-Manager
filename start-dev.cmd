@echo off
cd /d "%~dp0"
echo Starting College AI Data Manager...
echo Frontend should open at http://localhost:5173/
echo Backend should open at http://localhost:5000/
npm run dev
echo.
echo Dev server stopped. Check the error above.
pause
