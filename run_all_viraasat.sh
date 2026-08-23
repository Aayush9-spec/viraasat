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
    # Kill backend and frontend processes by port
    lsof -ti:8000,9002 | xargs kill -9 2>/dev/null
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup INT TERM

echo -e "${BLUE}>>> Cleaning up existing processes on ports 8000 and 9002...${NC}"
lsof -ti:8000,9002 | xargs kill -9 2>/dev/null

echo -e "${BLUE}>>> Preparing Python Backend (Port 8000)...${NC}"
# Check for virtual environment
if [ ! -d "backend/venv" ]; then
    echo -e "${BLUE}>>> Creating virtual environment...${NC}"
    python3 -m venv backend/venv
fi

# Activate virtual environment and install dependencies
source backend/venv/bin/activate
pip install -r backend/requirements.txt --quiet

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
