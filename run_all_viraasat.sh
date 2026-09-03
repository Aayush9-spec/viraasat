#!/bin/bash

# VIRAASAT FULL-STACK RUNNER
# Starts the Python (FastAPI) Backend and Next.js Frontend simultaneously.

# Colors for logging
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cleanup function to kill background processes on script exit
cleanup() {
    echo -e "\n${BLUE}>>> Stopping VIRAASAT services and cleaning up ports...${NC}"
    lsof -ti:8000,9002 | xargs kill -9 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup INT TERM

echo -e "${BLUE}>>> Cleaning up existing processes on ports 8000 and 9002...${NC}"
lsof -ti:8000,9002 | xargs kill -9 2>/dev/null

echo -e "${BLUE}>>> Preparing Python Backend (Port 8000)...${NC}"

# Verify Python virtualenv health; recreate if corrupted or missing uvicorn
if [ ! -d "backend/venv" ] || ! backend/venv/bin/python3 -c "import uvicorn" 2>/dev/null; then
    echo -e "${BLUE}>>> Re-creating Python virtual environment & installing dependencies...${NC}"
    rm -rf backend/venv
    python3 -m venv backend/venv
    source backend/venv/bin/activate
    pip install --upgrade pip --quiet 2>/dev/null || true
    pip install -r backend/requirements.txt
else
    source backend/venv/bin/activate
fi

echo -e "${BLUE}>>> Starting VIRAASAT Python Backend...${NC}"
export PYTHONPATH=backend
uvicorn main:app --host 0.0.0.0 --port 8000 &

echo -e "${GREEN}>>> Starting VIRAASAT Next.js Frontend (Port 9002)...${NC}"
cd frontend
rm -rf .next
npm run dev -- -p 9002 &
cd ..

echo -e "${BLUE}>>> VIRAASAT is now running!${NC}"
echo -e "Frontend: http://localhost:9002"
echo -e "Backend (API): http://localhost:8000"
echo -e "Press Ctrl+C to stop both services."

# Keep script running to maintain the trap
wait
