#!/bin/sh
# Start the admin seed next to the server; it waits for /api/health, does its
# one-time work and exits.
node /opt/railway/railway-seed-admin.mjs &
exec docker-entrypoint.sh "$@"
