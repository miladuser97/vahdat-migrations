# Environment Variable Matrix

| Variable | Type | Level | Local Default | Staging Requirement | Production Requirement |
|---|---|---|---|---|---|
| NODE_ENV | System | Build | development | production | production |
| NEXT_PUBLIC_SITE_URL | URL | Public | http://localhost:3000 | https://staging.tahririno.ir | https://tahririno.ir |
| NEXT_PUBLIC_API_URL | URL | Public | http://localhost:3000/api | https://staging.tahririno.ir/api | https://tahririno.ir/api |
| DATABASE_URL | Secret | Server | file:./dev.db | Managed PostgreSQL | Managed PostgreSQL |
| AUTH_SECRET | Secret | Server | dev-secret | 32+ char random string | 32+ char random string |
| STAGING | Flag | Server | false | true | false |

## Classification
- **Public**: Safe to expose in client bundle.
- **Server-only**: Must only be accessed in Server Components / Actions / API.
- **Secret**: Encrypted at rest in hosting provider.
