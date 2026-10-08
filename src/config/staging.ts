import { SITE_FEATURES } from "./features";

/**
 * Staging Environment Specific Configuration
 */
export const STAGING_CONFIG = {
  features: {
    ...SITE_FEATURES,
    // Staging specific overrides (e.g. enable beta features)
  },
  cookies: {
    secure: true,
    sameSite: "lax" as const,
  },
  logging: {
    level: "info",
    format: "json",
  }
};
