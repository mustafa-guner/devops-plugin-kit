export interface CreatePluginTemplateInput {
  targetDir: string;
  pluginName: string;
  publisher: string;
  extensionId?: string;
  installDependencies?: boolean;
  force?: boolean;
}

export interface TemplateContext {
  pluginName: string;
  publisher: string;
  extensionId: string;
}