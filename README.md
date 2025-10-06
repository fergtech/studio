# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Security Best Practices

To maintain a secure application, please adhere to the following best practices:

*   **Environment Variables**: Never hardcode secrets or sensitive information directly in the code. Use environment variables to manage all secrets. A `.env.example` file is provided as a template. Copy it to `.env.local` and fill in the required values. Never commit `.env.local` or any other `.env` files to version control.
*   **Secret Leaks**: Be mindful of logging. Avoid logging entire objects or variables that might contain sensitive information. Specifically, do not log API keys, passwords, or personally identifiable information (PII).
*   **Dependencies**: Regularly audit your dependencies for known vulnerabilities. Use tools like `npm audit` or `pnpm audit` to identify and fix security issues in the packages you use.
*   **Test Files**: Do not commit test files that contain sensitive information or credentials. The `.gitignore` file has been updated to exclude common test file names.
