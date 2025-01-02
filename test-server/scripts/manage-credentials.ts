import { TestCredentials } from '../src/utils/test-credentials';

async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'generate':
      console.log('Generating new test credentials...');
      const creds = await TestCredentials.generateNew();
      console.log('New credentials generated:');
      console.log('NSEC:', creds.nsec);
      console.log('NPUB:', creds.npub);
      break;

    case 'show':
      console.log('Current test credentials:');
      const current = await TestCredentials.getCurrent();
      console.log('NSEC:', current.nsec);
      console.log('NPUB:', current.npub);
      break;

    case 'validate':
      console.log('Validating test credentials...');
      const valid = await TestCredentials.validate();
      console.log('Credentials are', valid ? 'valid' : 'invalid');
      break;

    case 'backup':
      console.log('Creating backup of test credentials...');
      await TestCredentials.backup();
      break;

    default:
      console.log(`
Usage:
  npm run credentials -- [command]

Commands:
  generate  Generate new test credentials
  show      Show current test credentials
  validate  Validate current credentials
  backup    Create backup of current credentials
      `);
  }
}

main().catch(console.error);
