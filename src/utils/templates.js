export const otpTemplate = (otp, name) => {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <meta http-equiv="X-UA-Compatible" content="ie=edge" />
            <title>OTP Verification</title>

            <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600&display=swap"
            rel="stylesheet"
            />
        </head>
        <body
            style="
            margin: 0;
            font-family: 'Poppins', sans-serif;
            background: #ffffff;
            font-size: 14px;
            "
        >
            <div
            style="
                max-width: 680px;
                margin: 0 auto;
                padding: 45px 30px 60px;
                background: #f4f7ff;
                font-size: 14px;
                color: #434343;
            "
            >
            <main>
                <div
                style="
                    margin: 0;
                    margin-top: 10px;
                    padding: 40px 50px;
                    background: #ffffff;
                    border-radius: 30px;
                    text-align: center;
                "
                >
                <div style="width: 100%; max-width: 489px; margin: 0 auto">
                    <h1
                    style="
                        margin: 0;
                        font-size: 24px;
                        font-weight: 500;
                        color: #1f1f1f;
                    "
                    >
                    Your OTP
                    </h1>
                    <p
                    style="
                        margin: 0;
                        margin-top: 17px;
                        font-size: 16px;
                        font-weight: 500;
                    "
                    >
                    Hey ${name},
                    </p>
                    <p
                     style="
                     margin: 0;
                     margin-top: 17px;
                     font-weight: 500;
                     letter-spacing: 0.56px;
                     "
                    >
                     This OTP is for your password reset. The OTP is valid for
                     <span style="font-weight: 600; color: #1f1f1f">5 minutes</span>.
                     Do not share this code. Your OTP is:
                    </p>
                    <p
                    style="
                        margin: 0;
                        margin-top: 60px;
                        font-size: 40px;
                        font-weight: 600;
                        letter-spacing: 25px;
                        color: #ba3d4f;
                    "
                    >
                    ${otp}
                    </p>
                </div>
                </div>
            </main>
            </div>
        </body>
        </html>
    `;
}