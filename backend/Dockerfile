FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY backup.js collection-repository.js correction-repository.js db.js import-osm.js migrations.js place-repository.js seed.js server.js seed-data.json ./

ENV PORT=8080
ENV DB_PATH=/data/places.db
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8080/healthz').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# The shared SQLite bind mount must be writable by both backend and CMS. Start
# as root only long enough to normalize its ownership, then run the application
# as the unprivileged node user used by the CMS image.
CMD ["sh", "-c", "chown -R node:node /data && exec setpriv --reuid=node --regid=node --init-groups sh -c 'node seed.js && exec node server.js'"]
