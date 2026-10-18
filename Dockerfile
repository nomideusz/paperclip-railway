# Official Paperclip image plus a first-boot step that creates the admin
# account from Railway variables (public deployments have no browser claim).
ARG PAPERCLIP_VERSION=2026.1012.0
FROM ghcr.io/paperclipai/paperclip:${PAPERCLIP_VERSION}
# Railway serves the app on a public HTTPS domain: authenticated + public
# exposure (login required, explicit public URL), migrations applied on boot,
# client IPs taken from the one Railway edge hop for rate limits.
ENV PAPERCLIP_DEPLOYMENT_EXPOSURE=public \
    PAPERCLIP_MIGRATION_AUTO_APPLY=true \
    TRUST_PROXY=1
COPY railway-seed-admin.mjs /opt/railway/railway-seed-admin.mjs
COPY railway-entrypoint.sh /opt/railway/railway-entrypoint.sh
ENTRYPOINT ["/usr/bin/tini", "--", "/opt/railway/railway-entrypoint.sh"]
CMD ["node", "--import", "./server/node_modules/tsx/dist/loader.mjs", "server/dist/index.js"]
