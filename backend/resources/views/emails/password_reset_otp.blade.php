<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Verification Code</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 24px 12px;
            color: #1e293b;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
        }
        .header {
            background: linear-gradient(135deg, #042f2e 0%, #0d9488 100%);
            padding: 32px 28px;
            text-align: center;
            color: #ffffff;
        }
        .hospital-brand {
            font-size: 22px;
            font-weight: 800;
            letter-spacing: -0.02em;
            margin: 0 0 4px 0;
            color: #f0fdfa;
        }
        .hospital-subtitle {
            font-size: 13px;
            color: #99f6e4;
            font-weight: 500;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .content {
            padding: 32px 28px;
            line-height: 1.6;
        }
        .greeting {
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 16px 0;
            color: #0f172a;
        }
        .otp-box {
            background: #f8fafc;
            border: 2px dashed #0d9488;
            border-radius: 10px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
        }
        .otp-label {
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 8px;
        }
        .otp-code {
            font-size: 38px;
            font-weight: 800;
            color: #0f766e;
            letter-spacing: 8px;
            font-family: 'Courier New', Courier, monospace;
            margin: 8px 0;
        }
        .otp-expiry {
            font-size: 12px;
            color: #dc2626;
            font-weight: 600;
            margin: 4px 0 0 0;
        }
        .security-notice {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            font-size: 13px;
            color: #92400e;
            margin: 20px 0;
            border-radius: 0 6px 6px 0;
        }
        .footer {
            background-color: #f8fafc;
            border-top: 1px solid #e2e8f0;
            padding: 24px 28px;
            text-align: center;
            font-size: 12px;
            color: #64748b;
            line-height: 1.5;
        }
        .footer strong {
            color: #334155;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="hospital-brand">Healthcare System Rwanda</h1>
            <p class="hospital-subtitle">Security Authentication Service</p>
        </div>
        <div class="content">
            <h2 class="greeting">Muraho, {{ $user->name }}</h2>
            <p>We received a request to reset the password for your account on the <strong>Healthcare System Rwanda</strong> portal.</p>
            
            <p>Enter the following 6-digit one-time security code to authorize this password reset:</p>

            <div class="otp-box">
                <div class="otp-label">Password Reset One-Time Code</div>
                <div class="otp-code">{{ $otpCode }}</div>
                <div class="otp-expiry">Expires in {{ $expiresInMinutes }} minutes</div>
            </div>

            <div class="security-notice">
                <strong>Security Alert:</strong> If you did not request a password reset, no action is needed. Your account remains completely secure. Do not share this security code with anyone.
            </div>

            <p>For immediate security assistance, contact hospital administration at <a href="mailto:ruyangam15@gmail.com" style="color: #0d9488; font-weight: 600;">ruyangam15@gmail.com</a>.</p>
        </div>
        <div class="footer">
            <p><strong>RP Karongi College • Integrated Healthcare Information Network</strong><br>
            Republic of Rwanda • Ministry of Health Compliant</p>
        </div>
    </div>
</body>
</html>
