import { Resend } from 'resend';
import { NotificationType } from '@prisma/client';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is not set');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const resetUrl = `${BASE_URL}/reset-password/${resetToken}`;

  try {
    const { data, error} = await resend.emails.send({
      from: 'Society+ <notifications@societyplus.app>',
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

// Email template helper
function getEmailTemplate(content: string, userIdentifier?: string) {
  const baseUrl = BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  const settingsUrl = userIdentifier
    ? `${baseUrl}/profile/${userIdentifier}/edit`
    : `${baseUrl}/profile/me/edit`;
  const logoUrl = `${baseUrl}/apple-touch-icon.png`;

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
        <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); overflow: hidden;">
                <!-- Header with logo and branding -->
                <tr>
                  <td style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center;">
                    <img src="${logoUrl}" alt="Society+" style="width: 60px; height: 60px; border-radius: 12px; margin-bottom: 12px;" />
                    <h2 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">Society+</h2>
                    <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Building communities together</p>
                  </td>
                </tr>
                <!-- Content -->
                <tr>
                  <td style="padding: 40px 30px;">
                    ${content}
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 30px; border-top: 1px solid #eeeeee; text-align: center; background-color: #fafafa;">
                    <p style="margin: 0; font-size: 12px; color: #999999;">
                      © ${new Date().getFullYear()} Society+. All rights reserved.
                    </p>
                    <p style="margin: 10px 0 0; font-size: 12px; color: #999999;">
                      <a href="${settingsUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Notification Settings</a>
                      <span style="margin: 0 8px; color: #cccccc;">•</span>
                      <a href="${baseUrl}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Visit Society+</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendNotificationEmail(
  email: string,
  notificationType: NotificationType,
  title: string,
  message: string,
  actionUrl?: string,
  actionLabel?: string,
  userIdentifier?: string
) {
  try {
    let subject = '';
    let content = '';

    switch (notificationType) {
      case 'DIRECT_MESSAGE':
        subject = 'New Message on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">💬 ${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View Message'}
            </a>
          ` : ''}
          <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.5; color: #999999;">
            Reply directly on Society+ to continue the conversation.
          </p>
        `;
        break;

      case 'FOLLOW':
        subject = 'New Follower on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">👤 ${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View Profile'}
            </a>
          ` : ''}
        `;
        break;

      case 'INITIATIVE_INVITE':
        subject = 'Initiative Invitation on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">🎯 ${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View Invitation'}
            </a>
          ` : ''}
        `;
        break;

      case 'GOAL_COMPLETED':
        subject = 'Goal Completed on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">🎉 ${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View Goal'}
            </a>
          ` : ''}
        `;
        break;

      case 'MILESTONE_REACHED':
        subject = 'Milestone Reached on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">🏆 ${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View Milestone'}
            </a>
          ` : ''}
        `;
        break;

      default:
        subject = 'New Notification on Society+';
        content = `
          <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #1a1a1a;">${title}</h1>
          <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.5; color: #666666;">
            ${message}
          </p>
          ${actionUrl ? `
            <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 16px;">
              ${actionLabel || 'View on Society+'}
            </a>
          ` : ''}
        `;
    }

    const { data, error } = await resend.emails.send({
      from: 'Society+ <notifications@societyplus.app>',
      to: [email],
      subject,
      html: getEmailTemplate(content, userIdentifier),
    });

    if (error) {
      console.error('Error sending notification email:', error);
      throw new Error('Failed to send notification email');
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
}
