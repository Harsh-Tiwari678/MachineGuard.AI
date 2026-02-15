#!/bin/bash
echo "🚀 Starting MachineGuard AI..."
echo "📊 Starting Pathway Pipeline..."

# Start Pathway in background
python pathway_pipeline.py &

# Store Pathway process ID
PATHWAY_PID=$!
echo "✅ Pathway started with PID: $PATHWAY_PID"

# Wait for Pathway to initialize
echo "⏳ Waiting for Pathway to initialize..."
sleep 5

# Start Flask server
echo "🌐 Starting Flask API server..."
gunicorn --bind 0.0.0.0:$PORT app:app --timeout 120 --workers 1

# If Flask stops, kill Pathway too
kill $PATHWAY_PID