<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Confirmation</title>
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
        .success-card {
            background: #ecfdf5;
            border: 1px solid #a7f3d0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin: 20px 0;
        }
        .success-title {
            color: #065f46;
            font-size: 18px;
            font-weight: 700;
            margin: 0 0 8px 0;
        }
        .security-notice {
            background-color: #fff1f2;
            border-left: 4px solid #f43f5e;
            padding: 12px 16px;
            font-size: 13px;
            color: #9f1239;
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
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="hospital-brand">Healthcare System Rwanda</h1>
            <p class="hospital-subtitle">Security Notification Service</p>
        </div>
        <div class="content">
            <h2>Muraho, {{ $user->name }}</h2>
            
            <div class="success-card">
                <div class="success-title">Password Successfully Changed</div>
                <p style="margin: 0; font-size: 14px; color: #047857;">The password for your account has been updated successfully.</p>
            </div>

            <div class="security-notice">
                <strong>Did you not make this change?</strong><br>
                If you did not authorize this password reset, your account credentials may be compromised. Please contact the Hospital IT Security Officer immediately at <a href="mailto:ruyangam15@gmail.com" style="color: #be123c; font-weight: 700;">ruyangam15@gmail.com</a>.
            </div>

            <p style="font-size: 13px; color: #64748b;">
                Timestamp: {{ now()->timezone('Africa/Kigali')->format('l, d F Y \a\t H:i:s T') }}
            </p>
        </div>
        <div class="footer">
            <p><strong>RP Karongi College • Integrated Healthcare Information Network</strong><br>
            Republic of Rwanda • Ministry of Health Compliant</p>
        </div>
    </div>
</body>
</html>
