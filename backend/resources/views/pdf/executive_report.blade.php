<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Executive Healthcare Performance Report - {{ $generated_date ?? date('d M Y') }}</title>
    <style>
        @page {
            margin: 28px 30px;
        }
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #1E293B;
            line-height: 1.45;
            font-size: 11.5px;
            margin: 0;
            padding: 0;
        }
        .header-table {
            width: 100%;
            border-bottom: 2.5px solid #0D9488;
            padding-bottom: 12px;
            margin-bottom: 18px;
        }
        .gov-title {
            font-size: 10.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: #0F766E;
            margin: 0 0 3px 0;
        }
        .system-title {
            font-size: 18px;
            font-weight: 800;
            color: #0F172A;
            margin: 0 0 3px 0;
        }
        .doc-subtitle {
            font-size: 11px;
            color: #64748B;
            margin: 0;
        }
        .meta-right {
            text-align: right;
            vertical-align: top;
        }
        .badge-confidential {
            display: inline-block;
            background-color: #FEF2F2;
            border: 1px solid #FECACA;
            color: #991B1B;
            padding: 3px 8px;
            font-size: 9.5px;
            font-weight: 700;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        .meta-text {
            font-size: 10px;
            color: #64748B;
            line-height: 1.35;
        }
        .kpi-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 8px 0;
            margin: 0 -8px 18px -8px;
        }
        .kpi-card {
            background-color: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 6px;
            padding: 10px 12px;
            vertical-align: top;
            width: 25%;
        }
        .kpi-card.accent {
            background-color: #F0FDFA;
            border-color: #CCFBF1;
        }
        .kpi-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #64748B;
            margin-bottom: 4px;
        }
        .kpi-card.accent .kpi-label {
            color: #0D9488;
        }
        .kpi-val {
            font-size: 17px;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.1;
        }
        .kpi-sub {
            font-size: 9.5px;
            color: #94A3B8;
            margin-top: 3px;
        }
        .section-header {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #0F766E;
            border-bottom: 1.5px solid #E2E8F0;
            padding-bottom: 4px;
            margin-top: 14px;
            margin-bottom: 8px;
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .data-table th {
            background-color: #0F766E;
            color: #FFFFFF;
            text-align: left;
            padding: 6px 9px;
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .data-table th.text-right, .data-table td.text-right {
            text-align: right;
        }
        .data-table th.text-center, .data-table td.text-center {
            text-align: center;
        }
        .data-table td {
            padding: 6px 9px;
            border-bottom: 1px solid #E2E8F0;
            font-size: 10.5px;
            color: #334155;
        }
        .data-table tr:nth-child(even) td {
            background-color: #F8FAFC;
        }
        .data-table tr.total-row td {
            font-weight: 700;
            background-color: #F1F5F9;
            border-top: 2px solid #CBD5E1;
            color: #0F172A;
        }
        .status-chip {
            display: inline-block;
            padding: 2px 6px;
            font-size: 9px;
            font-weight: 700;
            border-radius: 3px;
            text-transform: uppercase;
        }
        .status-active {
            background-color: #DCFCE7;
            color: #166534;
        }
        .two-col-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .two-col-td {
            width: 48%;
            vertical-align: top;
        }
        .two-col-gap {
            width: 4%;
        }
        .signoff-table {
            width: 100%;
            margin-top: 22px;
            border-collapse: collapse;
        }
        .signoff-box {
            width: 45%;
            border-top: 1px solid #94A3B8;
            padding-top: 6px;
            font-size: 10px;
            color: #475569;
        }
        .stamp-box {
            width: 45%;
            border: 2px dashed #0D9488;
            border-radius: 6px;
            padding: 8px 12px;
            text-align: center;
            color: #0F766E;
            font-size: 9.5px;
            font-weight: 700;
            line-height: 1.3;
        }
        .footer-note {
            margin-top: 18px;
            padding-top: 8px;
            border-top: 1px solid #E2E8F0;
            font-size: 8.5px;
            color: #94A3B8;
            text-align: center;
        }
    </style>
</head>
<body>

    <!-- Executive Header -->
    <table class="header-table">
        <tr>
            <td style="width: 65%;">
                <p class="gov-title">Republic of Rwanda &bull; Ministry of Health</p>
                <h1 class="system-title">RP Karongi College Healthcare Network</h1>
                <p class="doc-subtitle">Integrated Hospital Information & Executive Management System</p>
            </td>
            <td class="meta-right" style="width: 35%;">
                <span class="badge-confidential">Official &bull; Executive Confidential</span>
                <div class="meta-text">
                    <strong>Report:</strong> Performance & Revenue Audit<br>
                    <strong>Generated:</strong> {{ $generated_at }}<br>
                    <strong>Authorized By:</strong> {{ $generated_by }}
                </div>
            </td>
        </tr>
    </table>

    <!-- Executive KPI Row 1 -->
    <table class="kpi-table">
        <tr>
            <td class="kpi-card accent">
                <div class="kpi-label">Total Revenue Collected</div>
                <div class="kpi-val">{{ number_format($overview['total_revenue_rwf'] ?? 0) }} RWF</div>
                <div class="kpi-sub">Settled patient & counter payments</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Registered Patients</div>
                <div class="kpi-val">{{ number_format($overview['total_patients'] ?? 0) }}</div>
                <div class="kpi-sub">Across 5 provincial branches</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Appointments Booked</div>
                <div class="kpi-val">{{ number_format($overview['total_appointments'] ?? 0) }}</div>
                <div class="kpi-sub">{{ number_format($overview['completed_appointments'] ?? 0) }} completed encounters</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Active Medical Staff</div>
                <div class="kpi-val">{{ number_format($overview['total_doctors'] ?? 0) }}</div>
                <div class="kpi-sub">Licensed attending physicians</div>
            </td>
        </tr>
    </table>

    <!-- Executive KPI Row 2 -->
    <table class="kpi-table" style="margin-top: -10px;">
        <tr>
            <td class="kpi-card">
                <div class="kpi-label">Approved Insurance Claims</div>
                <div class="kpi-val">{{ number_format($overview['total_approved_claims_rwf'] ?? 0) }} RWF</div>
                <div class="kpi-sub">RSSB, CBHI, MMI, Radiant, Sanlam</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Outstanding Invoices</div>
                <div class="kpi-val">{{ number_format($overview['outstanding_balances_rwf'] ?? 0) }} RWF</div>
                <div class="kpi-sub">Unsettled copay balances</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Clinical Consultations</div>
                <div class="kpi-val">{{ number_format($overview['total_consultations'] ?? 0) }}</div>
                <div class="kpi-sub">Documented EHR visits</div>
            </td>
            <td class="kpi-card">
                <div class="kpi-label">Operational Facilities</div>
                <div class="kpi-val">{{ number_format($overview['active_branches'] ?? 5) }} Branches</div>
                <div class="kpi-sub">Full provincial footprint</div>
            </td>
        </tr>
    </table>

    <!-- Section 1: Provincial Hospital Branch Performance -->
    <div class="section-header">1. Provincial Hospital Branch Operational & Financial Breakdown</div>
    <table class="data-table">
        <thead>
            <tr>
                <th style="width: 28%;">Branch Facility</th>
                <th style="width: 22%;">Province / District</th>
                <th style="width: 12%;" class="text-center">Physicians</th>
                <th style="width: 14%;" class="text-center">Appointments</th>
                <th style="width: 24%;" class="text-right">Revenue Generated (RWF)</th>
            </tr>
        </thead>
        <tbody>
            @php
                $sumBranchAppts = 0;
                $sumBranchRev = 0;
                $sumBranchDocs = 0;
            @endphp
            @forelse($branches as $branch)
                @php
                    $sumBranchAppts += $branch['appointments_count'] ?? 0;
                    $sumBranchRev += $branch['revenue_rwf'] ?? 0;
                    $sumBranchDocs += $branch['doctors_count'] ?? 0;
                @endphp
                <tr>
                    <td><strong>{{ $branch['branch_name'] }}</strong></td>
                    <td>{{ $branch['province'] }} &bull; {{ $branch['district'] ?? 'District Hospital' }}</td>
                    <td class="text-center">{{ number_format($branch['doctors_count'] ?? 0) }}</td>
                    <td class="text-center">{{ number_format($branch['appointments_count'] ?? 0) }}</td>
                    <td class="text-right"><strong>{{ number_format($branch['revenue_rwf'] ?? 0) }} RWF</strong></td>
                </tr>
            @empty
                <tr>
                    <td colspan="5" style="text-align: center; color: #94A3B8; padding: 12px;">No branch operational metrics available.</td>
                </tr>
            @endforelse
            <tr class="total-row">
                <td colspan="2">Network Totals</td>
                <td class="text-center">{{ number_format($sumBranchDocs) }}</td>
                <td class="text-center">{{ number_format($sumBranchAppts) }}</td>
                <td class="text-right">{{ number_format($sumBranchRev) }} RWF</td>
            </tr>
        </tbody>
    </table>

    <!-- Section 2: Department Workloads & Insurance Coverage Side by Side -->
    <table class="two-col-table">
        <tr>
            <td class="two-col-td">
                <div class="section-header">2. Department Clinical Workloads</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Department</th>
                            <th class="text-center">Doctors</th>
                            <th class="text-center">Encounters</th>
                            <th class="text-right">Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($departments as $dept)
                            <tr>
                                <td>{{ $dept['department_name'] }}</td>
                                <td class="text-center">{{ $dept['doctor_count'] ?? 0 }}</td>
                                <td class="text-center">{{ $dept['consultation_count'] ?? 0 }}</td>
                                <td class="text-right">{{ $dept['percentage'] ?? 0 }}%</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="4" style="text-align: center; color: #94A3B8; padding: 8px;">No departmental records.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </td>
            <td class="two-col-gap"></td>
            <td class="two-col-td">
                <div class="section-header">3. Insurance Claims Distribution</div>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Provider</th>
                            <th class="text-center">Claims</th>
                            <th class="text-right">Approved (RWF)</th>
                        </tr>
                    </thead>
                    <tbody>
                        @forelse($insurance_summary as $ins)
                            <tr>
                                <td><strong>{{ $ins['provider_name'] }}</strong></td>
                                <td class="text-center">{{ $ins['claims_count'] ?? 0 }}</td>
                                <td class="text-right">{{ number_format($ins['approved_amount_rwf'] ?? 0) }} RWF</td>
                            </tr>
                        @empty
                            <tr>
                                <td colspan="3" style="text-align: center; color: #94A3B8; padding: 8px;">No claims recorded.</td>
                            </tr>
                        @endforelse
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    <!-- Certification & Signature Signoff -->
    <table class="signoff-table">
        <tr>
            <td class="signoff-box">
                <strong>Executive Medical Directorate</strong><br>
                Chief Medical Director & System Administrator<br>
                RP Karongi College Hospital Network<br><br>
                Signature: ____________________________________<br>
                Date: {{ date('d F Y') }}
            </td>
            <td style="width: 10%;"></td>
            <td class="stamp-box">
                REPUBLIC OF RWANDA &bull; MINISTRY OF HEALTH<br>
                RP KARONGI COLLEGE HOSPITAL SYSTEM<br>
                <strong>OFFICIALLY AUDITED & APPROVED</strong><br>
                <span style="font-size: 8.5px; font-weight: normal; color: #64748B;">System Generated &bull; Security Hash: {{ strtoupper(substr(md5(microtime()), 0, 12)) }}</span>
            </td>
        </tr>
    </table>

    <!-- Footer Note -->
    <div class="footer-note">
        This document was generated automatically by the Integrated Healthcare Management System for RP Karongi College Hospital Network.<br>
        Confidential medical & financial data. Unauthorized reproduction or dissemination is strictly prohibited under Rwandan Data Privacy Law.
    </div>

</body>
</html>
