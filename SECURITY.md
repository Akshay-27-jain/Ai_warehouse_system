# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of the AI Warehouse Optimization System seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT open a public GitHub issue.**
2. Send a detailed report to the security team via email at `security@aiwarehouse.com`.
3. Include:
   - Type of vulnerability (e.g., SQL injection, XSS, authentication bypass)
   - Step-by-step instructions or proof-of-concept script to reproduce the issue
   - Potential impact
4. We will acknowledge receipt of your report within **24 hours** and provide regular progress updates until resolved.

## Security Best Practices

- **Zero Hardcoded Secrets**: Secrets must never be committed to Git. Use environment variables or secure secret managers.
- **MCP Security**: All Model Context Protocol tool access must go through Flask JWT authentication barriers. Database MCP queries must enforce strict read-only SQL regex parsing.
- **Dependency Scanning**: Automated Dependabot and CodeQL security analysis runs on every pull request.
