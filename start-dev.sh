#!/bin/bash
echo "Starting backend..."
cd backend && npm run dev &
BACKEND_PID=$!
echo "Starting frontend..."
cd frontend && npm run dev &
FRONTEND_PID=$!
echo "Both running. Press Ctrl+C to stop both."
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
