@echo off
REM ============================================================
REM  build-windows.bat — Compila SeqNode Agent GUI para:
REM    PARTE 1: Windows x86_64 / arm64  (nativo)
REM    PARTE 2: Linux x86_64            (via WSL2, se disponivel)
REM    PARTE 3: macOS                   (requer GitHub Actions ou Mac)
REM
REM  Requisito: py 3.10+ com "Add to PATH"
REM    https://www.python.org/downloads/
REM
REM  No VS Code: abra um terminal PowerShell/CMD (NAO o terminal WSL)
REM  e execute este ficheiro na pasta do agente.
REM ============================================================

setlocal enabledelayedexpansion

echo.
echo  =====================================================
echo   SeqNode Agent -- Build Multi-Plataforma
echo  =====================================================
echo.

REM ── Verificar Python ──────────────────────────────────────────────────────
py --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Python nao encontrado.
    echo.
    echo  Instale em https://www.python.org/downloads/
    echo  Marque "Add Python to PATH" na instalacao.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('py --version') do echo  Python: %%v

if not exist "downloads" mkdir downloads
echo  Saida:  %CD%\downloads
echo.

REM ============================================================
REM  PARTE 1 -- Windows (nativo)
REM ============================================================
echo  -------------------------------------------------------
echo  PARTE 1 ^| Windows
echo  -------------------------------------------------------
echo.

echo  Instalando dependencias...
pip install pyinstaller websockets psutil --quiet
if errorlevel 1 (
    echo [ERRO] Falha nas dependencias.
    pause
    exit /b 1
)

set ARCH=x86_64
py -c "import platform; m=platform.machine().lower(); exit(0 if 'arm' not in m else 1)" >nul 2>&1
if errorlevel 1 set ARCH=arm64

set WIN_OUT=seqnode-agent-windows-%ARCH%.exe
echo  Compilando: %WIN_OUT%...

pyinstaller ^
    --onefile ^
    --windowed ^
    --name seqnode-agent ^
    --hidden-import websockets ^
    --hidden-import websockets.legacy ^
    --hidden-import websockets.legacy.client ^
    --hidden-import websockets.legacy.server ^
    --hidden-import websockets.asyncio ^
    --hidden-import websockets.asyncio.client ^
    --hidden-import websockets.asyncio.server ^
    --hidden-import psutil ^
    --hidden-import psutil._pswindows ^
    --hidden-import config ^
    --hidden-import executor ^
    --hidden-import monitor ^
    --hidden-import security ^
    --hidden-import ws_client ^
    --exclude-module unittest ^
    --exclude-module doctest ^
    --exclude-module pdb ^
    --exclude-module xmlrpc ^
    --exclude-module ftplib ^
    --exclude-module imaplib ^
    --exclude-module smtplib ^
    --manifest seqnode-agent.manifest ^
    --noupx ^
    --clean ^
    agent_gui.py

if errorlevel 1 (
    echo [ERRO] Compilacao Windows falhou.
    pause
    exit /b 1
)

move /y "dist\seqnode-agent.exe" "downloads\%WIN_OUT%" >nul
rmdir /s /q build >nul 2>&1
rmdir /s /q dist  >nul 2>&1

echo [OK]   downloads\%WIN_OUT%
echo.

REM ============================================================
REM  PARTE 2 -- Linux (via WSL2)
REM ============================================================
echo  -------------------------------------------------------
echo  PARTE 2 ^| Linux (via WSL2)
echo  -------------------------------------------------------
echo.

wsl --status >nul 2>&1
if errorlevel 1 (
    echo [SKIP] WSL2 nao encontrado.
    echo        Ative o WSL2 ou use GitHub Actions para Linux.
    goto :part3
)

wsl bash -c "test -f ~/agent/agent_gui.py" >nul 2>&1
if errorlevel 1 (
    echo [SKIP] Ficheiros nao encontrados em ~/agent/ no WSL.
    goto :part3
)

echo  Compilando Linux via WSL2...
wsl bash -c "bash ~/agent/build.sh 2>&1"
if errorlevel 1 (
    echo [ERRO] Build Linux falhou.
    goto :part3
)

REM Copiar binario Linux do WSL para downloads/ Windows
for /f "tokens=*" %%F in ('wsl bash -c "ls ~/agent/downloads/seqnode-agent-linux-* 2>/dev/null | tail -1"') do set "WSL_BIN=%%F"
if not defined WSL_BIN (
    echo [ERRO] Binario Linux nao encontrado apos build.
    goto :part3
)
for /f "tokens=*" %%U in ('wsl wslpath -w "!WSL_BIN!" 2^>nul') do set "WIN_UNC=%%U"
if defined WIN_UNC (
    copy /y "!WIN_UNC!" "downloads\" >nul 2>&1
    for %%N in ("!WIN_UNC!") do echo [OK]   downloads\%%~nxN
) else (
    echo [SKIP] Copie manualmente: !WSL_BIN!
)
echo.

:part3
REM ============================================================
REM  PARTE 3 -- macOS (informativo)
REM ============================================================
echo  -------------------------------------------------------
echo  PARTE 3 ^| macOS (Apple Silicon e Intel)
echo  -------------------------------------------------------
echo.
echo  macOS NAO pode ser compilado a partir do Windows.
echo.
echo  Opcao A -- GitHub Actions (gratis, recomendado):
echo    1. git push para GitHub
echo    2. Actions ^> "Build All Platforms" ^> Run workflow
echo    3. Download dos 4 binarios gerados automaticamente
echo.
echo    Workflow: .github/workflows/build-all.yml
echo.
echo  Opcao B -- Em um Mac:
echo    bash build.sh
echo    Gera: seqnode-agent-macos-arm64
echo          seqnode-agent-macos-x86_64
echo.

REM ============================================================
REM  Resumo
REM ============================================================
echo  -------------------------------------------------------
echo  Ficheiros gerados em downloads\:
echo  -------------------------------------------------------
dir /b "downloads\seqnode-agent-*" 2>nul || echo  (nenhum)
echo.
echo  Upload para Hostinger: public_html/downloads/agent/
echo  -------------------------------------------------------
echo.
pause
