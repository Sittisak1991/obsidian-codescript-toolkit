import { PluginSettingsBase } from 'obsidian-dev-utils/obsidian/Plugin/PluginSettingsBase';
import { join } from 'obsidian-dev-utils/Path';

interface LegacySettings {
  invocableScriptsDirectory: string;
}

export class CodeScriptToolkitPluginPluginSettings extends PluginSettingsBase {
  public invocableScriptsFolder = '';
  // eslint-disable-next-line no-magic-numbers
  public mobileChangesCheckingIntervalInSeconds = 30;
  public modulesRoot = '';
  public shouldUseSyncFallback = false;
  public startupScriptPath = '';

  public constructor(data: unknown) {
    super();
    this.init(data);
  }

  public getInvocableScriptsFolder(): string {
    return this.getPathRelativeToModulesRoot(this.invocableScriptsFolder);
  }

  public getStartupScriptPath(): string {
    return this.getPathRelativeToModulesRoot(this.startupScriptPath);
  }

  protected override initFromRecord(record: Record<string, unknown>): void {
    const legacySettings = record as Partial<CodeScriptToolkitPluginPluginSettings> & Partial<LegacySettings>;
    if (legacySettings.invocableScriptsDirectory) {
      if (legacySettings.invocableScriptsDirectory) {
        legacySettings.invocableScriptsFolder = legacySettings.invocableScriptsDirectory;
        delete legacySettings.invocableScriptsDirectory;
        this._shouldSaveAfterLoad = true;
      }
    }

    super.initFromRecord(legacySettings);
  }

  private getPathRelativeToModulesRoot(path: string): string {
    if (!path) {
      return '';
    }

    if (!this.modulesRoot) {
      return path;
    }

    return join(this.modulesRoot, path);
  }
}
