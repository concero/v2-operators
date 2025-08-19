#!/bin/bash
set -euo pipefail

COMPOSE_FILE="docker/docker-compose.yml"
CONTAINER_NAME="relayer"
SERVICE_NAME="app"

echo "Checking if container '$CONTAINER_NAME' is running..."

# Check if container exists and is running
if docker ps --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container '$CONTAINER_NAME' is running. Recreating..."
    docker compose -f "$COMPOSE_FILE" up -d --force-recreate "$SERVICE_NAME"
elif docker ps -a --format "table {{.Names}}" | grep -q "^${CONTAINER_NAME}$"; then
    echo "Container '$CONTAINER_NAME' exists but is not running. Starting..."
    docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
else
    echo "Container '$CONTAINER_NAME' does not exist. Creating and starting..."
    docker compose -f "$COMPOSE_FILE" up -d "$SERVICE_NAME"
fi

echo "Container '$CONTAINER_NAME' is now running."
docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 