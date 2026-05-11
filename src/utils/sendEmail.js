// // sendEmail.js
// const sgMail = require('@sendgrid/mail');

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// const sendEmail = async (recipient, code) => {
//   const msg = {
//     to: recipient,
//     from: process.env.SENDGRID_SENDER, // verified sender
//     subject: 'Your Password Reset Code',
//     text: `Your OTP Code is: ${code}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px;">
//         <h2>Password Reset Code</h2>
//         <p>Your 4-digit password reset code is:</p>
//         <h1 style="letter-spacing: 2px;">${code}</h1>
//         <p>This code is valid for <strong>10 minutes</strong>.</p>
//         <p>If you didn't request this, please ignore this email.</p>
//       </div>
//     `,
//   };

//   try {
//     const [response] = await sgMail.send(msg);
//     console.log('Email sent status:', response.statusCode);

//     return true;
//   } catch (error) {
//     console.error('SendGrid Error:', error);
//     return false;
//   }
// };

// module.exports = { sendEmail };


// sendEmail.js
// const nodemailer = require('nodemailer');

// const transporter = nodemailer.createTransport({
//   service: 'gmail', // shorthand for host: smtp.gmail.com, port: 465, secure: true
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// const sendEmail = async (recipient, code) => {
//   const msg = {
//     to: recipient,
//     from: `"FarmsDrop" <${process.env.EMAIL_USER}>`, // display name + Gmail address
//     subject: 'Your Password Reset Code',
//     text: `Your OTP Code is: ${code}`,
//     html: `
//       <div style="font-family: Arial, sans-serif; padding: 20px;">
//         <h2>Password Reset Code</h2>
//         <p>Your 4-digit password reset code is:</p>
//         <h1 style="letter-spacing: 2px;">${code}</h1>
//         <p>This code is valid for <strong>10 minutes</strong>.</p>
//         <p>If you didn't request this, please ignore this email.</p>
//       </div>
//     `,
//   };

//   try {
//     const info = await transporter.sendMail(msg);
//     console.log('Email sent:', info.messageId);
//     return true;
//   } catch (error) {
//     console.error('Nodemailer Error:', error);
//     return false;
//   }
// };

// module.exports = { sendEmail };


// npm i resend
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (recipient, code) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'FarmsDrop <onboarding@resend.dev>', // see point 3
      to: recipient,
      subject: 'Your Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Code</h2>
          <p>Your 4-digit password reset code is:</p>
          <h1 style="letter-spacing: 2px;">${code}</h1>
          <p>This code is valid for <strong>10 minutes</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend API Error:', error);
      return false;
    }

    console.log('Email sent, id:', data?.id);
    return true;
  } catch (err) {
    console.error('Resend Network Error:', err);
    return false;
  }
};

module.exports = { sendEmail };