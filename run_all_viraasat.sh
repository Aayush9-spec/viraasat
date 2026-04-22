#!/bin/bash

# VIRAASAT FULL-STACK RUNNER
# Starts the Python (FastAPI) Backend and Next.js Frontend simultaneously.

# Colors for logging
GREEN='\033[0-32m'
BLUE='\033[0-34m'
NC='\033[0m' # No Color

echo -e "${BLUE}>>> Starting VIRAASAT Python Backend (Port 8000)...${NC}"
# Use absolute path to python binaries found earlier
export PATH="/opt/homebrew/bin:$PATH"

# Install backend dependencies if not present
pip3 install -r backend/requirements.txt --quiet

# Start FastAPI in background
uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

echo -e "${GREEN}>>> Starting VIRAASAT Next.js Frontend (Port 9002)...${NC}"
npm run dev -- -p 9002 &
FRONTEND_PID=$!

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; echo -e '\n${BLUE}>>> Services stopped.${NC}'; exit" INT TERM

echo -e "${BLUE}>>> VIRAASAT is now running!${NC}"
echo -e "Frontend: http://localhost:9002"
echo -e "Backend (API): http://localhost:8000"
echo -e "Press Ctrl+C to stop both services."

# Keep script running
wait
