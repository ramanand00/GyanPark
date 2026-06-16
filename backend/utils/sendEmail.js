const nodemailer = require('nodemailer');

const sendEmail = async (email, otp) => {
    // Development mode - log OTP to console
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    🔐 VERIFICATION OTP                    ║');
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║ 📧 Email: ${email.padEnd(40)}║`);
    console.log(`║ 🔑 OTP: ${otp.padEnd(44)}║`);
    console.log(`║ 💡 Enter this OTP to verify your account                  ║`);
    console.log('╚══════════════════════════════════════════════════════════╝\n');
    
    // Only try to send real email if credentials are properly configured
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && 
        process.env.EMAIL_USER !== 'your_email@gmail.com' &&
        process.env.EMAIL_PASS !== 'your_app_password') {
        try {
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS
                }
            });
            
            const mailOptions = {
                from: `"GyanPark" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: 'GyanPark - Email Verification OTP',
                html: `
                    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px;">
                            <h2 style="color: white; text-align: center;">Welcome to GyanPark! 🎓</h2>
                            <div style="background: white; padding: 20px; border-radius: 8px; margin-top: 20px;">
                                <p style="color: #333;">Your OTP for email verification is:</p>
                                <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;">
                                    ${otp}
                                </div>
                                <p style="color: #666; font-size: 14px;">This OTP is valid for 5 minutes.</p>
                                <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                            </div>
                        </div>
                    </div>
                `
            };
            
            await transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully to ${email}`);
        } catch (error) {
            console.log('⚠️ Email sending failed, but OTP is available in console above');
        }
    }
    
    return true;
};

module.exports = sendEmail;