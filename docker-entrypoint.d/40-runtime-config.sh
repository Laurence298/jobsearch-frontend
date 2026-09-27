#!/bin/sh
set -e

# API_BASE_URL is read at container start so the image can be promoted
# between environments without rebuilding. Examples:
#   /api   (same-origin, proxied to jobtracker-app by nginx)
#   https://jobtracker-api.example.com
# Never give the browser an internal Docker hostname or a private HTTP URL
# when the frontend can be loaded over HTTPS.
: "${API_BASE_URL:=/api}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { apiBaseUrl: "${API_BASE_URL}" }
EOF
