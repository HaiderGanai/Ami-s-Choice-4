const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000
  });

  // 2. Define email options
  const mailOptions = {
    from: `Haider Ali <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.text || 'Please view this email in HTML format.',
    html: options.html
  };

  // 3. Send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent to:', options.email);
  } catch (err) {
    console.error('Failed to send email:', err);
  }
};

module.exports = { sendEmail };
