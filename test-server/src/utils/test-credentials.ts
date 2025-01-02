import { generatePrivateKey, getPublicKey } from 'nostr-tools';
import * as fs from 'fs/promises';
import * as path from 'path';

export class TestCredentials {
  /**
   * Generate new test credentials
   */
  static async generateNew(): Promise<{
    nsec: string;
    npub: string;
  }> {
    const privateKey = generatePrivateKey();
    const publicKey = getPublicKey(privateKey);

    const credentials = {
      nsec: `nsec1${privateKey}`,
      npub: `npub1${publicKey}`
    };

    // Update .env.dev
    await this.updateEnvFile(credentials);

    return credentials;
  }

  /**
   * Update .env.dev with new credentials
   */
  private static async updateEnvFile(credentials: {
    nsec: string;
    npub: string;
  }): Promise<void> {
    const envPath = path.join(__dirname, '../../.env.dev');
    
    try {
      let envContent = await fs.readFile(envPath, 'utf8');
      
      // Update credentials
      envContent = envContent.replace(
        /NOSTR_TEST_NSEC=.*/,
        `NOSTR_TEST_NSEC=${credentials.nsec}`
      );
      envContent = envContent.replace(
        /NOSTR_TEST_NPUB=.*/,
        `NOSTR_TEST_NPUB=${credentials.npub}`
      );

      await fs.writeFile(envPath, envContent);
      
      console.log('Test credentials updated in .env.dev');
    } catch (error) {
      console.error('Failed to update .env.dev:', error);
      throw error;
    }
  }

  /**
   * Get current test credentials
   */
  static async getCurrent(): Promise<{
    nsec: string;
    npub: string;
  }> {
    const envPath = path.join(__dirname, '../../.env.dev');
    
    try {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      const nsec = envContent.match(/NOSTR_TEST_NSEC=(.*)/)?.[1];
      const npub = envContent.match(/NOSTR_TEST_NPUB=(.*)/)?.[1];

      if (!nsec || !npub) {
        throw new Error('Test credentials not found in .env.dev');
      }

      return { nsec, npub };
    } catch (error) {
      console.error('Failed to read test credentials:', error);
      throw error;
    }
  }

  /**
   * Validate test credentials
   */
  static async validate(): Promise<boolean> {
    try {
      const { nsec, npub } = await this.getCurrent();
      
      // Basic format validation
      if (!nsec.startsWith('nsec1') || !npub.startsWith('npub1')) {
        return false;
      }

      // TODO: Add more validation as needed
      
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create backup of current credentials
   */
  static async backup(): Promise<void> {
    const envPath = path.join(__dirname, '../../.env.dev');
    const backupPath = path.join(
      __dirname,
      `../../.env.dev.backup.${Date.now()}`
    );

    try {
      await fs.copyFile(envPath, backupPath);
      console.log(`Backup created at ${backupPath}`);
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }
}
