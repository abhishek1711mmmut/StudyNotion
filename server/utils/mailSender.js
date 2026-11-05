const https = require('https');

const BREVO_API_HOST = 'api.brevo.com';
const BREVO_API_PATH = '/v3/smtp/email';

/*
const nodemailer = require('nodemailer');

const mailSender = async (email, title, body) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.MAIL_HOST,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"Studynotion | Abhishek" <${process.env.MAIL_USER}>`,
            to: `${email}`,
            subject: `${title}`,
            html: `${body}`,
        });

        console.log(info);
        return info;
    } catch (error) {
        console.log(error.message);
        return error.message;
    }
};
*/

// Keep this function's interface stable for the existing OTP, password-reset,
// contact, enrollment, and payment email flows.
const mailSender = async (email, title, body) => {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL;
    const senderName = process.env.BREVO_SENDER_NAME || 'StudyNotion';

    if (!apiKey || !senderEmail) {
        const errorMessage = 'Brevo email configuration is missing';
        console.error(errorMessage);
        return errorMessage;
    }

    const payload = JSON.stringify({
        sender: {
            email: senderEmail,
            name: senderName,
        },
        to: [{ email }],
        subject: title,
        htmlContent: body,
    });

    return new Promise((resolve) => {
        const request = https.request(
            {
                hostname: BREVO_API_HOST,
                path: BREVO_API_PATH,
                method: 'POST',
                headers: {
                    accept: 'application/json',
                    'api-key': apiKey,
                    'content-type': 'application/json',
                    'content-length': Buffer.byteLength(payload),
                },
                timeout: 15000,
            },
            (response) => {
                let responseBody = '';

                response.setEncoding('utf8');
                response.on('data', (chunk) => {
                    responseBody += chunk;
                });
                response.on('end', () => {
                    if (response.statusCode >= 200 && response.statusCode < 300) {
                        let result;
                        try {
                            result = JSON.parse(responseBody);
                        } catch (error) {
                            result = { messageId: responseBody };
                        }

                        console.log('Brevo email sent successfully');
                        resolve(result);
                        return;
                    }

                    const errorMessage = `Brevo email failed (${response.statusCode}): ${responseBody}`;
                    console.error(errorMessage);
                    resolve(errorMessage);
                });
            }
        );

        request.on('timeout', () => {
            request.destroy(new Error('Brevo request timed out'));
        });

        request.on('error', (error) => {
            console.error('Brevo email request failed:', error.message);
            resolve(error.message);
        });

        request.write(payload);
        request.end();
    });
};

module.exports = mailSender;
