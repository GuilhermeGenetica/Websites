#!/bin/bash
# ============================================================
#  build.sh — Compila SeqNode Agent GUI para Linux ou macOS
#  Execute a partir da pasta /agent/:  bash build.sh
#
#  Output:  downloads/seqnode-agent-<os>-<arch> (Linux)
#           downloads/seqnode-agent-macos-<arch>.dmg (macOS)
#
#  Para Windows: use build-windows.bat no Windows nativo.
#  Para todos os OS de uma vez: GitHub Actions (build-all.yml).
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

OUT_DIR="$SCRIPT_DIR/downloads"
mkdir -p "$OUT_DIR"

VERSION=$(python3 -c "import config; print(config.VERSION)" 2>/dev/null || echo "1.0.0")
SYSTEM=$(python3 -c "import platform; s=platform.system().lower(); print('macos' if s=='darwin' else s)")
ARCH=$(python3 -c "import platform; a=platform.machine().lower(); print('arm64' if a in ('arm64','aarch64') else 'x86_64')")
FLAT_NAME="seqnode-agent-${SYSTEM}-${ARCH}"

echo "=== SeqNode Agent Build v${VERSION} — ${SYSTEM}/${ARCH} ==="
echo ""

# ── Step 1: Python zip (Option A, cross-platform) ────────────────────────────
echo "Step 1/2 — Criando pacote Python (zip)..."

export AGENT_DIR="$SCRIPT_DIR"
export OUT_DIR

python3 - <<'PYEOF'
import zipfile, textwrap, os
from pathlib import Path

agent_dir = Path(os.environ["AGENT_DIR"])
zip_path  = Path(os.environ["OUT_DIR"]) / "seqnode-agent-python.zip"

py_files = ["agent.py", "config.py", "executor.py",
            "monitor.py", "security.py", "ws_client.py"]

readme = textwrap.dedent("""\
SeqNode Agent — Python Package
==============================

Requirements
------------
Python 3.10+  (https://www.python.org/downloads/)

Quick Start (Linux / macOS)
---------------------------
1. Extraia este zip, ex: ~/seqnode-agent/
2. pip install websockets psutil
3. python agent.py init \\
       --server wss://api.seqnode.onnetweb.com/ws/agent \\
       --token  YOUR_TOKEN \\
       --workspace ~/seqnode-workspace
4. python agent.py start           # foreground
   python agent.py start --daemon  # background

Quick Start (Windows — cmd.exe)
--------------------------------
1. Extraia este zip, ex: C:\\seqnode-agent\\
2. pip install websockets psutil
3. python agent.py init --server wss://api.seqnode.onnetweb.com/ws/agent ^
       --token YOUR_TOKEN --workspace %USERPROFILE%\\seqnode-workspace
4. python agent.py start

Comandos
--------
  python agent.py status
  python agent.py stop

Mais info: https://seqnode.onnetweb.com/help
""")

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
    for f in py_files:
        zf.write(agent_dir / f, f"seqnode-agent/{f}")
    zf.writestr("seqnode-agent/requirements.txt", "websockets>=12.0\npsutil>=5.9\n")
    zf.writestr("seqnode-agent/README.txt", readme)

print(f"  Criado: {zip_path}  ({zip_path.stat().st_size:,} bytes)")
PYEOF

export AGENT_DIR="$SCRIPT_DIR"
export OUT_DIR

# ── Step 2: Standalone binary (GUI) ──────────────────────────────────────────
echo ""
echo "Step 2/2 — Compilando executável GUI (${FLAT_NAME})..."

pip install pyinstaller websockets psutil --quiet

# macOS: garante que tkinter esteja disponível
if [ "$SYSTEM" = "macos" ]; then
    echo "  (macOS: verificando tkinter...)"
    python3 -c "import tkinter" 2>/dev/null || {
        echo "  AVISO: tkinter não encontrado via python3 padrao. O workflow deve instalar."
    }
fi

# Linux: instala tk se necessário
if [ "$SYSTEM" = "linux" ]; then
    python3 -c "import tkinter" 2>/dev/null || {
        echo "  Instalando tkinter..."
        if command -v apt-get &>/dev/null; then
            sudo apt-get install -y python3-tk tk-dev --quiet
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y python3-tkinter --quiet
        elif command -v pacman &>/dev/null; then
            sudo pacman -Sy --noconfirm tk
        fi
    }
fi

pyinstaller \
    --onefile \
    --windowed \
    --name seqnode-agent \
    --hidden-import websockets \
    --hidden-import websockets.legacy \
    --hidden-import websockets.legacy.client \
    --hidden-import websockets.legacy.server \
    --hidden-import websockets.asyncio \
    --hidden-import websockets.asyncio.client \
    --hidden-import websockets.asyncio.server \
    --hidden-import psutil \
    --hidden-import psutil._pslinux \
    --hidden-import psutil._psosx \
    --hidden-import config \
    --hidden-import executor \
    --hidden-import monitor \
    --hidden-import security \
    --hidden-import ws_client \
    --exclude-module unittest \
    --exclude-module doctest \
    --exclude-module pdb \
    --exclude-module xmlrpc \
    --exclude-module ftplib \
    --exclude-module imaplib \
    --exclude-module smtplib \
    --strip \
    --noupx \
    --clean \
    agent_gui.py

# Processamento de ficheiros pós-compilação (Linux vs macOS)
if [ "$SYSTEM" = "macos" ]; then
    echo "  Empacotando macOS App em DMG..."
    mkdir -p dist/dmg_folder
    
    # A flag --windowed gera um diretório .app no macOS
    if [ -d "dist/seqnode-agent.app" ]; then
        cp -R "dist/seqnode-agent.app" "dist/dmg_folder/"
    else
        cp "dist/seqnode-agent" "dist/dmg_folder/"
    fi
    
    # Criar a imagem DMG final na pasta downloads
    hdiutil create -volname "SeqNode Agent" -srcfolder dist/dmg_folder -ov -format UDZO "$OUT_DIR/seqnode-agent-v${VERSION}-macOS.dmg"
    echo "  Compilado: downloads/seqnode-agent-v${VERSION}-macOS.dmg  ($(du -sh "$OUT_DIR/seqnode-agent-v${VERSION}-macOS.dmg" | cut -f1))"
else
    # Mover binário plano no Linux
    mv "dist/seqnode-agent" "$OUT_DIR/$FLAT_NAME"
    chmod +x "$OUT_DIR/$FLAT_NAME"
    echo "  Compilado: downloads/${FLAT_NAME}  ($(du -sh "$OUT_DIR/$FLAT_NAME" | cut -f1))"
fi

# Clean PyInstaller artifacts
rm -rf build/ dist/

echo ""
echo "✔  Pronto. Ficheiros em downloads/:"
ls -lh "$OUT_DIR"
echo ""
echo "Upload para Hostinger: public_html/downloads/agent/"