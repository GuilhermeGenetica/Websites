#!/usr/bin/env python3
"""
SeqNode-OS — Ponto de entrada do servidor
Uso rápido:
    python run_server.py
    python run_server.py --host 127.0.0.1 --port 8080 --reload
    python run_server.py --workers 4          # produção (sem reload)
    seqnode-server                            # via entry-point instalado
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys

# ── Compatibilidade Windows ────────────────────────────────────────────────────
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


# ── Logging básico antes do uvicorn assumir o controlo ────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("seqnode.server")


def _parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        prog="seqnode-server",
        description="SeqNode-OS API Server",
    )
    parser.add_argument(
        "--host",
        default=os.getenv("SEQNODE_HOST", "0.0.0.0"),
        help="Endereço de escuta (default: 0.0.0.0)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.getenv("SEQNODE_PORT", "8000")),
        help="Porta TCP (default: 8000)",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        default=False,
        help="Activar hot-reload (apenas desenvolvimento)",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=1,
        help="Número de workers uvicorn (produção; incompatível com --reload)",
    )
    parser.add_argument(
        "--log-level",
        default=os.getenv("SEQNODE_LOG_LEVEL", "info"),
        choices=["critical", "error", "warning", "info", "debug", "trace"],
        help="Nível de log do uvicorn (default: info)",
    )
    parser.add_argument(
        "--log-file",
        default=os.getenv("SEQNODE_LOG_FILE", "seqnode_engine.log"),
        help="Ficheiro de log (default: seqnode_engine.log)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> None:
    args = _parse_args(argv)

    # Garante que o directório de log existe
    log_dir = os.path.dirname(os.path.abspath(args.log_file))
    os.makedirs(log_dir, exist_ok=True)

    # Valida combinação de argumentos
    if args.reload and args.workers > 1:
        logger.warning(
            "--reload é incompatível com --workers > 1. "
            "A usar 1 worker com reload activado."
        )
        args.workers = 1

    # Garante que o projecto está no PYTHONPATH
    project_root = os.path.abspath(os.path.dirname(__file__))
    if project_root not in sys.path:
        sys.path.insert(0, project_root)

    try:
        import uvicorn
    except ImportError:
        logger.error(
            "uvicorn não encontrado. Execute: pip install 'uvicorn[standard]'"
        )
        sys.exit(1)

    logger.info(
        f"A iniciar SeqNode-OS em http://{args.host}:{args.port}  "
        f"(reload={args.reload}, workers={args.workers}, log={args.log_file})"
    )

    uvicorn.run(
        "core.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        workers=args.workers if not args.reload else 1,
        log_level=args.log_level,
        log_config=None,        # usa o logging já configurado pelo SeqNode
        access_log=True,
    )


if __name__ == "__main__":
    main()