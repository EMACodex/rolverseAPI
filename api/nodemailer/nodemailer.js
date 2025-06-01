const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  });

function sendEmail(emailContent) {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: emailContent.to,
        subject: emailContent.subject,
        text: emailContent.text
    };
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Correo enviado.');
        }
    });
}

module.exports = { sendEmail };
