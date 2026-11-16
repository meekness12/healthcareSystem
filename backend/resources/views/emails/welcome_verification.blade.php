<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Healthcare System Rwanda</title>
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
        .patient-card {
            background-color: #f0fdfa;
            border: 1px solid #ccfbf1;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
        }
        .patient-card-title {
            font-size: 12px;
            font-weight: 700;
            color: #0d9488;
            text-transform: uppercase;
            margin: 0 0 6px 0;
        }
        .patient-number {
            font-size: 18px;
            font-weight: 800;
            color: #042f2e;
            font-family: monospace;
            margin: 0;
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
            font-size: 36px;
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
            background-color: #f8fafc;
            border-left: 4px solid #0d9488;
            padding: 12px 16px;
            font-size: 13px;
            color: #475569;
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
            <p class="hospital-subtitle">RP Karongi College Hospital Network</p>
        </div>
        <div class="content">
            <h2 class="greeting">Muraho, {{ $user->name }}!</h2>
            <p>Welcome to the official <strong>Republic of Rwanda Healthcare Management Platform</strong>. Your patient account has been created successfully.</p>
            
            @if($patient && $patient->patient_number)
            <div class="patient-card">
                <div class="patient-card-title">Official Hospital Registration Number</div>
                <div class="patient-number">{{ $patient->patient_number }}</div>
            </div>
            @endif

            <p>To verify and activate your email address for secure clinical appointments and digital medical records, enter the following 6-digit verification code into the application:</p>

            <div class="otp-box">
                <div class="otp-label">Security Verification Code</div>
                <div class="otp-code">{{ $otpCode }}</div>
                <div class="otp-expiry">Valid for {{ $expiresInMinutes }} minutes</div>
            </div>

            <div class="security-notice">
                <strong>Hospital Security Advisory:</strong> Never share this verification code with anyone. Hospital medical personnel will never ask for your authentication codes or passwords.
            </div>

            <p>If you did not initiate this registration, please contact hospital IT security immediately at <a href="mailto:ruyangam15@gmail.com" style="color: #0d9488; font-weight: 600;">ruyangam15@gmail.com</a>.</p>
        </div>
        <div class="footer">
            <p><strong>RP Karongi College • Integrated Healthcare Information Network</strong><br>
            Republic of Rwanda • Ministry of Health Compliant<br>
            National Referral & Provincial Hospital Digital Infrastructure</p>
        </div>
    </div>
</body>
</html>
