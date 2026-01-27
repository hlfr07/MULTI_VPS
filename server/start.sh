#!/bin/bash

echo "Starting DroidVPS Dashboard Server..."
echo "======================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Install it with: pkg install nodejs"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Getting network information..."
IP=$(hostname -I | awk '{print $1}')
PORT=${PORT:-3001}

echo ""
echo "Server will be accessible at:"
echo "  http://$IP:$PORT"
echo "  http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
