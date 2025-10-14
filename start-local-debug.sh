#!/bin/bash

# SwissAI Tax - Local Debug Setup
# This script starts both backend and frontend for local debugging

echo "================================================"
echo "SwissAI Tax - Local Debug Environment"
echo "================================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is already running
if lsof -ti:8000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Backend already running on port 8000${NC}"
else
    echo -e "${GREEN}Starting backend...${NC}"
    cd backend
    source venv/bin/activate
    python -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload --log-level info &
    BACKEND_PID=$!
    cd ..
    sleep 3
    echo -e "${GREEN}Backend started (PID: $BACKEND_PID)${NC}"
fi

# Check if frontend is already running
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${YELLOW}Frontend already running on port 3000${NC}"
else
    echo -e "${GREEN}Starting frontend...${NC}"
    npm start &
    FRONTEND_PID=$!
    echo -e "${GREEN}Frontend starting (PID: $FRONTEND_PID)${NC}"
fi

echo ""
echo "================================================"
echo -e "${GREEN}Local Debug Environment Ready!${NC}"
echo "================================================"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs:"
echo "  Backend:  tail -f backend/logs/*.log"
echo "  Frontend: Check browser console"
echo ""
echo "To stop services:"
echo "  pkill -f 'uvicorn app:app'"
echo "  pkill -f 'react-scripts start'"
echo ""
