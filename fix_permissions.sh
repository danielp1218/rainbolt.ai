#!/bin/bash
# Run this script on your Google Cloud VM to fix permissions

# Set ownership and permissions for the uploads directory
sudo chown -R $USER:$USER /var/www/rainbolt.ai/backend/uploads
sudo chmod 755 /var/www/rainbolt.ai/backend/uploads
sudo chmod 644 /var/www/rainbolt.ai/backend/uploads/*.jpg 2>/dev/null || true

echo "Permissions fixed!"
echo "Current permissions:"
ls -la /var/www/rainbolt.ai/backend/uploads/
