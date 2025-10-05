#!/bin/bash
# Run this script on your Google Cloud VM to fix permissions

echo "Fixing permissions for rainbolt.ai backend..."

# Get the user running the uvicorn service (usually www-data or your username)
UVICORN_USER=$(ps aux | grep uvicorn | grep -v grep | awk '{print $1}' | head -n 1)

if [ -z "$UVICORN_USER" ]; then
    echo "Warning: Could not detect uvicorn user, using www-data as default"
    UVICORN_USER="www-data"
fi

echo "Detected uvicorn running as user: $UVICORN_USER"

# Create uploads directory if it doesn't exist
sudo mkdir -p /var/www/rainbolt.ai/backend/uploads

# Set ownership to the uvicorn user
sudo chown -R $UVICORN_USER:$UVICORN_USER /var/www/rainbolt.ai/backend/uploads

# Set directory permissions: rwxrwxrwx (777) to allow all operations
sudo chmod 777 /var/www/rainbolt.ai/backend/uploads

# Set file permissions for existing files: rw-rw-rw- (666)
sudo chmod 666 /var/www/rainbolt.ai/backend/uploads/*.jpg 2>/dev/null || true

echo ""
echo "Permissions fixed!"
echo ""
echo "Directory permissions:"
ls -ld /var/www/rainbolt.ai/backend/uploads/
echo ""
echo "File permissions:"
ls -lh /var/www/rainbolt.ai/backend/uploads/ | head -n 10

echo ""
echo "If you still have issues, make sure your uvicorn service is running as: $UVICORN_USER"
