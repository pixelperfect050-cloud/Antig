const nodemailer = require('nodemailer');

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  });
};

/**
 * Send a password reset verification code via email
 * @param {string} toEmail - recipient email
 * @param {string} code - 6-digit verification code
 * @param {string} userName - user's name for personalization
 */
async function sendResetCode(toEmail, code, userName = 'there') {
  const transporter = createTransporter();

  const htmlTemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin:0;padding:0;background:#F0F4F8;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F4F8;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#1E3A8A,#2563EB);padding:32px 40px;text-align:center;">
                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                  🎨 ArtFlow Studio
                </h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:40px;">
                <h2 style="margin:0 0 8px;color:#111827;font-size:20px;font-weight:700;">
                  Password Reset Request
                </h2>
                <p style="margin:0 0 24px;color:#6B7280;font-size:14px;line-height:1.6;">
                  Hi ${userName.split(' ')[0]}, we received a request to reset your password. Use the verification code below:
                </p>

                <!-- OTP Code -->
                <div style="background:#F8FAFC;border:2px dashed #E2E8F0;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
                  <p style="margin:0 0 8px;color:#6B7280;font-size:12px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">
                    Verification Code
                  </p>
                  <p style="margin:0;color:#1E3A8A;font-size:36px;font-weight:800;letter-spacing:8px;font-family:'Courier New',monospace;">
                    ${code}
                  </p>
                </div>

                <p style="margin:0 0 6px;color:#6B7280;font-size:13px;">
                  ⏰ This code expires in <strong style="color:#111827;">10 minutes</strong>.
                </p>
                <p style="margin:0 0 24px;color:#6B7280;font-size:13px;">
                  🔒 If you didn't request this, you can safely ignore this email.
                </p>

                <hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />

                <p style="margin:0;color:#9CA3AF;font-size:11px;text-align:center;">
                  © ${new Date().getFullYear()} ArtFlow Studio. All rights reserved.
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

  const mailOptions = {
    from: `"ArtFlow Studio" <${process.env.SMTP_EMAIL}>`,
    to: toEmail,
    subject: `${code} — Your ArtFlow Studio Password Reset Code`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[EMAIL] Reset code sent to ${toEmail}`);
}

module.exports = { sendResetCode };
