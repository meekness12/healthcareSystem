<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\HospitalBranch;
use App\Models\Department;
use App\Models\Specialty;
use App\Models\InsuranceProvider;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Medicine;
use App\Models\LabTestType;

class RwandanHealthcareSeeder extends Seeder
{
    public function run(): void
    {
        $defaultPassword = Hash::make('Password123!');

        // 1. Hospital Branches
        $branches = [
            [
                'branch_name' => 'Kigali Central Hospital Branch',
                'province' => 'Kigali City',
                'district' => 'Nyarugenge',
                'location' => 'Kiyovu',
                'address' => 'KN 4 Ave, Kigali',
                'contact_phone' => '+250 788 123 001',
                'contact_email' => 'kigali@hospital.rw',
                'status' => 'active',
            ],
            [
                'branch_name' => 'Karongi Referral Hospital Branch',
                'province' => 'Western Province',
                'district' => 'Karongi',
                'location' => 'Bwishyura',
                'address' => 'Near Lake Kivu, Karongi',
                'contact_phone' => '+250 788 123 002',
                'contact_email' => 'karongi@hospital.rw',
                'status' => 'active',
            ],
            [
                'branch_name' => 'Musanze Memorial Clinic Branch',
                'province' => 'Northern Province',
                'district' => 'Musanze',
                'location' => 'Muhoza',
                'address' => 'NM 3 Rd, Musanze',
                'contact_phone' => '+250 788 123 003',
                'contact_email' => 'musanze@hospital.rw',
                'status' => 'active',
            ],
            [
                'branch_name' => 'Rwamagana Family Care Branch',
                'province' => 'Eastern Province',
                'district' => 'Rwamagana',
                'location' => 'Kigabiro',
                'address' => 'RN 4 Highway, Rwamagana',
                'contact_phone' => '+250 788 123 004',
                'contact_email' => 'rwamagana@hospital.rw',
                'status' => 'active',
            ],
            [
                'branch_name' => 'Huye Specialized Hospital Branch',
                'province' => 'Southern Province',
                'district' => 'Huye',
                'location' => 'Ngoma',
                'address' => 'University Way, Huye',
                'contact_phone' => '+250 788 123 005',
                'contact_email' => 'huye@hospital.rw',
                'status' => 'active',
            ],
        ];

        $createdBranches = [];
        foreach ($branches as $b) {
            $createdBranches[] = HospitalBranch::create($b);
        }

        // 2. Specialties
        $specialtiesData = [
            ['specialty_name' => 'General Medicine', 'description' => 'Comprehensive outpatient and primary healthcare'],
            ['specialty_name' => 'Cardiology', 'description' => 'Heart, circulation, and vascular health management'],
            ['specialty_name' => 'Pediatrics', 'description' => 'Child health, infant care, and pediatric medicine'],
            ['specialty_name' => 'Obstetrics & Gynecology', 'description' => 'Maternal health, prenatal care, and women health'],
            ['specialty_name' => 'Orthopedics', 'description' => 'Bone fractures, joints, and musculoskeletal trauma'],
            ['specialty_name' => 'Dermatology', 'description' => 'Skin disorders, allergies, and dermatological care'],
            ['specialty_name' => 'Dental Surgery', 'description' => 'Oral health, tooth extraction, and dental restoration'],
            ['specialty_name' => 'Ophthalmology', 'description' => 'Vision testing, eye infections, and optical care'],
        ];

        $createdSpecialties = [];
        foreach ($specialtiesData as $s) {
            $createdSpecialties[] = Specialty::create($s);
        }

        // 3. Departments per Branch
        $deptNames = [
            'Internal Medicine',
            'Pediatrics',
            'Cardiology',
            'Obstetrics & Gynecology',
            'Orthopedics',
            'Emergency & Triage',
            'Dental Care',
        ];

        $createdDepartments = [];
        foreach ($createdBranches as $branch) {
            foreach ($deptNames as $name) {
                $createdDepartments[] = Department::create([
                    'branch_id' => $branch->id,
                    'department_name' => $name,
                    'description' => "Department of {$name} at {$branch->branch_name}",
                    'status' => 'active',
                ]);
            }
        }

        // 4. Insurance Providers in Rwanda
        $insurers = [
            [
                'provider_name' => 'RSSB / RAMA (La Médicale)',
                'provider_code' => 'RSSB_RAMA',
                'contact_person' => 'Emmanuel Karenzi',
                'contact_phone' => '+250 788 333 111',
                'contact_email' => 'rama@rssb.rw',
                'coverage_percentage_default' => 85.00,
            ],
            [
                'provider_name' => 'Mutuelle de Santé (CBHI)',
                'provider_code' => 'CBHI_MUTUELLE',
                'contact_person' => 'Grace Uwamahoro',
                'contact_phone' => '+250 788 333 222',
                'contact_email' => 'mutuelle@rssb.rw',
                'coverage_percentage_default' => 90.00,
            ],
            [
                'provider_name' => 'Military Medical Insurance (MMI)',
                'provider_code' => 'MMI',
                'contact_person' => 'Major Denis Rwaka',
                'contact_phone' => '+250 788 333 333',
                'contact_email' => 'claims@mmi.gov.rw',
                'coverage_percentage_default' => 85.00,
            ],
            [
                'provider_name' => 'Radiant Insurance Company',
                'provider_code' => 'RADIANT',
                'contact_person' => 'Clarisse Mutoni',
                'contact_phone' => '+250 788 333 444',
                'contact_email' => 'medical@radiant.rw',
                'coverage_percentage_default' => 80.00,
            ],
            [
                'provider_name' => 'Sanlam Vie Assurance Rwanda',
                'provider_code' => 'SANLAM',
                'contact_person' => 'Alain Mugisha',
                'contact_phone' => '+250 788 333 555',
                'contact_email' => 'health@sanlam.rw',
                'coverage_percentage_default' => 80.00,
            ],
        ];

        $createdInsurers = [];
        foreach ($insurers as $ins) {
            $createdInsurers[] = InsuranceProvider::create($ins);
        }

        // 5. Medicines Catalogue (Essential Medicines in Rwanda)
        $medicines = [
            ['medicine_name' => 'Coartem', 'generic_name' => 'Artemether/Lumefantrine', 'category' => 'Antimalarial', 'strength' => '20/120mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1500, 'stock_quantity' => 500],
            ['medicine_name' => 'Artesunate Injection', 'generic_name' => 'Artesunate', 'category' => 'Antimalarial', 'strength' => '60mg', 'dosage_form' => 'injection', 'unit_price_rwf' => 4500, 'stock_quantity' => 120],
            ['medicine_name' => 'Amoxicillin', 'generic_name' => 'Amoxicillin Trihydrate', 'category' => 'Antibiotic', 'strength' => '500mg', 'dosage_form' => 'capsule', 'unit_price_rwf' => 2000, 'stock_quantity' => 800],
            ['medicine_name' => 'Amoxicillin Oral Suspension', 'generic_name' => 'Amoxicillin', 'category' => 'Antibiotic', 'strength' => '125mg/5ml', 'dosage_form' => 'syrup', 'unit_price_rwf' => 2500, 'stock_quantity' => 250],
            ['medicine_name' => 'Ciprofloxacin', 'generic_name' => 'Ciprofloxacin HCl', 'category' => 'Antibiotic', 'strength' => '500mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 3500, 'stock_quantity' => 300],
            ['medicine_name' => 'Ceftriaxone', 'generic_name' => 'Ceftriaxone Sodium', 'category' => 'Antibiotic', 'strength' => '1g', 'dosage_form' => 'injection', 'unit_price_rwf' => 5500, 'stock_quantity' => 150],
            ['medicine_name' => 'Metronidazole', 'generic_name' => 'Metronidazole', 'category' => 'Antiprotozoal', 'strength' => '400mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1800, 'stock_quantity' => 400],
            ['medicine_name' => 'Paracetamol', 'generic_name' => 'Acetaminophen', 'category' => 'Analgesic', 'strength' => '500mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 500, 'stock_quantity' => 2000],
            ['medicine_name' => 'Paracetamol Pediatric Syrup', 'generic_name' => 'Acetaminophen', 'category' => 'Analgesic', 'strength' => '120mg/5ml', 'dosage_form' => 'syrup', 'unit_price_rwf' => 1200, 'stock_quantity' => 350],
            ['medicine_name' => 'Ibuprofen', 'generic_name' => 'Ibuprofen', 'category' => 'NSAID', 'strength' => '400mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1200, 'stock_quantity' => 600],
            ['medicine_name' => 'Diclofenac', 'generic_name' => 'Diclofenac Sodium', 'category' => 'NSAID', 'strength' => '50mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1500, 'stock_quantity' => 400],
            ['medicine_name' => 'Metformin', 'generic_name' => 'Metformin HCl', 'category' => 'Antidiabetic', 'strength' => '500mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 3000, 'stock_quantity' => 500],
            ['medicine_name' => 'Glibenclamide', 'generic_name' => 'Glibenclamide', 'category' => 'Antidiabetic', 'strength' => '5mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 2200, 'stock_quantity' => 200],
            ['medicine_name' => 'Amlodipine', 'generic_name' => 'Amlodipine Besylate', 'category' => 'Antihypertensive', 'strength' => '5mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 2500, 'stock_quantity' => 400],
            ['medicine_name' => 'Enalapril', 'generic_name' => 'Enalapril Maleate', 'category' => 'Antihypertensive', 'strength' => '10mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 2800, 'stock_quantity' => 300],
            ['medicine_name' => 'Omeprazole', 'generic_name' => 'Omeprazole', 'category' => 'Gastrointestinal', 'strength' => '20mg', 'dosage_form' => 'capsule', 'unit_price_rwf' => 2000, 'stock_quantity' => 700],
            ['medicine_name' => 'Oral Rehydration Salts (ORS)', 'generic_name' => 'Electrolytes + Glucose', 'category' => 'Rehydration', 'strength' => '20.5g sachet', 'dosage_form' => 'tablet', 'unit_price_rwf' => 400, 'stock_quantity' => 1000],
            ['medicine_name' => 'Zinc Sulfate', 'generic_name' => 'Zinc Sulfate Dispersible', 'category' => 'Mineral Supplement', 'strength' => '20mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1000, 'stock_quantity' => 600],
            ['medicine_name' => 'Salbutamol Inhaler', 'generic_name' => 'Albuterol Sulfate', 'category' => 'Respiratory', 'strength' => '100mcg/dose', 'dosage_form' => 'inhaler', 'unit_price_rwf' => 5000, 'stock_quantity' => 150],
            ['medicine_name' => 'Cetirizine', 'generic_name' => 'Cetirizine HCl', 'category' => 'Antihistamine', 'strength' => '10mg', 'dosage_form' => 'tablet', 'unit_price_rwf' => 1200, 'stock_quantity' => 500],
        ];

        foreach ($medicines as $med) {
            Medicine::create($med);
        }

        // 6. Lab Test Types
        $labTests = [
            ['test_name' => 'Malaria Rapid Diagnostic Test (RDT)', 'category' => 'Parasitology', 'description' => 'Fast antigen detection for P. falciparum', 'price_rwf' => 1000, 'turnaround_hours' => 1],
            ['test_name' => 'Thick & Thin Blood Smear (Giemsa)', 'category' => 'Parasitology', 'description' => 'Microscopic malaria parasite density count', 'price_rwf' => 1500, 'turnaround_hours' => 2],
            ['test_name' => 'Full Blood Count (FBC/CBC)', 'category' => 'Hematology', 'description' => 'WBC, RBC, Platelets, Hemoglobin, Hematocrit', 'price_rwf' => 5000, 'turnaround_hours' => 4],
            ['test_name' => 'Blood Glucose (Fasting / Random)', 'category' => 'Biochemistry', 'description' => 'Serum glucose evaluation for diabetes', 'price_rwf' => 2500, 'turnaround_hours' => 1],
            ['test_name' => 'Glycated Hemoglobin (HbA1c)', 'category' => 'Biochemistry', 'description' => '3-month average blood sugar monitoring', 'price_rwf' => 8000, 'turnaround_hours' => 6],
            ['test_name' => 'Urinalysis (Urine Dipstick + Microscopy)', 'category' => 'Biochemistry', 'description' => 'Protein, glucose, leukocytes, nitrites, casts', 'price_rwf' => 3000, 'turnaround_hours' => 2],
            ['test_name' => 'Widal Test (Typhoid Fever)', 'category' => 'Serology', 'description' => 'Salmonella typhi and paratyphi antibody titer', 'price_rwf' => 4000, 'turnaround_hours' => 3],
            ['test_name' => 'Stool Examination (Direct & Kato-Katz)', 'category' => 'Parasitology', 'description' => 'Intestinal helminths and protozoa identification', 'price_rwf' => 2500, 'turnaround_hours' => 2],
            ['test_name' => 'Lipid Profile Panel', 'category' => 'Biochemistry', 'description' => 'Total Cholesterol, HDL, LDL, Triglycerides', 'price_rwf' => 12000, 'turnaround_hours' => 8],
            ['test_name' => 'Renal Function Test (RFT)', 'category' => 'Biochemistry', 'description' => 'Serum Creatinine, Blood Urea Nitrogen (BUN)', 'price_rwf' => 10000, 'turnaround_hours' => 6],
            ['test_name' => 'Liver Function Test (LFT)', 'category' => 'Biochemistry', 'description' => 'ALT, AST, ALP, Total Bilirubin, Albumin', 'price_rwf' => 12000, 'turnaround_hours' => 8],
            ['test_name' => 'Hepatitis B Surface Antigen (HBsAg)', 'category' => 'Serology', 'description' => 'Rapid qualitative screening for HBV', 'price_rwf' => 3500, 'turnaround_hours' => 2],
            ['test_name' => 'COVID-19 Antigen Rapid Test', 'category' => 'Virology', 'description' => 'Nasal swab rapid antigen test', 'price_rwf' => 5000, 'turnaround_hours' => 1],
        ];

        foreach ($labTests as $lt) {
            LabTestType::create($lt);
        }

        // 7. Seed System Users Across All 6 Roles
        // Admin
        $admin = User::create([
            'name' => 'Pacifique Mugabo',
            'email' => 'admin@hospital.rw',
            'phone' => '+250 788 000 001',
            'password' => $defaultPassword,
            'role' => 'admin',
            'status' => 'active',
        ]);

        // Doctors
        $doc1User = User::create([
            'name' => 'Dr. Jean-Claude Gasana',
            'email' => 'dr.gasana@hospital.rw',
            'phone' => '+250 788 100 001',
            'password' => $defaultPassword,
            'role' => 'doctor',
            'status' => 'active',
        ]);

        $doc1 = Doctor::create([
            'user_id' => $doc1User->id,
            'branch_id' => $createdBranches[1]->id, // Karongi
            'department_id' => $createdDepartments[9]->id, // Cardiology at Karongi
            'specialty_id' => $createdSpecialties[1]->id, // Cardiology
            'license_number' => 'RMD-2018-0421',
            'consultation_room' => 'Consultation Suite 104',
            'consultation_fee' => 15000.00,
            'max_daily_appointments' => 12,
            'bio' => 'Senior Cardiologist with 12+ years experience in clinical cardiovascular care in Rwanda.',
        ]);

        $doc2User = User::create([
            'name' => 'Dr. Alice Uwase',
            'email' => 'dr.uwase@hospital.rw',
            'phone' => '+250 788 100 002',
            'password' => $defaultPassword,
            'role' => 'doctor',
            'status' => 'active',
        ]);

        $doc2 = Doctor::create([
            'user_id' => $doc2User->id,
            'branch_id' => $createdBranches[0]->id, // Kigali
            'department_id' => $createdDepartments[1]->id, // Pediatrics at Kigali
            'specialty_id' => $createdSpecialties[2]->id, // Pediatrics
            'license_number' => 'RMD-2020-0891',
            'consultation_room' => 'Pediatric Clinic 202',
            'consultation_fee' => 10000.00,
            'max_daily_appointments' => 15,
            'bio' => 'Pediatrician dedicated to newborn and infant emergency and routine child wellness care.',
        ]);

        $doc3User = User::create([
            'name' => 'Dr. Jean Paul Nkurunziza',
            'email' => 'dr.nkurunziza@hospital.rw',
            'phone' => '+250 788 100 003',
            'password' => $defaultPassword,
            'role' => 'doctor',
            'status' => 'active',
        ]);

        $doc3 = Doctor::create([
            'user_id' => $doc3User->id,
            'branch_id' => $createdBranches[1]->id, // Karongi
            'department_id' => $createdDepartments[7]->id, // Internal Med at Karongi
            'specialty_id' => $createdSpecialties[0]->id, // General Medicine
            'license_number' => 'RMD-2015-0112',
            'consultation_room' => 'OPD Room 101',
            'consultation_fee' => 8000.00,
            'max_daily_appointments' => 15,
            'bio' => 'Consultant Physician in General and Internal Medicine at Karongi Referral Hospital.',
        ]);

        // Doctor Schedules (Mon-Fri)
        $days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        foreach ([$doc1, $doc2, $doc3] as $doctor) {
            foreach ($days as $day) {
                DoctorSchedule::create([
                    'doctor_id' => $doctor->id,
                    'day_of_week' => $day,
                    'start_time' => '08:00:00',
                    'end_time' => '16:00:00',
                    'slot_duration_minutes' => 30,
                    'status' => 'active',
                ]);
            }
        }

        // Lab Technician
        $labTech = User::create([
            'name' => 'Eric Ndayisaba',
            'email' => 'lab.karongi@hospital.rw',
            'phone' => '+250 788 200 001',
            'password' => $defaultPassword,
            'role' => 'lab_technician',
            'status' => 'active',
        ]);

        // Pharmacist
        $pharmacist = User::create([
            'name' => 'Marie-Rose Umwali',
            'email' => 'pharma.karongi@hospital.rw',
            'phone' => '+250 788 200 002',
            'password' => $defaultPassword,
            'role' => 'pharmacist',
            'status' => 'active',
        ]);

        // Billing Officer
        $billing = User::create([
            'name' => 'Innocent Habumugisha',
            'email' => 'billing.karongi@hospital.rw',
            'phone' => '+250 788 200 003',
            'password' => $defaultPassword,
            'role' => 'billing_officer',
            'status' => 'active',
        ]);

        // Patients
        $pat1User = User::create([
            'name' => 'Keza Divine',
            'email' => 'keza.divine@gmail.com',
            'phone' => '+250 788 500 001',
            'password' => $defaultPassword,
            'role' => 'patient',
            'status' => 'active',
        ]);

        Patient::create([
            'user_id' => $pat1User->id,
            'patient_number' => 'PAT-2026-0001',
            'dob' => '1998-05-14',
            'gender' => 'female',
            'national_id' => '1199870023456781',
            'address' => 'Bwishyura, Karongi, Western Province',
            'emergency_contact_name' => 'Claude Manzi (Brother)',
            'emergency_contact_phone' => '+250 788 500 099',
            'insurance_provider_id' => $createdInsurers[0]->id, // RSSB RAMA
            'insurance_number' => 'RAMA-09827361',
            'allergies' => 'Penicillin, Aspirin',
            'medical_history' => 'Occasional migraine, mild seasonal rhinitis',
        ]);

        $pat2User = User::create([
            'name' => 'Kwizera Aimé',
            'email' => 'kwizera.aime@gmail.com',
            'phone' => '+250 788 500 002',
            'password' => $defaultPassword,
            'role' => 'patient',
            'status' => 'active',
        ]);

        Patient::create([
            'user_id' => $pat2User->id,
            'patient_number' => 'PAT-2026-0002',
            'dob' => '1994-11-23',
            'gender' => 'male',
            'national_id' => '1199480012345672',
            'address' => 'Nyarugenge, Kigali City',
            'emergency_contact_name' => 'Solange Uwera (Spouse)',
            'emergency_contact_phone' => '+250 788 500 088',
            'insurance_provider_id' => $createdInsurers[1]->id, // Mutuelle de Sante
            'insurance_number' => 'CBHI-04-2026-8712',
            'allergies' => 'None known',
            'medical_history' => 'Fracture of left tibia in 2021 (fully resolved)',
        ]);
    }
}
