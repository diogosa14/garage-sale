@echo off
cd /d "%~dp0"
git add -A
git commit -m "🔄 Atualização automática - %date% %time%"
git push origin master
echo.
echo ✅ Atualização enviada para o GitHub!
pause
