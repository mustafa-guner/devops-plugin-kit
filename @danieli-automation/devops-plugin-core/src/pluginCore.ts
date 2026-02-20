export interface PluginConfig {
  extensionId: string;
  projectName?: string;
  organizationUrl?: string;
}

export function createPluginContext(config: PluginConfig) {
  return {
    ...config,
    createdAt: new Date().toISOString()
  };
}