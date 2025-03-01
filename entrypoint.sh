#!/bin/sh
chown -R bunjs:nodejs /tmp/myenv
if [ ! -f /var/lib/myenv/myenv.db ]; then
    echo "Creating database"
    bunx prisma generate
    bunx prisma migrate deploy 
fi
echo "Starting server"

exec "$@"