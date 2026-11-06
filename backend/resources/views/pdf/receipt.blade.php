<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt - {{ $payment->transaction_reference }}</title>
    <style>
        @page {
            size: 80mm 200mm;
            margin: 5mm;
        }
        body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            color: #000;
            line-height: 1.3;
            margin: 0;
            padding: 0;
        }
        .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 6px;
            margin-bottom: 8px;
        }
        .hospital-name {
            font-size: 13px;
            font-weight: bold;
        }
        .subtitle {
            font-size: 9px;
        }
        .receipt-title {
            font-size: 12px;
            font-weight: bold;
            margin: 4px 0;
            text-transform: uppercase;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
        }
        .table-data {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 4px 0;
        }
        .table-data td {
            padding: 3px 0;
            font-size: 10px;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .bold {
            font-weight: bold;
        }
        .barcode {
            text-align: center;
            letter-spacing: 4px;
            font-size: 16px;
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            font-size: 9px;
            margin-top: 8px;
            border-top: 1px dashed #000;
            padding-top: 6px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="hospital-name">HEALTHCARE SYSTEM RWANDA</div>
        <div class="subtitle">Karongi Provincial Hospital</div>
        <div class="subtitle">B.P. 45 Kibuye &bull; TIN: 100234891</div>
        <div class="subtitle">Tel: +250 788 200 001</div>
        <div class="receipt-title">OFFICIAL PAYMENT RECEIPT</div>
    </div>

    <table style="width: 100%; font-size: 10px;">
        <tr>
            <td><strong>Txn Ref:</strong></td>
            <td class="text-right bold">{{ $payment->transaction_reference }}</td>
        </tr>
        <tr>
            <td><strong>Date/Time:</strong></td>
            <td class="text-right">{{ $payment->paid_at->format('d/m/Y H:i') }}</td>
        </tr>
        <tr>
            <td><strong>Method:</strong></td>
            <td class="text-right bold">{{ strtoupper(str_replace('_', ' ', $payment->payment_method)) }}</td>
        </tr>
        @if($payment->payer_phone)
        <tr>
            <td><strong>Phone:</strong></td>
            <td class="text-right">{{ $payment->payer_phone }}</td>
        </tr>
        @endif
        <tr>
            <td><strong>Invoice #:</strong></td>
            <td class="text-right">{{ $payment->invoice->invoice_number }}</td>
        </tr>
        <tr>
            <td><strong>Patient:</strong></td>
            <td class="text-right bold">{{ $payment->patient->user->name ?? 'Patient' }}</td>
        </tr>
        <tr>
            <td><strong>Patient ID:</strong></td>
            <td class="text-right">{{ $payment->patient->patient_number }}</td>
        </tr>
    </table>

    <table class="table-data">
        <tr>
            <td><strong>Amount Due (Co-Pay):</strong></td>
            <td class="text-right">{{ number_format($payment->invoice->total_amount_rwf) }} RWF</td>
        </tr>
        <tr style="font-size: 11px; font-weight: bold;">
            <td><strong>AMOUNT PAID:</strong></td>
            <td class="text-right">{{ number_format($payment->amount_rwf) }} RWF</td>
        </tr>
        <tr>
            <td><strong>Total Settled:</strong></td>
            <td class="text-right">{{ number_format($payment->invoice->amount_paid_rwf) }} RWF</td>
        </tr>
        <tr>
            <td><strong>Balance Remaining:</strong></td>
            <td class="text-right bold">{{ number_format($payment->invoice->balance_rwf) }} RWF</td>
        </tr>
        <tr>
            <td><strong>Invoice Status:</strong></td>
            <td class="text-right bold">{{ strtoupper(str_replace('_', ' ', $payment->invoice->status)) }}</td>
        </tr>
    </table>

    <div class="barcode">
        *{{ $payment->transaction_reference }}*
    </div>

    <div class="footer">
        <div><strong>Status: VERIFIED &bull; SUCCESSFUL</strong></div>
        <div>Cashier / System Signature: [DIGITALLY SIGNED]</div>
        <div style="margin-top: 4px;">Murakoze gukoresha serivisi zacu.</div>
        <div>Keep this slip for insurance & hospital exit.</div>
    </div>
</body>
</html>
