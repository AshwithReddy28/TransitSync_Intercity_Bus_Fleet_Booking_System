@echo off
echo ========================================================
echo   STARTING SAFAR FRONTEND (Accessible on Mobile and PC)
echo ========================================================
echo.
cd /d "D:\SAFAR_Project\frontend"
echo Running on:
echo   - Local PC: http://localhost:5173
echo   - Mobile:   http://40.0.53.140:5173
echo.
npm run dev -- --host
pause
