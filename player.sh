#!/bin/bash

# Live TV Player Activation Script
# This script activates the virtual environment and starts the application

echo "🔧 Activating Live TV Player..."
echo "================================"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "❌ Virtual environment not found!"
    echo "Please run './setup_venv.sh' first to set up the environment."
    exit 1
fi

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/bin/activate

echo "🚀 Starting Live TV Player..."
echo ""
echo "📡 Server will be available at: http://localhost:7734"
echo "🛑 Press Ctrl+C to stop the server"
echo ""
echo "================================"

# Start the application
python run.py
