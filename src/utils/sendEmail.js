// sendEmail.js
const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (recipient, code) => {
  const msg = {
    to: recipient,
    from: process.env.SENDGRID_SENDER, // verified sender
    subject: 'Your Password Reset Code',
    text: `Your OTP Code is: ${code}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Password Reset Code</h2>
        <p>Your 4-digit password reset code is:</p>
        <h1 style="letter-spacing: 2px;">${code}</h1>
        <p>This code is valid for <strong>10 minutes</strong>.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log('Email sent status:', response.statusCode);
    console.log("api key::", process.env.SENDGRID_SENDER)
    return true;
  } catch (error) {
    console.error('SendGrid Error:', error);
    return false;
  }
};

module.exports = { sendEmail };
