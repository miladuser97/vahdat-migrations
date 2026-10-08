import { SITE_FEATURES, SiteFeatures } from "@/config/features";

/**
 * Admin Config Service
 * 
 * Formal boundary for managing site-wide configurations.
 * In a production environment, this would:
 * 1. Fetch config from a database/CMS.
 * 2. Validate the configuration.
 * 3. Cache the results.
 */

export async function getRuntimeFeatures(): Promise<SiteFeatures> {
  // Real implementation:
  // const remoteConfig = await apiClient('/config/features');
  // return remoteConfig;
  
  return SITE_FEATURES;
}
