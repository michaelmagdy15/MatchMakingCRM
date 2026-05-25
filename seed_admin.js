import { Firestore } from '@google-cloud/firestore';
import fs from 'fs';

// Initialize Admin Firestore using Application Default Credentials (ADC)
const db = new Firestore({
  projectId: 'faa-test-guide-v2',
  databaseId: '(default)'
});

const userMappings = {
  'admin-sarah': '11111111-1111-1111-1111-111111111111',
  'admin-youssef': '22222222-2222-2222-2222-222222222222',
  'rep-user': '33333333-3333-3333-3333-333333333333'
};

const profileMappings = {
  'g101': '44444444-4444-4444-4444-444444444101',
  'g102': '44444444-4444-4444-4444-444444444102',
  'g103': '44444444-4444-4444-4444-444444444103',
  'l101': '55555555-5555-5555-5555-555555555101',
  'l102': '55555555-5555-5555-5555-555555555102',
  'l103': '55555555-5555-5555-5555-555555555103'
};

const fallbackData = {
  users: [
    {
      id: userMappings['admin-sarah'],
      name: 'Sarah (Admin)',
      email: 'sarah@datingcrm.com',
      role: 'crm_admin',
      sales_target: 50000,
      can_delete_payments: true,
      can_view_global_dashboard: true,
      can_access_settings_and_history: true,
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: userMappings['admin-youssef'],
      name: 'Youssef (Manager)',
      email: 'youssef@datingcrm.com',
      role: 'manager',
      sales_target: 30000,
      can_delete_payments: false,
      can_view_global_dashboard: true,
      can_access_settings_and_history: true,
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: userMappings['rep-user'],
      name: 'Matchmaker Rep',
      email: 'matchmaker@datingcrm.com',
      role: 'rep',
      sales_target: 15000,
      can_delete_payments: false,
      can_view_global_dashboard: true,
      can_access_settings_and_history: false,
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  profiles: [
    {
      id: profileMappings['g101'],
      code: 'G101',
      full_name: 'Ahmed Hassan El-Din',
      phone_number: '+20 100 123 4567',
      phone: '+20 100 123 4567',
      email: 'ahmed.hassan@example.com',
      gender: 'Gentleman',
      status: 'Approved',
      assigned_to: userMappings['admin-sarah'],
      age: 28,
      location_of_residence: 'Heliopolis, Cairo',
      height: '1.82',
      university_field_of_study: 'Engineering / Computer Science',
      current_job: 'Product Manager at Valeo',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes, regularly',
      religious_commitment_level: 'Moderate',
      facebook_link: 'https://facebook.com/ahmed.hassan.pm',
      self_introduction: 'I am a passionate software engineer and product manager. Alumni of GUC. Enjoy working out, reading about tech startups, and hiking on weekends. Looking to build a stable, loving, and supportive relationship based on mutual respect and shared ambitions.',
      partner_preferences: 'Looking for a kind, family-oriented, and educated woman. Preferably a GUC graduate or similar background. Someone who is understanding, career-oriented but appreciates family-first values.',
      smoke_or_drink: 'Non-smoker',
      are_you_gucian: 'Yes',
      guc_id: '28-4930',
      current_financial_status: 'Stable / High Income',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: profileMappings['g102'],
      code: 'G102',
      full_name: 'Omar Farouk Abdelrahman',
      phone_number: '+20 122 345 6789',
      phone: '+20 122 345 6789',
      email: 'omar.farouk@example.com',
      gender: 'Gentleman',
      status: 'Approved',
      assigned_to: userMappings['admin-sarah'],
      age: 31,
      location_of_residence: 'Maadi, Cairo',
      height: '1.78',
      university_field_of_study: 'Business Administration',
      current_job: 'Co-founder & CEO of Fintech Startup',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes',
      religious_commitment_level: 'Moderate',
      facebook_link: 'https://facebook.com/omar.farouk.finance',
      self_introduction: 'I am a highly driven entrepreneur in the fintech sector. Love traveling, diving in Sharm, and playing football. Strongly believe in continuous self-improvement and looking for a life companion to share the journey.',
      partner_preferences: 'An independent, smart, and career-driven woman who loves life and values personal space. Location of residence: Cairo.',
      smoke_or_drink: 'Social smoker',
      are_you_gucian: 'No',
      current_financial_status: 'Excellent / Entrepreneur',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: profileMappings['g103'],
      code: 'G103',
      full_name: 'Karim Yassin Soliman',
      phone_number: '+20 101 222 3333',
      phone: '+20 101 222 3333',
      email: 'karim.yassin@example.com',
      gender: 'Gentleman',
      status: 'Pending Review',
      assigned_to: userMappings['rep-user'],
      age: 26,
      location_of_residence: 'Tagamoa, New Cairo',
      height: '1.85',
      university_field_of_study: 'Applied Sciences & Arts',
      current_job: 'Creative Director at Cairo Ad Agency',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes, trying',
      religious_commitment_level: 'Moderate',
      facebook_link: 'https://facebook.com/karim.yassin.arts',
      self_introduction: 'I am an artist, designer, and filmmaker. Love visual arts, playing electric guitar, and cinema. Looking for a soulmate who appreciates aesthetics, arts, and deep, long conversations.',
      partner_preferences: 'Artistic, highly educated, preferably working in a creative or academic field. Hijab preference: Optional / Open.',
      smoke_or_drink: 'Non-smoker',
      are_you_gucian: 'Yes',
      guc_id: '26-1029',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: profileMappings['l101'],
      code: 'L101',
      full_name: 'Sara Mahmoud El-Shimi',
      phone_number: '+20 111 987 6543',
      phone: '+20 111 987 6543',
      email: 'sara.shimi@example.com',
      gender: 'Lady',
      status: 'Approved',
      assigned_to: userMappings['admin-sarah'],
      age: 25,
      location_of_residence: 'Zamalek, Cairo',
      height: '1.65',
      university_field_of_study: 'Architecture',
      current_job: 'Senior Architect at Dar Al-Handasah',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes, regularly',
      religious_commitment_level: 'Moderate',
      facebook_link: 'https://facebook.com/sara.mahmoud.arch',
      self_introduction: 'I am an architect and painter. Passionate about historical restoration, tennis, and classical piano. Family is my absolute priority. I appreciate fine details and respect ambitious, caring individuals.',
      partner_preferences: 'Ambitious, respectful, family-oriented, and highly supportive of my career. Must have similar social values and live in Cairo.',
      smoke_or_drink: 'Non-smoker',
      are_you_gucian: 'Yes',
      guc_id: '25-8302',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: profileMappings['l102'],
      code: 'L102',
      full_name: 'Salma Dawood Fahmy',
      phone_number: '+20 106 666 8500',
      phone: '+20 106 666 8500',
      email: 'salma.dawood@example.com',
      gender: 'Lady',
      status: 'Approved',
      assigned_to: userMappings['rep-user'],
      age: 29,
      location_of_residence: 'Dokki, Giza',
      height: '1.68',
      university_field_of_study: 'Pharmacy',
      current_job: 'Clinical Pharmacist at 57357 Hospital',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes',
      religious_commitment_level: 'High',
      facebook_link: 'https://facebook.com/salma.dawood.ph',
      self_introduction: 'A quiet, home-loving, and compassionate pharmacist. I spend my spare time reading, doing community service, and practicing yoga. Religion and moral character are very important to me.',
      partner_preferences: 'A gentleman of solid moral character, honest, kind, and family-oriented. Must value stable and healthy communication.',
      smoke_or_drink: 'Non-smoker',
      are_you_gucian: 'Yes',
      guc_id: '29-0129',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: profileMappings['l103'],
      code: 'L103',
      full_name: 'Yasmine Sabry Mansour',
      phone_number: '+20 109 888 7777',
      phone: '+20 109 888 7777',
      email: 'yasmine.mansour@example.com',
      gender: 'Lady',
      status: 'Hold',
      assigned_to: userMappings['admin-youssef'],
      age: 27,
      location_of_residence: 'Tagamoa, New Cairo',
      height: '1.62',
      university_field_of_study: 'Languages & Translation',
      current_job: 'German Customer Relations Team Lead',
      marital_status: 'Single',
      have_children: 'No',
      religion: 'Muslim',
      religious_denomination: 'Sunni',
      pray_regularly: 'Yes',
      religious_commitment_level: 'Moderate',
      facebook_link: 'https://facebook.com/yasmine.mansour.german',
      self_introduction: 'I am a cheerful and outgoing German customer team leader. Love outdoor adventures, exploring new coffee spots, and travel writing. Looking to settle down with someone who is positive and adventurous.',
      partner_preferences: 'A positive, communicative, and respectful gentleman. Adventurous spirit and location of residence in Cairo are highly preferred.',
      smoke_or_drink: 'Non-smoker',
      are_you_gucian: 'No',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  matches: [
    {
      id: '66666666-6666-6666-6666-666666666001',
      lady_id: profileMappings['l101'],
      gentleman_id: profileMappings['g101'],
      lady_code: 'L101',
      gentleman_code: 'G101',
      status: 'PENDING_PHOTO_APPROVAL',
      lady_approved_profile: true,
      gentleman_approved_profile: true,
      lady_approved_photo: false,
      gentleman_approved_photo: false,
      lady_approved_contact: false,
      gentleman_approved_contact: false,
      responsible_admin_id: userMappings['admin-sarah'],
      responsible_admin_name: 'Sarah',
      notes: "Both Ahmed and Sara loved each other's written profiles! Moving them to Phase 2: Photo Swap Approval.",
      first_check: 'Completed',
      second_check: 'Pending',
      third_check: 'Pending',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666002',
      lady_id: profileMappings['l102'],
      gentleman_id: profileMappings['g102'],
      lady_code: 'L102',
      gentleman_code: 'G102',
      status: 'MATCH_ACTIVE',
      lady_approved_profile: true,
      gentleman_approved_profile: true,
      lady_approved_photo: true,
      gentleman_approved_photo: true,
      lady_approved_contact: true,
      gentleman_approved_contact: true,
      responsible_admin_id: userMappings['admin-sarah'],
      responsible_admin_name: 'Sarah',
      notes: 'Perfect Match! Mutual contact swap completed. Unlocked their direct phone lines. Admin following up in one week.',
      first_check: 'Completed',
      second_check: 'Completed',
      third_check: 'Completed',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '66666666-6666-6666-6666-666666666003',
      lady_id: profileMappings['l103'],
      gentleman_id: profileMappings['g103'],
      lady_code: 'L103',
      gentleman_code: 'G103',
      status: 'PENDING_PROFILE_APPROVAL',
      lady_approved_profile: false,
      gentleman_approved_profile: false,
      lady_approved_photo: false,
      gentleman_approved_photo: false,
      lady_approved_contact: false,
      gentleman_approved_contact: false,
      responsible_admin_id: userMappings['admin-youssef'],
      responsible_admin_name: 'Youssef',
      notes: 'Match proposed by Youssef. Pending text profile review from both Karim and Yasmine.',
      first_check: 'Pending',
      second_check: 'Pending',
      third_check: 'Pending',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  comments: [
    {
      id: '77777777-7777-7777-7777-777777777001',
      profile_id: profileMappings['g101'],
      text: 'Initial consultation complete. Highly articulate and mature candidate. Verified GUC ID successfully.',
      author: 'Sarah',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777002',
      profile_id: profileMappings['g102'],
      text: 'Polite and financially successful candidate. Prefers independent, smart partners.',
      author: 'Sarah',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777003',
      profile_id: profileMappings['g103'],
      text: 'Applied online. Undergoing phone screening. GUC student id verified.',
      author: 'Matchmaker Staff',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777004',
      profile_id: profileMappings['l101'],
      text: 'Charming and exceptionally accomplished candidate. Highly recommended.',
      author: 'Sarah',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777005',
      profile_id: profileMappings['l102'],
      text: 'Kind-hearted pharmacist. Moral character is her top requirement.',
      author: 'Matchmaker Staff',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '77777777-7777-7777-7777-777777777006',
      profile_id: profileMappings['l103'],
      text: 'Requested to be put on Hold temporarily due to a heavy business travel schedule.',
      author: 'Youssef',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  interactions: [
    {
      id: '88888888-8888-8888-8888-888888888001',
      profile_id: profileMappings['g101'],
      type: 'Visit',
      outcome: 'Scheduled Consultation',
      notes: 'In-office interview finished. All criteria verified.',
      next_follow_up: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      author: 'Sarah',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  tasks: [
    {
      id: '99999999-9999-9999-9999-999999999001',
      title: 'Verify GUC ID for Karim Yassin',
      description: 'Verify the submitted student ID 26-1029 with the registry or scan records.',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'Pending',
      priority: 'Medium',
      profile_id: profileMappings['g103'],
      assigned_to: userMappings['rep-user'],
      created_by: userMappings['admin-youssef'],
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '99999999-9999-9999-9999-999999999002',
      title: 'Follow up on Match between G101 and L101',
      description: 'Check in with both candidates regarding their photos swap decisions.',
      due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'In Progress',
      priority: 'High',
      profile_id: profileMappings['g101'],
      assigned_to: userMappings['admin-sarah'],
      created_by: userMappings['admin-sarah'],
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  audit_logs: [
    {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      user_id: userMappings['admin-sarah'],
      action: 'CREATE',
      entity_type: 'PROFILE',
      entity_id: profileMappings['g101'],
      details: 'Created and verified profile for Ahmed Hassan.',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      user_id: userMappings['admin-sarah'],
      action: 'REVEAL',
      entity_type: 'MATCH',
      entity_id: '66666666-6666-6666-6666-666666666002',
      details: 'Mutual contact details shared successfully between Omar Farouk and Salma Dawood.',
      timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
};

const collections = [
  { firestoreName: 'match_users', data: fallbackData.users },
  { firestoreName: 'match_profiles', data: fallbackData.profiles },
  { firestoreName: 'match_matches', data: fallbackData.matches },
  { firestoreName: 'match_comments', data: fallbackData.comments },
  { firestoreName: 'match_interactions', data: fallbackData.interactions },
  { firestoreName: 'match_tasks', data: fallbackData.tasks },
  { firestoreName: 'match_audit_logs', data: fallbackData.audit_logs }
];

async function runSeed() {
  console.log("Seeding Firestore via Google Cloud Admin SDK...");
  
  for (const col of collections) {
    console.log(`Writing documents to '${col.firestoreName}'...`);
    let count = 0;
    for (const record of col.data) {
      const docId = record.id;
      if (!docId) continue;
      
      try {
        const docRef = db.collection(col.firestoreName).doc(docId);
        await docRef.set(record);
        count++;
      } catch (err) {
        console.error(`Error writing document ${docId} to '${col.firestoreName}':`, err);
      }
    }
    console.log(`Successfully wrote ${count}/${col.data.length} documents to '${col.firestoreName}'.`);
  }
  
  console.log("Seeding completed successfully!");
}

runSeed().catch(console.error);
