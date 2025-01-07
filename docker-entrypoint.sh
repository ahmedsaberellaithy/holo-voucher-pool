#!/bin/sh

if [ "$NODE_ENV" = "development" ]; then
    echo "Starting in development mode..."
    npm run start:dev
else
    echo "Starting in production mode..."
    npm run build
    npm run start:prod
fi 