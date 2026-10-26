Production deployment uses Docker Compose on the VPS and SSH on port 443.

GitHub Actions requires HOST, USERNAME, and SSH_PRIVATE_KEY. SSH_PORT defaults to 443. The server .env file must be provisioned before deployment and is never committed.

Frontend: https://admission.dadu.edu.et, loopback port 3021. Set STRAPI_API_TOKEN in the server .env to a Strapi API token. Keep this token server-side.

Deploy with docker compose up -d --build --wait. Do not remove database or uploads volumes during redeployment.
