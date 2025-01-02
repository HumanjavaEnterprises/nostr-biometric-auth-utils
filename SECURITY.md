# Security Policy for nostr-biometric-login-utils

## Important Disclaimer

This code is provided "AS IS" without warranty of any kind. The responsibility for ensuring security and proper implementation lies entirely with the team utilizing or including this code in their project. While we strive to maintain security best practices, users must conduct their own security audits and risk assessments.

## Supported Versions

We release patches for security vulnerabilities. Which versions are eligible for receiving such patches depends on the CVSS v3.0 Rating:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability
If you discover a security vulnerability within this biometric authentication service, please follow these steps:

1. **Do not disclose the vulnerability publicly** until it has been resolved.
2. **Email the project maintainers** at [your-email@example.com] with details about the vulnerability, including:
   - A description of the issue
   - Steps to reproduce the vulnerability
   - Any relevant screenshots or logs.

## Disclosure Policy

When we receive a security bug report, we will:

* Confirm the problem and determine the affected versions
* Audit code to find any potential similar problems
* Prepare fixes for all releases still under maintenance
* Release new security patch versions of the package

## Comments on this Policy

If you have suggestions on how this process could be improved please submit a pull request.

## Security Best Practices
To ensure the security of your application when using nostr-biometric-login-utils, consider the following best practices:

- **Keep Dependencies Updated**: Regularly check for updates to dependencies and apply security patches as soon as they are available.
- **Use Environment Variables**: Store sensitive information such as API keys and database credentials in environment variables, not in your codebase.
- **Implement Rate Limiting**: Protect your endpoints from abuse by implementing rate limiting to prevent brute-force attacks.
- **Validate User Input**: Always validate and sanitize user input to prevent injection attacks.
- **Use HTTPS**: Ensure that your application is served over HTTPS to protect data in transit.
- **Monitor Logs**: Regularly monitor application logs for unusual activity that may indicate a security breach.

## Security Updates
We will notify users of any critical security updates through the following channels:
- GitHub issues
- Project release notes

## License
This security policy is part of the [LICENSE](LICENSE) file for the nostr-biometric-login-utils project.
