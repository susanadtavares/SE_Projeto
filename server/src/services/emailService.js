import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure the nodemailer transport object
const transporter = nodemailer.createTransport({
    host: 'smtp.mail.ru',
    port: 465,
    secure: true,
    auth: {
        user: process.env.MAILRU_USER,
        pass: process.env.MAILRU_PASS
    }
});

/**
 * Send an email.
 *
 * @param {object} options - Email options.
 * @param {string} options.to - Recipient email.
 * @param {string} options.subject - Email subject.
 * @param {string} options.body - Email body (HTML or text).
 * @returns {Promise<string>}
 */
export const sendMail = async ({ to, subject, body }) => {
    const mailOptions = {
        from: process.env.MAILRU_USER,
        to,
        subject,
        html: body // Use 'html' if you are sending HTML content
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                return reject(error);
            }
            console.log('Email sent:', info.response);
            resolve('Email sent successfully');
        });
    });
};
