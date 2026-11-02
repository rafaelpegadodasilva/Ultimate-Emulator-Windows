@echo off
setlocal EnableExtensions

rem O Electron/Chromium nao inicia de forma confiavel de unidades
rem compartilhadas pelo Parallels (PrlSF). O motor e copiado para o disco
rem local; ROMS, Runtime, Capas e todos os dados do Ultimate permanecem na
rem pasta compartilhada indicada abaixo.
set "UE_PORTABLE_ROOT=%~dp0"
if "%UE_PORTABLE_ROOT:~-1%"=="\" set "UE_PORTABLE_ROOT=%UE_PORTABLE_ROOT:~0,-1%"
set "UE_LOCAL_ENGINE=%LOCALAPPDATA%\UltimateEmulator-Engine"

if not exist "%UE_PORTABLE_ROOT%\Ultimate Emulator Engine.exe" (
  echo Nao foi encontrado: "%UE_PORTABLE_ROOT%\Ultimate Emulator Engine.exe"
  pause
  exit /b 1
)

if not exist "%UE_LOCAL_ENGINE%" mkdir "%UE_LOCAL_ENGINE%"

rem Robocopy atualiza apenas arquivos modificados. Nao leva ROMS, capas ou
rem Runtime: eles continuam sendo usados diretamente no W:.
robocopy "%UE_PORTABLE_ROOT%" "%UE_LOCAL_ENGINE%" /E /XO /FFT /R:1 /W:1 /NFL /NDL /NJH /NJS ^
  /XD "ROMS" "Capas" "Runtime" "Arquivos Brutos" "Lixeira - Jogos removidos" "UltimateEmulator_Moderno" "dist-win" ^
  /XF ".DS_Store" "*.log"
set "UE_COPY_RESULT=%ERRORLEVEL%"
if %UE_COPY_RESULT% GEQ 8 (
  echo Nao foi possivel preparar o motor local. Codigo %UE_COPY_RESULT%.
  pause
  exit /b %UE_COPY_RESULT%
)

> "%UE_LOCAL_ENGINE%\.ue-portable-root" echo %UE_PORTABLE_ROOT%

set "EMULADORES_PORTABLE_ROOT=%UE_PORTABLE_ROOT%"
rem Configuracoes do Electron tambem ficam no pacote portátil. O executável
rem permanece local somente porque o Chromium não inicia diretamente de PrlSF.
start "Ultimate Emulator" /D "%UE_LOCAL_ENGINE%" "%UE_LOCAL_ENGINE%\Ultimate Emulator Engine.exe" --ue-portable-root="%UE_PORTABLE_ROOT%" --user-data-dir="%UE_PORTABLE_ROOT%\ElectronData"
endlocal
