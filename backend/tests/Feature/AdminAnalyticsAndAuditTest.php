<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\HospitalBranch;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdminAnalyticsAndAuditTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;
    protected User $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::where('role', 'admin')->first() ?? User::factory()->create([
            'role' => 'admin',
            'status' => 'active',
        ]);

        $this->regularUser = User::where('role', 'patient')->first() ?? User::factory()->create([
            'role' => 'patient',
            'status' => 'active',
        ]);
    }

    /**
     * 1. Test Admin can retrieve executive analytics overview.
     */
    public function test_admin_can_retrieve_analytics_overview(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/analytics/overview');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_patients',
                    'total_doctors',
                    'total_appointments',
                    'completed_appointments',
                    'total_consultations',
                    'total_invoices',
                    'total_revenue_rwf',
                    'formatted_revenue',
                    'outstanding_balances_rwf',
                    'formatted_outstanding',
                    'total_approved_claims_rwf',
                    'formatted_approved_claims',
                    'active_branches',
                ],
            ]);
    }

    /**
     * 2. Test appointment volume trends returns Recharts compatible series.
     */
    public function test_analytics_appointment_trends_returns_recharts_compatible_series(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/analytics/appointment-trends?days=7');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'date',
                        'formatted_date',
                        'total',
                        'completed',
                        'confirmed',
                        'cancelled',
                        'pending',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertCount(7, $data);
    }

    /**
     * 3. Test revenue by branch aggregates provincial hospital branches.
     */
    public function test_analytics_revenue_by_branch_aggregates_provincial_branches(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/analytics/revenue-by-branch');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'branch_id',
                        'branch_name',
                        'province',
                        'revenue_rwf',
                        'invoices_count',
                    ],
                ],
            ]);

        $data = $response->json('data');
        $this->assertNotEmpty($data);
    }

    /**
     * 4. Test department workload calculates consultation counts and percentages.
     */
    public function test_analytics_department_workload_calculates_department_percentages(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/analytics/department-workloads');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'department_id',
                        'department_name',
                        'consultation_count',
                        'doctor_count',
                        'percentage',
                    ],
                ],
            ]);
    }

    /**
     * 5. Test admin can list and filter users by role and status.
     */
    public function test_admin_can_list_and_filter_users_by_role_and_status(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/admin/users?role=doctor&status=active');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'email',
                        'role',
                        'status',
                    ],
                ],
            ]);

        $users = $response->json('data');
        foreach ($users as $user) {
            $this->assertEquals('doctor', $user['role']);
            $this->assertEquals('active', $user['status']);
        }
    }

    /**
     * 6. Test admin can provision a new doctor with branch and specialty.
     */
    public function test_admin_can_provision_new_doctor_with_branch_and_specialty(): void
    {
        Sanctum::actingAs($this->admin);

        $branch = HospitalBranch::where('status', 'active')->first();
        $department = Department::where('status', 'active')->first();
        $specialty = Specialty::first();

        $payload = [
            'name' => 'Dr. Emmanuel Rutayisire',
            'email' => 'dr.rutayisire.' . uniqid() . '@hospital.rw',
            'phone' => '+250788998877',
            'password' => 'SecurePass123!',
            'role' => 'doctor',
            'status' => 'active',
            'branch_id' => $branch->id,
            'department_id' => $department->id,
            'specialty_id' => $specialty->id,
            'consultation_fee' => 12000.00,
            'consultation_room' => 'Suite 305',
            'license_number' => 'RMD-2026-9999',
            'max_daily_appointments' => 15,
        ];

        $response = $this->postJson('/api/admin/users', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'Dr. Emmanuel Rutayisire')
            ->assertJsonPath('data.role', 'doctor')
            ->assertJsonPath('data.doctor.consultation_room', 'Suite 305');

        $this->assertDatabaseHas('users', [
            'email' => $payload['email'],
            'role' => 'doctor',
        ]);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'USER_CREATED',
            'target_table' => 'users',
        ]);
    }

    /**
     * 7. Test admin can toggle user account status and audit log is recorded.
     */
    public function test_admin_can_toggle_user_account_status_and_record_audit_log(): void
    {
        Sanctum::actingAs($this->admin);

        $user = User::where('role', 'patient')->first();
        $this->assertNotNull($user);

        $response = $this->patchJson("/api/admin/users/{$user->id}/status", [
            'status' => 'suspended',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'suspended');

        $this->assertEquals('suspended', $user->fresh()->status);

        $this->assertDatabaseHas('audit_logs', [
            'action' => 'USER_STATUS_TOGGLED',
            'target_table' => 'users',
            'target_id' => $user->id,
        ]);
    }

    /**
     * 8. Test admin can view and filter security audit logs.
     */
    public function test_admin_can_view_and_filter_security_audit_logs(): void
    {
        Sanctum::actingAs($this->admin);

        // Record a distinct audit entry
        AuditLog::record(
            'SECURITY_POLICY_CHECK',
            'users',
            $this->admin->id,
            ['reason' => 'Quarterly compliance review'],
            $this->admin->id,
            '127.0.0.1'
        );

        $response = $this->getJson('/api/admin/audit-logs?action=SECURITY_POLICY_CHECK');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'action',
                        'target_table',
                        'target_id',
                        'created_at',
                    ],
                ],
            ]);

        $logs = $response->json('data');
        $this->assertNotEmpty($logs);
        $this->assertEquals('SECURITY_POLICY_CHECK', $logs[0]['action']);
    }

    /**
     * 9. Test admin can stream download appointments and revenue CSV.
     */
    public function test_admin_can_download_appointments_and_revenue_csv(): void
    {
        Sanctum::actingAs($this->admin);

        $apptsResponse = $this->get('/api/admin/export/appointments-csv');
        $apptsResponse->assertStatus(200);
        $this->assertStringContainsString('text/csv', $apptsResponse->headers->get('content-type'));
        $this->assertStringContainsString('attachment;', $apptsResponse->headers->get('content-disposition'));

        $revResponse = $this->get('/api/admin/export/revenue-csv');
        $revResponse->assertStatus(200);
        $this->assertStringContainsString('text/csv', $revResponse->headers->get('content-type'));
        $this->assertStringContainsString('attachment;', $revResponse->headers->get('content-disposition'));
    }

    /**
     * 10. Test admin can download executive performance report PDF.
     */
    public function test_admin_can_download_executive_report_pdf(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->get('/api/admin/export/executive-report-pdf');

        $response->assertStatus(200);
        $this->assertStringContainsString('application/pdf', $response->headers->get('content-type'));
        $this->assertStringContainsString('Executive_Healthcare_Report', $response->headers->get('content-disposition'));
    }

    /**
     * 11. Test non-admin users receive 403 Forbidden on executive admin endpoints.
     */
    public function test_non_admin_users_cannot_access_executive_admin_endpoints(): void
    {
        Sanctum::actingAs($this->regularUser);

        $this->getJson('/api/admin/analytics/overview')->assertStatus(403);
        $this->getJson('/api/admin/users')->assertStatus(403);
        $this->getJson('/api/admin/audit-logs')->assertStatus(403);
        $this->get('/api/admin/export/appointments-csv')->assertStatus(403);
        $this->get('/api/admin/export/executive-report-pdf')->assertStatus(403);
    }
}
