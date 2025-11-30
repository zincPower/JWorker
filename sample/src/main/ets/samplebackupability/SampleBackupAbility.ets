import { BackupExtensionAbility, BundleVersion } from '@kit.CoreFileKit';

export default class SampleBackupAbility extends BackupExtensionAbility {
  async onBackup() {
  }

  async onRestore(bundleVersion: BundleVersion) {
  }
}