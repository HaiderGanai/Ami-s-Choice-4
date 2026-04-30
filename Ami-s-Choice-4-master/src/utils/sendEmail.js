const nodemailer = require('nodemailer');

const sendEmail = async options => {
    //1. create a transporter 
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
    //2. define the email options
    const mailOptions = {
    from: `Haider Ali <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.text || 'Please view this email in HTML format.',
    html: options.html
};

    //3. send the email
    await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };