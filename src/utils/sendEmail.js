const nodemailer = require('nodemailer');

const sendEmail = async options => {
<<<<<<< HEAD
=======
    //1. create a transporter 
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
<<<<<<< HEAD
        },
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000
    });

    const mailOptions = {
        from: `Haider Ali <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.text || 'Please view this email in HTML format.',
        html: options.html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent to:', options.email);
    } catch (err) {
        console.error('Failed to send email:', err);
    }
};

module.exports = { sendEmail };
=======
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
>>>>>>> 41ad3f73510251b16dd185c254d969143dffba17
