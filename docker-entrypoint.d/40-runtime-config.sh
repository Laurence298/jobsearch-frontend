#!/bin/sh
set -e

# API_BASE_URL is read at container start so the image can be promoted
# between environments without rebuilding. Examples:
#   http://jobtracker-api:8000
#   https://jobtracker-api.example.com
#   /api   (same-origin, when nginx/NPM rewrites the prefix)
: "${API_BASE_URL:=}"

cat > /usr/share/nginx/html/config.js <<EOF
window.__APP_CONFIG__ = { apiBaseUrl: "${API_BASE_URL}" }
EOF
