#!/bin/bash

# GPA Calculator Deploy Script

echo "=== Building and Deploying GPA Calculator ==="

# Build backend
echo "Building backend..."
cd /Users/mac/foo/gpa-calculator/backend
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

echo "Build successful!"

# Deploy to server
echo "Deploying to server..."
rsync -avz --delete /Users/mac/foo/gpa-calculator/backend/dist/ ubuntu@43.136.42.69:~/gpa-calculator/backend/dist/
rsync -avz --delete /Users/mac/foo/gpa-calculator/backend/package.json ubuntu@43.136.42.69:~/gpa-calculator/backend/

# Restart service on server
echo "Restarting service..."
ssh ubuntu@43.136.42.69 'cd ~/gpa-calculator/backend && npm install && pm2 restart gpa-backend'

echo "=== Deploy completed ==="
