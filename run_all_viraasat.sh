#!/bin/bash

# VIRAASAT FULL-STACK RUNNER
# Starts the Python (FastAPI) Backend and Next.js Frontend simultaneously.

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

cleanup() {
    echo -e "\n${BLUE}>>> Stopping VIRAASAT services and cleaning up ports...${NC}"
    lsof -ti:8000,9002 | xargs kill -9 2>/dev/null
    exit
}

trap cleanup INT TERM

echo -e "${BLUE}>>> Cleaning up existing processes on ports 8000 and 9002...${NC}"
lsof -ti:8000,9002 | xargs kill -9 2>/dev/null

PYTHON_CMD="python3"
if command -v python3.12 &>/dev/null; then
    PYTHON_CMD="python3.12"
elif [ -f "/opt/homebrew/bin/python3.12" ]; then
    PYTHON_CMD="/opt/homebrew/bin/python3.12"
fi

echo -e "${BLUE}>>> Preparing Python Backend on Port 8000 (using $PYTHON_CMD)...${NC}"

if [ ! -d "backend/venv" ] || ! backend/venv/bin/python -c "import uvicorn" 2>/dev/null; then
    echo -e "${BLUE}>>> Setting up Python virtual environment & dependencies...${NC}"
    rm -rf backend/venv
    $PYTHON_CMD -m venv backend/venv
    backend/venv/bin/pip install -r backend/requirements.txt
fi

echo -e "${BLUE}>>> Starting VIRAASAT Python Backend...${NC}"
(cd backend && ./venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000) &

echo -e "${GREEN}>>> Starting VIRAASAT Next.js Frontend (Port 9002)...${NC}"
cd frontend
rm -rf .next
npm run dev -- -p 9002 &
cd ..

echo -e "${BLUE}>>> VIRAASAT is now running!${NC}"
echo -e "Frontend: http://localhost:9002"
echo -e "Backend (API): http://localhost:8000"
echo -e "Press Ctrl+C to stop both services."

wait
