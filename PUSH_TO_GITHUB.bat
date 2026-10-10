@echo off
echo ========================================================
echo   SAFAR / TransitSync - Push Code to GitHub
echo ========================================================
echo.
cd /d "D:\SAFAR_Project"
echo Current directory: %cd%
echo.
echo Pushing code to https://github.com/AshwithReddy28/TransitSync_Intercity_Bus_Fleet_Booking_System.git...
echo.
"D:\PortableGit\cmd\git.exe" push -u origin main
echo.
echo ========================================================
echo Done! If you were asked to login, your browser should have opened.
echo ========================================================
pause
