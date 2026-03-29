#!/bin/bash
# ============================================================
#  SeqNode-OS — Start/manage the FastAPI backend on Oracle VPS
#  Usage: bash start-backend.sh [start|stop|restart|status|logs]
# ============================================================

SEQNODE_DIR="/home/ubuntu/seqnode"        
# VENV_DIR="$SEQNODE_DIR/.venv"     
VENV_DIR="/home/ubuntu/miniforge3/envs/seqnode"
LOG_FILE="/var/log/seqnode/api.log"
PID_FILE="/var/run/seqnode-api.pid"
PORT=8000

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

mkdir -p /var/log/seqnode

cmd="${1:-start}"

start() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo -e "${YELLOW}SeqNode API is already running (PID $(cat $PID_FILE))${NC}"
        return 0
    fi

    echo -e "${GREEN}Starting SeqNode-OS FastAPI backend...${NC}"
    cd "$SEQNODE_DIR" || { echo -e "${RED}Directory $SEQNODE_DIR not found${NC}"; exit 1; }

    # if [ -d "$VENV_DIR" ]; then
    #     source "$VENV_DIR/bin/activate"
    # fi

    # nohup /home/ubuntu/venv/bin/python -m uvicorn core.server:app \
    nohup "$VENV_DIR/bin/python" -m uvicorn core.server:app \
        --host 0.0.0.0 \
        --port $PORT \
        --workers 2 \
        --log-level info \
        >> "$LOG_FILE" 2>&1 &

    echo $! > "$PID_FILE"
    sleep 2

    if kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo -e "${GREEN}✓ Started (PID $(cat $PID_FILE)) — listening on 127.0.0.1:$PORT${NC}"
        echo -e "  Logs: tail -f $LOG_FILE"
    else
        echo -e "${RED}✗ Failed to start. Check logs: $LOG_FILE${NC}"
        exit 1
    fi
}

stop() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo "Stopping SeqNode API (PID $(cat $PID_FILE))..."
        kill "$(cat $PID_FILE)"
        rm -f "$PID_FILE"
        echo -e "${GREEN}Stopped.${NC}"
    else
        echo "SeqNode API is not running."
    fi
}

status() {
    if [ -f "$PID_FILE" ] && kill -0 "$(cat $PID_FILE)" 2>/dev/null; then
        echo -e "${GREEN}● SeqNode API is RUNNING (PID $(cat $PID_FILE))${NC}"
        if curl -sf "http://127.0.0.1:$PORT/api/system/info" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓ FastAPI responding on port $PORT${NC}"
        else
            echo -e "  ${YELLOW}⚠ Process running but API not responding yet${NC}"
        fi
    else
        echo -e "${RED}● SeqNode API is STOPPED${NC}"
        echo -e "  Run: bash start-backend.sh start"
    fi
}

logs() {
    tail -n 100 -f "$LOG_FILE"
}

case "$cmd" in
    start)   start   ;;
    stop)    stop    ;;
    restart) stop; sleep 1; start ;;
    status)  status  ;;
    logs)    logs    ;;
    *)       echo "Usage: $0 {start|stop|restart|status|logs}" ;;
esac