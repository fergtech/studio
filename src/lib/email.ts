import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password/${resetToken}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Society+ <admin@societyplus.app>',
      to: [email],
      subject: 'Reset Your Password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
                    <tr>
                      <td style="padding: 40px 30px; text-align: center;">
                        <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">Reset Your Password</h1>
                        <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.5; color: #666666;">
                          You requested to reset your password. Click the button below to create a new password.
                        </p>
                        <a href="${resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
                          Reset Password
                        </a>
                        <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.5; color: #999999;">
                          This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                        <p style="margin: 20px 0 0; font-size: 14px; line-height: 1.5; color: #999999;">
                          Or copy and paste this URL into your browser:<br>
                          <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}
