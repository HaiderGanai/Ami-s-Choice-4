const { User } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require("../utils/sendEmail");
const { Op, where } = require("sequelize");
const juice = require('juice');



const sendEmailController = async (req, res) => {
    try {
        
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                status: 'fail',
                message: 'Please provide your Email!'
            });
        }

        const userExists = await User.findOne({ where: { email } });
        if (!userExists) {
            return res.status(404).json({
                status: 'fail',
                message: 'User does not exist!'
            });
        }

        const resetCode = Math.floor(1000 + Math.random() * 9000).toString(); // 4 digits
        const hashedToken = crypto.createHash('sha256').update(resetCode).digest('hex');

        userExists.passwordResetToken = hashedToken;
        userExists.passwordResetExpiry = Date.now() + 10 * 60 * 1000; // 10 mins

        await userExists.save();

       const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You Email - Enhanced</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .email-container {
            max-width: 750px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            position: relative;
        }
        
        .email-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb, #f5576c);
        }
        
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .email-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="white" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="white" opacity="0.1"/><circle cx="50" cy="10" r="0.5" fill="white" opacity="0.1"/><circle cx="10" cy="60" r="0.5" fill="white" opacity="0.1"/><circle cx="90" cy="40" r="0.5" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
            animation: float 20s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-10px) rotate(1deg); }
        }
        
        .header-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 2;
        }
        
        .email-header h1 {
            font-size: 32px;
            font-weight: 700;
            margin-bottom: 10px;
            position: relative;
            z-index: 2;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .email-header p {
            font-size: 18px;
            opacity: 0.9;
            position: relative;
            z-index: 2;
        }
        
        .email-body {
            padding: 50px;
            background: white;
            position: relative;
        }
        
        .greeting-section {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
            padding: 20px;
            background: linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%);
            border-radius: 15px;
            border-left: 5px solid #667eea;
        }
        
        .greeting-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }
        
        .greeting {
            font-size: 20px;
            color: #2c5aa0;
            font-weight: 600;
            margin: 0;
        }
        
        .content-section {
            margin-bottom: 30px;
            position: relative;
        }
        
        .content-section::before {
            content: '';
            position: absolute;
            left: -30px;
            top: 0;
            width: 3px;
            height: 100%;
            background: linear-gradient(to bottom, #667eea, transparent);
            border-radius: 2px;
        }
        
        .content-section p {
            margin-bottom: 18px;
            font-size: 16px;
            line-height: 1.8;
            color: #444;
            padding-left: 10px;
        }
        
        .highlight-box {
            background: linear-gradient(135deg, #f8f9ff 0%, #fff5f5 100%);
            border: 2px solid #e6f3ff;
            border-radius: 15px;
            padding: 25px;
            margin: 30px 0;
            position: relative;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.1);
        }
        
        .highlight-box::before {
            content: '💡';
            position: absolute;
            top: -15px;
            left: 20px;
            background: white;
            padding: 5px 10px;
            border-radius: 20px;
            font-size: 20px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .highlight-box p {
            margin-bottom: 10px;
            font-style: italic;
            color: #555;
            padding-left: 0;
        }
        
        .stats-section {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .stat-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 100px;
            height: 100px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        
        .stat-icon {
            font-size: 30px;
            margin-bottom: 10px;
        }
        
        .stat-title {
            font-size: 14px;
            opacity: 0.9;
            margin-bottom: 5px;
        }
        
        .stat-value {
            font-size: 18px;
            font-weight: 600;
        }
        
        .amal-family {
            color: #667eea;
            font-weight: 600;
            text-decoration: none;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            position: relative;
        }
        
        .amal-family::after {
            content: '';
            position: absolute;
            bottom: -2px;
            left: 0;
            width: 100%;
            height: 2px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            transform: scaleX(0);
            transition: transform 0.3s ease;
        }
        
        .amal-family:hover::after {
            transform: scaleX(1);
        }
        
        .signature-section {
            margin-top: 50px;
            padding-top: 40px;
            border-top: 3px solid #f0f0f0;
            position: relative;
        }
        
        .signature-section::before {
            content: '';
            position: absolute;
            top: -2px;
            left: 50%;
            transform: translateX(-50%);
            width: 100px;
            height: 4px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 2px;
        }
        
        .closing {
            font-size: 16px;
            margin-bottom: 30px;
            color: #555;
            text-align: center;
            font-style: italic;
        }
        
        .signature-card {
            background: linear-gradient(135deg, #f8f9ff 0%, #fff5f5 100%);
            border-radius: 20px;
            padding: 30px;
            border: 2px solid #e6f3ff;
            position: relative;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.1);
        }
        
        .signature-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 0%, transparent 70%);
        }
        
        .profile-section {
            display: flex;
            align-items: center;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .profile-avatar {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 32px;
            font-weight: 600;
            position: relative;
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
        }
        
        .profile-avatar::after {
            content: '';
            position: absolute;
            inset: -3px;
            background: linear-gradient(135deg, #667eea, #764ba2, #f093fb);
            border-radius: 50%;
            z-index: -1;
            animation: rotate 3s linear infinite;
        }
        
        @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .profile-info {
            flex: 1;
        }
        
        .signature-name {
            font-size: 24px;
            font-weight: 700;
            color: #2c5aa0;
            margin-bottom: 5px;
        }
        
        .signature-title {
            font-size: 14px;
            color: #888;
            margin-bottom: 15px;
        }
        
        .contact-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 14px;
            color: #666;
            padding: 10px;
            background: white;
            border-radius: 10px;
            transition: all 0.3s ease;
        }
        
        .contact-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .contact-icon {
            width: 24px;
            height: 24px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 12px;
        }
        
        .email-footer {
            background: linear-gradient(135deg, #f8f9ff 0%, #e6f3ff 100%);
            padding: 30px;
            text-align: center;
            position: relative;
        }
        
        .footer-decoration {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin-bottom: 15px;
        }
        
        .decoration-dot {
            width: 8px;
            height: 8px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            animation: pulse 2s ease-in-out infinite;
        }
        
        .decoration-dot:nth-child(2) {
            animation-delay: 0.3s;
        }
        
        .decoration-dot:nth-child(3) {
            animation-delay: 0.6s;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
        }
        
        .footer-text {
            font-size: 14px;
            color: #888;
            margin-bottom: 10px;
        }
        
        .footer-icons {
            display: flex;
            justify-content: center;
            gap: 15px;
        }
        
        .footer-icon {
            width: 30px;
            height: 30px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .footer-icon:hover {
            transform: translateY(-3px) scale(1.1);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            
            .email-body {
                padding: 30px 25px;
            }
            
            .email-header {
                padding: 30px 20px;
            }
            
            .email-header h1 {
                font-size: 26px;
            }
            
            .content-section p {
                font-size: 15px;
            }
            
            .profile-section {
                flex-direction: column;
                text-align: center;
            }
            
            .contact-info {
                grid-template-columns: 1fr;
            }
            
            .stats-section {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="email-header">
            <div class="header-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="🤍">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="white"/>
                </svg>
            </div>
            <h1>Thank You for the Valuable Guidance</h1>
            <p>A heartfelt appreciation message from the AMAL family</p>
        </div>
        
        <div class="email-body">
            <div class="greeting-section">
                <div class="greeting-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="https://img.icons8.com/?size=100&id=123575&format=png&color=FFFFFF">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="white"/>
                    </svg>
                </div>
                <div class="greeting">
                    Assalamoalaikum Assad Ullah Sb,<br>
                    <span style="font-size: 14px; font-weight: 400; color: #666;">I hope this message finds you well.</span>
                </div>
            </div>
            
            <div class="content-section">
                <p>I am writing to sincerely thank you for the valuable guidance and learning opportunity you provided during our mock interview session at Amal Academy this past Sunday. It was truly selfless of you to volunteer your time, especially on a weekend — a day that I know is precious for working professionals to spend with their family and friends.</p>
            </div>
            
            <div class="stats-section">
                <div class="stat-card">
                    <div class="stat-icon">🎯</div>
                    <div class="stat-title">Mock Interview</div>
                    <div class="stat-value">Sunday Session</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">💡</div>
                    <div class="stat-title">Key Insights</div>
                    <div class="stat-value">Learning Transcends</div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon">🤝</div>
                    <div class="stat-title">Professional Growth</div>
                    <div class="stat-value">Meaningful Step</div>
                </div>
            </div>
            
            <div class="content-section">
                <p>I truly appreciated your time and effort, and I'm especially grateful for the thoughtful feedback and tips you shared with me.</p>
                
                <div class="highlight-box">
                    <p>One memorable moment during our session was our exchange about the credibility of our degrees — when you asked about the depth of my CS background given my unfamiliarity with automation tools, and I in turn asked about your experience as a mechanical engineer conducting CS interviews. I believe we were both right in our perspectives, and that conversation gave me a new insight into how learning transcends academic boundaries.</p>
                </div>
            </div>
            
            <div class="content-section">
                <p>I was particularly impressed with how calm, respectful, and open you remained — even when we had a slight disagreement about Machine Learning. Despite not having a formal CS background, your knowledge about automation tools was inspiring and motivating. It reminded me that learning is a continuous journey, and after our conversation, I felt I had taken a meaningful step forward in mine.</p>
            </div>
            
            <div class="content-section">
                <p>I've already implemented your feedback regarding my resume and GitHub profile. As for the experience summary section, I discussed it with my Project Manager and she advised that, since I'm still in the early stages of my career, it's not essential for now. Your suggestion about the handshake at the beginning of interviews also stuck with me — I applied it in a recent interview and it made a positive difference.</p>
            </div>
            
            <div class="content-section">
                <p>Thank you once again for your kindness, mentorship, and time. I genuinely hope we can stay in touch. Perhaps we could meet someday over a "Quetta Tea" ☕ or a simple coffee — not as interviewer and interviewee, but as part of the <a href="#" class="amal-family">#AMAL_FAMILY</a>, as friends and professionals.</p>
            </div>
            
            <div class="signature-section">
                <p class="closing">Wishing you continued success in your career. 🌟</p>
                
                <div class="signature-card">
                    <div class="profile-section">
                        <div class="profile-avatar">
                            HA
                        </div>
                        <div class="profile-info">
                            <div class="signature-name">Best regards, Haider Ali</div>
                            <div class="signature-title">Software Developer | AMAL Academy Graduate</div>
                        </div>
                    </div>
                    
                    <div class="contact-info">
                        <div class="contact-item">
                            <div class="contact-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="currentColor"/>
                                </svg>
                            </div>
                            <span>ganaiihaider07@gmail.com</span>
                        </div>
                        <div class="contact-item">
                            <div class="contact-icon">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor"/>
                                </svg>
                            </div>
                            <span>+92-313-4055604</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="email-footer">
            <div class="footer-decoration">
                <div class="decoration-dot"></div>
                <div class="decoration-dot"></div>
                <div class="decoration-dot"></div>
            </div>
            <p class="footer-text">This email was sent with appreciation and respect from the AMAL family</p>
            <!--<div class="footer-icons">-->
            <!--    <a href="#" class="footer-icon" title="LinkedIn">-->
            <!--        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">-->
            <!--            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="currentColor"/>-->
            <!--        </svg>-->
            <!--    </a>-->
            <!--    <a href="#" class="footer-icon" title="GitHub">-->
            <!--        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">-->
            <!--            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="currentColor"/>-->
            <!--        </svg>-->
            <!--    </a>-->
            <!--    <a href="#" class="footer-icon" title="Twitter">-->
            <!--        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">-->
            <!--            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" fill="currentColor"/>-->
            <!--        </svg>-->
            <!--    </a>-->
            <!--</div>-->
        </div>
    </div>
</body>
</html>
`

        const inlinedHTML = juice(html); // ✅ now html is declared

        await sendEmail({
            email: userExists.email,
            subject: 'Thank You for the Valuable Guidance',
            html: inlinedHTML
        });

        console.log('Forgot Password API hit!');
        res.status(200).json({
            status: 'success',
            message: 'Email sent successfully!!'
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: 'error',
            message: 'Internal server error'
        });
    }
};

module.exports = { sendEmailController }