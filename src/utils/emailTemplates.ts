import { APP_NAME } from "../constants/index.js";

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 EMAIL VERIFICATION (ACCOUNT CONFIRMATION)
└──────────────────────────────────────────────────────────────────────┘*/
export const vericationEmailTemplate = (link: string) => ({
	subject: `🎉 Verify your email — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Verify your email</h2>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <a href="${link}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        "
      >
        Verify Email
      </a>
      <p style="color: #888; font-size: 12px;">
        If you didn't create an account, ignore this email.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 PASSWORD RESET
└──────────────────────────────────────────────────────────────────────┘*/
export const passwordResetEmailTemplate = (link: string) => ({
	subject: `🔐 Reset your password — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Reset your password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${link}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        "
      >
        Reset Password
      </a>
      <p style="color: #888; font-size: 12px;">
        If you didn't request a password reset, ignore this email.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 PASSWORD RESET ALERT 🚨
└──────────────────────────────────────────────────────────────────────┘*/
export const passwordResetAlertTemplate = (deviceInfo: string, ip: string, time: string) => ({
	subject: `🔐 Password reset completed — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Password reset completed</h2>
      <p>Your password was successfully reset using the reset link:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Device:</strong> ${deviceInfo}</p>
        <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ip}</p>
        <p style="margin: 4px 0;"><strong>Time (UTC):</strong> ${time}</p>
      </div>
      <p style="color: #888; font-size: 12px;">
        If you didn't reset your password, please secure your account immediately.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 LOGIN ALERT 🚨
└──────────────────────────────────────────────────────────────────────┘*/
export const loginAlertEmailTemplate = (deviceInfo: string, ip: string, time: string) => ({
	subject: `🚨 New login to your account — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>New login detected</h2>
      <p>We detected a new login to your ${APP_NAME} account:</p>
      <div style="background: #f5f5f5; padding: 16px; border-radius: 6px; margin: 16px 0;">
        <p style="margin: 4px 0;"><strong>Device:</strong> ${deviceInfo}</p>
        <p style="margin: 4px 0;"><strong>IP Address:</strong> ${ip}</p>
        <p style="margin: 4px 0;"><strong>Time (UTC):</strong> ${time}</p>
      </div>
      <p style="color: #888; font-size: 12px;">
        If this wasn't you, please secure your account immediately.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 PASSWORD CHANGED ALERT WITH: REVERT LINK 🚨
└──────────────────────────────────────────────────────────────────────┘*/
export const passwordChangedAlertTemplate = (link: string) => ({
	subject: `⚠️ Secure your account — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Secure your account</h2>
      <p>Your <span style="background: #dc2626; color: #fff; font-weight: 700;">&nbsp;password has been changed&nbsp;</span>. If you didn't change your password or suspect unauthorized access, please secure your account by changing password or email or both.</p>
      
      <p style="color: #888; font-size: 12px;">
        If you made this change, you can safely ignore this email.
      </p>
    </div>
  `,
});
/* export const passwordChangedAlertTemplate = (link: string) => ({
	subject: `⚠️ Secure your account — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Secure your account</h2>
      <p>Your password has been changed. If you didn't change your password or suspect unauthorized access, click the button below to secure your account. This link expires in 24 hours.</p>
      <p>This will force a password reset and log out all devices.</p>
      <a href="${link}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background: #dc2626;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        "
      >
        Secure Account
      </a>
      <p style="color: #888; font-size: 12px;">
        If you made this change, you can safely ignore this email.
      </p>
    </div>
  `,
});
 */
/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 EMAIL CHANGE REQUEST
└──────────────────────────────────────────────────────────────────────┘*/
export const emailChangeRequestAlertTemplate = (newEmail: string) => ({
	subject: `🚨 Email change request — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Email change request</h2>
      <p>Someone requested to change your email address to: <strong>${newEmail}</strong></p>
      <p>⚠️ If this wasn't you secure your account immediately.</p>
      <p style="color: #888; font-size: 12px;">
        If you made this request, you can safely ignore this email.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 EMAIL CHANGE VERIFY
└──────────────────────────────────────────────────────────────────────┘*/
export const emailChangeVerifyTemplate = (link: string) => ({
	subject: `📧 Verify your new email address — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Verify your new email address</h2>
      <p style="color: #f97316; font-size: 15px;">Note: email can only be changed once in a 7-day period.</p>
      <p style="color: lime; font-style: italic; font-family:monospace">If you are a hacker good luck lol 😁!</p>
      <p>Click the button below to confirm your new email address. This link expires in 24 hours.</p>
      <a href="${link}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background: #000;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        "
      >
        Verify New Email
      </a>
      <p style="color: #888; font-size: 12px;">
        If you didn't request this change, ignore this email.
      </p>
    </div>
  `,
});

/*
 ┌──────────────────────────────────────────────────────────────────────┐
  📌 EMAIL CHANGED ALERT WITH: RECOVER LINK 🚨
└──────────────────────────────────────────────────────────────────────┘*/
export const emailChangedAlertTemplate = (
	oldEmail: string,
	newEmail: string,
	recoverLink: string,
) => ({
	subject: `✅ Email address changed — ${APP_NAME}`,
	html: `
    <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
      <h2>Email address changed</h2>
      <p>Your email address has been successfully changed from <strong>${oldEmail}</strong> to <strong>${newEmail}</strong>.</p>
      <p>All your sessions have been logged out except current session for security.</p>
      <p>If you didn't make this change, click the "button" below to recover your account. This link will expire in 7 days:</p>
      <a href="${recoverLink}"
        style="
          display: inline-block;
          padding: 12px 24px;
          background: #dc2626;
          color: #fff;
          text-decoration: none;
          border-radius: 6px;
          margin: 16px 0;
        "
      >
        Recover Account
      </a>
      <p style="color: #888; font-size: 12px;">
        If you made this change, you can safely ignore this email.
      </p>
    </div>
  `,
});
