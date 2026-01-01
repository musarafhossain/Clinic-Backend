import transporter from "../config/emailConfig";

// Send email
/*
    @param {string} to - To email
    @param {string} subject - Subject
    @param {string} message - Message
    @returns {Promise<Object>} - Response
*/
const sendEmail = async (to, subject, message) => {
    // set mail options
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html: message,
    };

    try {
        // send mail
        await transporter.sendMail(mailOptions);

        // return response
        const response = {
            success: true,
            message: "Email sent successfully",
        };
        return response;
    } catch (error) {
        // return response
        const response = {
            success: false,
            message: "Failed to send email",
        };
        return response;
    }
};

export default { sendEmail };
