<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\Doctor;
use App\Models\TimeSlot;
use App\Models\Product;
use App\Models\HealthRecord;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Demo User
        User::updateOrCreate(
            ['id' => 'usr_1'],
            [
                'name' => 'Asha Sharma',
                'email' => 'asha@example.com',
                'password' => Hash::make('password123'),
                'avatar_url' => 'https://api.dicebear.com/9.x/initials/svg?seed=Asha%20Sharma',
            ]
        );

        // 2. Seed Doctors
        $doctorsData = [
            [
                'id' => 'doc_1',
                'name' => 'Dr. Rajesh Vaidya',
                'specialty' => 'Panchakarma',
                'experience_years' => 18,
                'rating' => 4.9,
                'review_count' => 342,
                'fee' => 700,
                'gender' => 'male',
                'languages' => ['English', 'Hindi', 'Malayalam'],
                'city' => 'Kochi',
                'clinic_name' => 'Kottakkal Arya Vaidya Sala',
                'avatar_url' => 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Senior Panchakarma consultant with over 18 years of clinical expertise treating chronic arthritis, neuromuscular conditions, and metabolic rejuvenation.',
                'qualifications' => ['BAMS - Kerala University', 'MD (Ayurveda) - BHU Varanasi'],
                'specializations' => ['Panchakarma Detox', 'Sandhivata Care', 'Nadi Pariksha'],
                'next_available_at' => Carbon::now()->addHours(2)->toISOString(),
                'is_available' => true,
                'search_text' => 'dr rajesh vaidya panchakarma kochi kottakkal arthritis detox',
            ],
            [
                'id' => 'doc_2',
                'name' => 'Dr. Ananya Nair',
                'specialty' => 'Kayachikitsa',
                'experience_years' => 12,
                'rating' => 4.85,
                'review_count' => 280,
                'fee' => 600,
                'gender' => 'female',
                'languages' => ['English', 'Hindi', 'Tamil'],
                'city' => 'Bengaluru',
                'clinic_name' => 'Sanjeevani Ayurveda Medical Center',
                'avatar_url' => 'https://images.unsplash.com/photo-1594824813579-994344e27f07?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Specialist in internal medicine (Kayachikitsa), managing lifestyle disorders, gut microbiome health, and chronic autoimmune management.',
                'qualifications' => ['BAMS - Rajiv Gandhi University', 'MD (Kayachikitsa) - Gujarat Ayurved University'],
                'specializations' => ['Metabolic Wellness', 'Gut Health (Amlapitta)', 'Diabetes Management'],
                'next_available_at' => Carbon::now()->addHours(3)->toISOString(),
                'is_available' => true,
                'search_text' => 'dr ananya nair kayachikitsa bengaluru internal medicine sanjeevani',
            ],
            [
                'id' => 'doc_3',
                'name' => 'Dr. Vikramaditya Sharma',
                'specialty' => 'Shalya Tantra',
                'experience_years' => 15,
                'rating' => 4.78,
                'review_count' => 195,
                'fee' => 850,
                'gender' => 'male',
                'languages' => ['English', 'Hindi'],
                'city' => 'Delhi',
                'clinic_name' => 'Ayush National Institute of Ayurveda',
                'avatar_url' => 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Renowned specialist in Ksharasutra therapy and non-invasive Ayurvedic surgery with decades of teaching and clinical research.',
                'qualifications' => ['BAMS - Delhi University', 'MS (Shalya Tantra) - NIA Jaipur'],
                'specializations' => ['Ksharasutra Therapy', 'Anorectal Disorders', 'Wound Healing'],
                'next_available_at' => Carbon::now()->addHours(5)->toISOString(),
                'is_available' => true,
                'search_text' => 'dr vikramaditya sharma shalya tantra delhi ksharasutra surgical',
            ],
            [
                'id' => 'doc_4',
                'name' => 'Dr. Meera Nambiar',
                'specialty' => 'Prasuti Tantra',
                'experience_years' => 14,
                'rating' => 4.92,
                'review_count' => 410,
                'fee' => 650,
                'gender' => 'female',
                'languages' => ['English', 'Malayalam', 'Kannada'],
                'city' => 'Thiruvananthapuram',
                'clinic_name' => 'Government Ayurveda College Hospital',
                'avatar_url' => 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Expert in Ayurvedic gynaecology and pre/postnatal care (Garbhini Paricharya) helping mothers with holistic reproductive wellness.',
                'qualifications' => ['BAMS - Calicut University', 'MD (Prasuti & Stree Roga)'],
                'specializations' => ['Garbhini Paricharya', 'PCOS / PCOD Balance', 'Hormonal Equilibrium'],
                'next_available_at' => Carbon::now()->addHours(1)->toISOString(),
                'is_available' => true,
                'search_text' => 'dr meera nambiar prasuti tantra women health pcos maternity',
            ],
            [
                'id' => 'doc_5',
                'name' => 'Dr. Suresh Acharya',
                'specialty' => 'Kaumarbhritya',
                'experience_years' => 20,
                'rating' => 4.88,
                'review_count' => 312,
                'fee' => 500,
                'gender' => 'male',
                'languages' => ['English', 'Hindi', 'Marathi'],
                'city' => 'Pune',
                'clinic_name' => 'Dhanwanthari Ayurvedic Clinic',
                'avatar_url' => 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
                'bio' => 'Pediatric Ayurvedic medicine pioneer focusing on childhood immunity (Suvarnaprashan), digestion, and natural growth nourishment.',
                'qualifications' => ['BAMS - Pune University', 'MD (Kaumarbhritya)'],
                'specializations' => ['Suvarnaprashan Drops', 'Pediatric Immunity', 'Asthma & Allergies'],
                'next_available_at' => Carbon::now()->addHours(4)->toISOString(),
                'is_available' => true,
                'search_text' => 'dr suresh acharya kaumarbhritya pediatrics children immunity pune',
            ],
        ];

        foreach ($doctorsData as $doc) {
            Doctor::updateOrCreate(['id' => $doc['id']], $doc);

            // Generate time slots for each doctor for next 7 days
            for ($day = 0; $day < 7; $day++) {
                $baseDate = Carbon::today()->addDays($day);
                $slotHours = [9, 11, 14, 16, 18];
                foreach ($slotHours as $h) {
                    $start = $baseDate->copy()->setHour($h)->setMinute(0)->toISOString();
                    $end = $baseDate->copy()->setHour($h)->setMinute(45)->toISOString();
                    $slotId = "slot_{$doc['id']}_{$day}_{$h}";
                    TimeSlot::updateOrCreate(
                        ['id' => $slotId],
                        [
                            'doctor_id' => $doc['id'],
                            'start' => $start,
                            'end' => $end,
                            'is_booked' => false,
                        ]
                    );
                }
            }
        }

        // 3. Seed Products
        $productsData = [
            [
                'id' => 'prod_1',
                'name' => 'Organic Ashwagandha Gold 1000mg',
                'brand' => 'Kottakkal Organics',
                'category' => 'Ashwagandha',
                'form' => 'capsule',
                'price' => 599,
                'mrp' => 799,
                'rating' => 4.9,
                'review_count' => 1250,
                'stock' => 180,
                'tags' => ['stress-relief', 'vitality', 'bestseller'],
                'ingredients' => ['Withania Somnifera (Ashwagandha)', 'BioPerine'],
                'description' => 'Pure KSM-66 organic Ashwagandha standardized extract for cortisol reduction, natural vitality, and deep restful sleep.',
                'image_url' => 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'organic ashwagandha gold kottakkal stress vitality sleep capsule',
            ],
            [
                'id' => 'prod_2',
                'name' => 'Triphala Digestive Detox Churna',
                'brand' => 'Dhanwanthari',
                'category' => 'Triphala',
                'form' => 'powder',
                'price' => 299,
                'mrp' => 399,
                'rating' => 4.8,
                'review_count' => 840,
                'stock' => 240,
                'tags' => ['digestion', 'detox', 'colon-cleanse'],
                'ingredients' => ['Amalaki (Emblica officinalis)', 'Bibhitaki', 'Haritaki'],
                'description' => 'Classical triple-fruit blend supporting gentle gut motility, natural cleansing, colon vitality, and nutrient absorption.',
                'image_url' => 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'triphala digestive detox churna dhanwanthari gut colon powder',
            ],
            [
                'id' => 'prod_3',
                'name' => 'Royal Saffron Chyawanprash Supreme',
                'brand' => 'Ayush Heritage',
                'category' => 'Chyawanprash',
                'form' => 'churna',
                'price' => 749,
                'mrp' => 999,
                'rating' => 4.92,
                'review_count' => 2100,
                'stock' => 95,
                'tags' => ['immunity', 'longevity', 'herbal-jam'],
                'ingredients' => ['Fresh Wild Amla', 'Kashmiri Saffron', 'Cow Ghee', 'Raw Forest Honey', '40+ Herbs'],
                'description' => 'Rejuvenating rasayana formulation loaded with natural vitamin C, saffron, and wild forest herbs for seasonal immunity.',
                'image_url' => 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'royal saffron chyawanprash supreme ayush immunity amla rasayana',
            ],
            [
                'id' => 'prod_4',
                'name' => 'Pure Himalayan Shilajit Resin 20g',
                'brand' => 'Veda Peak',
                'category' => 'Shilajit',
                'form' => 'oil',
                'price' => 1299,
                'mrp' => 1799,
                'rating' => 4.87,
                'review_count' => 920,
                'stock' => 70,
                'tags' => ['endurance', 'fulvic-acid', 'premium'],
                'ingredients' => ['100% Purified Himalayan Shilajit (80%+ Fulvic Acid)'],
                'description' => 'Gold-graded Himalayan Shilajit harvested above 16,000 feet, rich in 84+ ionic trace minerals for cellular stamina.',
                'image_url' => 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'pure himalayan shilajit resin veda peak endurance fulvic mineral',
            ],
            [
                'id' => 'prod_5',
                'name' => 'Brahmi Memory & Focus Tablets',
                'brand' => 'Nirvana Ayurveda',
                'category' => 'Brahmi',
                'form' => 'tablet',
                'price' => 449,
                'mrp' => 599,
                'rating' => 4.75,
                'review_count' => 610,
                'stock' => 150,
                'tags' => ['cognition', 'calm', 'focus'],
                'ingredients' => ['Bacopa Monnieri (Brahmi)', 'Shankhpushpi', 'Gotu Kola'],
                'description' => 'Herbal nootropic formula promoting calm mental clarity, neuro-protection, focus, and restful nervous system recovery.',
                'image_url' => 'https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'brahmi memory focus tablets nirvana cognition brain shankhpushpi',
            ],
            [
                'id' => 'prod_6',
                'name' => 'Curcumin 95% + Turmeric Joint Oil',
                'brand' => 'Kottakkal Organics',
                'category' => 'Turmeric',
                'form' => 'oil',
                'price' => 499,
                'mrp' => 650,
                'rating' => 4.82,
                'review_count' => 780,
                'stock' => 110,
                'tags' => ['joint-health', 'inflammation', 'mobility'],
                'ingredients' => ['Curcuma Longa', 'Sesame Oil', 'Eucalyptus', 'Camphor'],
                'description' => 'Traditional joint soothing massage oil infused with 95% standardized Curcumin for joint ease, cartilage protection, and flexibility.',
                'image_url' => 'https://images.unsplash.com/photo-1608248597359-59751e064e43?auto=format&fit=crop&w=400&q=80',
                'in_stock' => true,
                'search_text' => 'curcumin turmeric joint oil kottakkal joint mobility inflammation',
            ],
        ];

        foreach ($productsData as $prod) {
            Product::updateOrCreate(['id' => $prod['id']], $prod);
        }

        // 4. Seed Health Records
        $recordsData = [
            [
                'id' => 'rec_1',
                'user_id' => 'usr_1',
                'type' => 'lab_report',
                'title' => 'Lipid Profile & Metabolic Panel',
                'description' => 'Fasting cholesterol normal (168 mg/dL). HDL 52 mg/dL, LDL 96 mg/dL. Triglycerides well balanced.',
                'date' => Carbon::now()->subDays(12)->toISOString(),
                'provider' => 'Aster Medcity Diagnostics',
                'tags' => ['routine', 'diagnostic', 'wellness'],
                'attachments' => [
                    [
                        'id' => 'att_1_1',
                        'name' => 'lipid_panel_oct.pdf',
                        'kind' => 'pdf',
                        'url' => 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
                        'sizeKb' => 184,
                    ],
                ],
                'meta' => [
                    'panel' => 'Lipid Profile',
                    'result' => 'Normal',
                    'value' => 168,
                    'unit' => 'mg/dL',
                    'fasting' => true,
                ],
                'search_text' => 'lipid profile metabolic panel aster medcity cholesterol',
            ],
            [
                'id' => 'rec_2',
                'user_id' => 'usr_1',
                'type' => 'prescription',
                'title' => 'Ayurvedic Rasayana Protocol #104',
                'description' => 'Ashwagandha Churna (1 tsp at bedtime with warm cow milk) + Triphala Churna (3g before sleep).',
                'date' => Carbon::now()->subDays(28)->toISOString(),
                'provider' => 'Kottakkal Arya Vaidya Sala',
                'tags' => ['follow-up', 'wellness'],
                'attachments' => [],
                'meta' => [
                    'medicines' => ['Ashwagandha Churna', 'Triphala Churna'],
                    'dosage' => '1 tsp twice daily',
                    'durationDays' => 30,
                    'refills' => 1,
                ],
                'search_text' => 'ayurvedic rasayana protocol kottakkal ashwagandha triphala',
            ],
            [
                'id' => 'rec_3',
                'user_id' => 'usr_1',
                'type' => 'consultation',
                'title' => 'Clinical Consultation — Sandhivata & Dosha Assessment',
                'description' => 'Diagnosed mild Vata aggravation in knees. Advised Abhyanga with Mahanarayana taila and daily warm fomentation.',
                'date' => Carbon::now()->subDays(45)->toISOString(),
                'provider' => 'Dr. Rajesh Vaidya Clinic',
                'tags' => ['routine', 'wellness'],
                'attachments' => [],
                'meta' => [
                    'diagnosis' => 'Sandhivata (Vata Vyadhi)',
                    'followUpDays' => 30,
                    'pulseTaken' => true,
                    'panchakarma' => 'Abhyanga & Swedana',
                ],
                'search_text' => 'consultation sandhivata dosha assessment rajesh vaidya vata knees',
            ],
            [
                'id' => 'rec_4',
                'user_id' => 'usr_1',
                'type' => 'vaccination',
                'title' => 'Seasonal Influenza & Pneumococcal Booster',
                'description' => 'Administered annual quadrivalent flu vaccine. No post-vaccine fever or adverse reaction observed.',
                'date' => Carbon::now()->subMonths(4)->toISOString(),
                'provider' => 'Manipal Hospitals Wellness Unit',
                'tags' => ['preventive', 'routine'],
                'attachments' => [],
                'meta' => [
                    'vaccine' => 'Influenza Quadrivalent',
                    'dose' => '1 of 1',
                    'batchNo' => 'IN-884920',
                    'nextDueDays' => 365,
                ],
                'search_text' => 'seasonal influenza vaccine booster manipal hospital',
            ],
            [
                'id' => 'rec_5',
                'user_id' => 'usr_1',
                'type' => 'allergy',
                'title' => 'Allergy Notice: Peanuts & Tree Nuts',
                'description' => 'Moderate urticaria and lip swelling upon exposure to raw peanuts. Antihistamine protocol advised.',
                'date' => Carbon::now()->subMonths(8)->toISOString(),
                'provider' => 'Apollo Ayurveda Allergy Wing',
                'tags' => ['urgent', 'allergy-season'],
                'attachments' => [],
                'meta' => [
                    'allergen' => 'Peanuts / Groundnuts',
                    'severity' => 'moderate',
                    'reaction' => 'Hives & Facial Itching',
                    'verifiedBySkinTest' => true,
                ],
                'search_text' => 'allergy notice peanuts tree nuts apollo allergy urticaria',
            ],
        ];

        foreach ($recordsData as $rec) {
            HealthRecord::updateOrCreate(['id' => $rec['id']], $rec);
        }
    }
}
