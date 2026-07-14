@echo off
setlocal
title AI LiveOps Night Market Launcher

cd /d "%~dp0"
set "GAME_EXE=%~dp0src-tauri\target\release\second-game.exe"

if not exist "%GAME_EXE%" (
  echo Preparing the desktop game. This may take a few minutes on first run.

  if not exist "node_modules" (
    echo Installing project dependencies...
    call npm install
    if errorlevel 1 (
      echo Failed to install dependencies.
      pause
      exit /b 1
    )
  )

  echo Building the desktop game...
  call npm run desktop:build
  if errorlevel 1 (
    echo Failed to build the desktop game.
    pause
    exit /b 1
  )
)

echo Starting AI LiveOps Night Market...
start "" "%GAME_EXE%"
endlocal
