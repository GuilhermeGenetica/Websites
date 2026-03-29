#!/usr/bin/env python3
"""
SeqNode-OS — Ponto de entrada (raiz do projeto React)
Executa a partir da pasta frontend/:

    python run_server.py
    python run_server.py --host 127.0.0.1 --port 8080 --reload
"""
import sys
import os

# Garante que a pasta frontend/ está no PYTHONPATH para que
# 'core.server' seja encontrado correctamente pelo uvicorn
sys.path.insert(0, os.path.dirname(__file__))

from core.run_server import main

if __name__ == "__main__":
    main()
