<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #2D3748;
            line-height: 1.5;
            font-size: 13px;
            margin: 0;
            padding: 20px;
        }
        .header-table {
            width: 100%;
            margin-bottom: 25px;
            border-bottom: 2px solid #0D9488;
            padding-bottom: 15px;
        }
        .logo-title {
            font-size: 22px;
            font-weight: bold;
            color: #0D9488;
            margin: 0;
        }
        .subtitle {
            font-size: 11px;
            color: #718096;
            margin-top: 2px;
        }
        .invoice-title {
            text-align: right;
            font-size: 20px;
            font-weight: bold;
            color: #1A202C;
        }
        .meta-table {
            width: 100%;
            margin-bottom: 25px;
        }
        .meta-box {
            width: 48%;
            background-color: #F7FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 12px;
            vertical-align: top;
        }
        .section-heading {
            font-size: 12px;
            font-weight: bold;
            color: #0D9488;
            text-transform: uppercase;
            margin-bottom: 8px;
            border-bottom: 1px solid #E2E8F0;
            padding-bottom: 4px;
        }
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
        }
        .items-table th {
            background-color: #0D9488;
            color: #FFFFFF;
            text-align: left;
            padding: 8px 10px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
        }
        .items-table td {
            padding: 10px;
            border-bottom: 1px solid #E2E8F0;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .totals-table {
            width: 45%;
            margin-left: 55%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .totals-table td {
            padding: 6px 10px;
        }
        .totals-table .total-row {
            font-size: 14px;
            font-weight: bold;
            border-top: 2px solid #0D9488;
            color: #0D9488;
        }
        .badge {
            display: inline-block;
            padding: 3px 8px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            border-radius: 4px;
        }
        .badge-paid {
            background-color: #DEF7EC;
            color: #03543F;
        }
        .badge-unpaid {
            background-color: #FDE8E8;
            color: #9B1C1C;
        }
        .badge-partial {
            background-color: #FEF08A;
            color: #713F12;
        }
        .footer {
            margin-top: 40px;
            border-top: 1px dashed #CBD5E0;
            padding-top: 15px;
            font-size: 11px;
            color: #718096;
            text-align: center;
        }
    </style>
</head>
<body>
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                <div class="logo-title">HEALTHCARE SYSTEM RWANDA</div>
                <div class="subtitle">Karongi Provincial Hospital &bull; B.P. 45 Kibuye, Western Province</div>
                <div class="subtitle">TIN: 100234891 &bull; Tel: +250 788 200 001 &bull; billing@hospital.rw</div>
            </td>
            <td style="width: 45%; vertical-align: top;">
                <div class="invoice-title">OFFICIAL INVOICE</div>
                <div style="text-align: right; margin-top: 5px;">
                    <strong>Invoice #:</strong> {{ $invoice->invoice_number }}<br>
                    <strong>Date:</strong> {{ $invoice->created_at->format('d M Y') }}<br>
                    <strong>Due Date:</strong> {{ $invoice->due_date ? $invoice->due_date->format('d M Y') : 'Due on receipt' }}<br>
                    <strong>Status:</strong> 
                    <span class="badge {{ $invoice->status === 'paid' ? 'badge-paid' : ($invoice->status === 'partially_paid' ? 'badge-partial' : 'badge-unpaid') }}">
                        {{ strtoupper(str_replace('_', ' ', $invoice->status)) }}
                    </span>
                </div>
            </td>
        </tr>
    </table>

    <table class="meta-table">
        <tr>
            <td class="meta-box" style="margin-right: 4%;">
                <div class="section-heading">Billed To (Patient)</div>
                <strong>{{ $invoice->patient->user->name ?? 'Patient' }}</strong><br>
                Patient ID: {{ $invoice->patient->patient_number }}<br>
                Phone: {{ $invoice->patient->user->phone ?? 'N/A' }}<br>
                National ID: {{ $invoice->patient->national_id ?? 'N/A' }}
            </td>
            <td style="width: 4%;"></td>
            <td class="meta-box">
                <div class="section-heading">Insurance & Co-Pay Details</div>
                <strong>Provider:</strong> {{ $invoice->patient->insuranceProvider->provider_name ?? 'Private (Self-Pay)' }}<br>
                <strong>Policy #:</strong> {{ $invoice->patient->insurance_number ?? 'None' }}<br>
                <strong>Coverage Rate:</strong> {{ $invoice->patient->insuranceProvider ? $invoice->patient->insuranceProvider->coverage_percentage_default . '%' : '0%' }}<br>
                <strong>Appointment Ref:</strong> {{ $invoice->appointment->booking_reference ?? 'Direct Intake' }}
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 50%;">Description / Service Item</th>
                <th style="width: 15%; text-align: center;">Category</th>
                <th style="width: 10%; text-align: center;">Qty</th>
                <th style="width: 10%; text-align: right;">Unit (RWF)</th>
                <th style="width: 10%; text-align: right;">Total (RWF)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $index => $item)
            <tr>
                <td class="text-center">{{ $index + 1 }}</td>
                <td>{{ $item->item_description }}</td>
                <td class="text-center">{{ ucfirst(str_replace('_', ' ', $item->item_type)) }}</td>
                <td class="text-center">{{ $item->quantity }}</td>
                <td class="text-right">{{ number_format($item->unit_price_rwf) }}</td>
                <td class="text-right">{{ number_format($item->total_price_rwf) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <table class="totals-table">
        <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ number_format($invoice->subtotal_rwf) }} RWF</td>
        </tr>
        @if($invoice->discount_rwf > 0)
        <tr>
            <td>Discount:</td>
            <td class="text-right">-{{ number_format($invoice->discount_rwf) }} RWF</td>
        </tr>
        @endif
        @if($invoice->insurance_covered_rwf > 0)
        <tr>
            <td>Insurance Covered ({{ $invoice->patient->insuranceProvider->provider_name ?? 'Insurance' }}):</td>
            <td class="text-right" style="color: #0D9488;">-{{ number_format($invoice->insurance_covered_rwf) }} RWF</td>
        </tr>
        @endif
        <tr class="total-row">
            <td>Patient Co-Pay:</td>
            <td class="text-right">{{ number_format($invoice->total_amount_rwf) }} RWF</td>
        </tr>
        <tr>
            <td>Amount Paid:</td>
            <td class="text-right">{{ number_format($invoice->amount_paid_rwf) }} RWF</td>
        </tr>
        <tr style="font-weight: bold; font-size: 13px; color: {{ $invoice->balance_rwf > 0 ? '#DC2626' : '#059669' }};">
            <td>Remaining Balance:</td>
            <td class="text-right">{{ number_format($invoice->balance_rwf) }} RWF</td>
        </tr>
    </table>

    <div class="footer">
        <p><strong>Payment Instructions:</strong> Dial <strong>*182*8*1#</strong> (MTN MoMo) or <strong>*182#</strong> (Airtel Money), or pay via Bank Card/Cash at the hospital cashier.<br>
        Murakoze gukoresha serivisi z'ibitaro bya Karongi Provincial Hospital &bull; Thank you for choosing our healthcare network.</p>
    </div>
</body>
</html>
