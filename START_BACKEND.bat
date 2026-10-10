@echo off
echo ========================================================
echo   STARTING SAFAR SPRING BOOT BACKEND
echo ========================================================
echo.
cd /d "D:\SAFAR_Project\backend"
echo Compiling and running Spring Boot API on port 8080...
echo.
java -jar target/transitsync-backend-1.0.0.jar
pause
