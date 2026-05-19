@echo off
echo Iniciando DoMecanico...

start "Backend Django" cmd /k "cd /d %~dp0 && python manage.py runserver"

timeout /t 2 /nobreak > nul

start "Frontend React" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Sistema iniciado!
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo Admin Django: http://localhost:8000/admin
echo.
pause
