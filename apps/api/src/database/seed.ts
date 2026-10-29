import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';
import { ProjectService } from '../services/project.service';
import { EngineerService } from '../services/engineer.service';
import { VerificationService } from '../services/verification.service';
import { KnowledgeService } from '../services/knowledge.service';
import {
  UserRole,
  VerificationStatus,
  PostType,
  ConsultationType,
  ConsultationStatus,
  ProjectStage,
  DocumentType,
  ReactionType,
} from '@buildlink/shared';

export interface SeedCredentials {
  role: string;
  email: string;
  password: string;
  displayName: string;
  description: string;
}

export const SEED_ACCOUNTS: SeedCredentials[] = [
  {
    role: 'ADMIN',
    email: 'admin@buildlink.lk',
    password: 'AdminPassword123!',
    displayName: 'Admin Officer',
    description: 'Platform Administrator with full access to audit logs and verification approvals',
  },
  {
    role: 'ENGINEER (Structural - Verified)',
    email: 'kamal.engineer@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Kamal Silva',
    description: 'Senior Chartered Structural Engineer (IESL Chartered, 15 Yrs Exp, Rating 4.9)',
  },
  {
    role: 'ENGINEER (Geotechnical / NBRO - Verified)',
    email: 'anura.geotech@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Anura Wickramasinghe',
    description: 'NBRO Accredited Geotechnical & Slope Stability Specialist (Kandy, Rating 5.0)',
  },
  {
    role: 'ENGINEER (MEP & Solar - Verified)',
    email: 'nimal.mep@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Nimal Jayawardena',
    description: 'Chartered MEP & Solar PV Building Systems Engineer (Gampaha, Rating 4.8)',
  },
  {
    role: 'ENGINEER (Quantity Surveying & Cost - Verified)',
    email: 'tharindu.qs@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Tharindu Fernando',
    description: 'Chartered Quantity Surveyor & BOQ Cost Specialist (Colombo, Rating 4.9)',
  },
  {
    role: 'ENGINEER (Eco & Structural Design - Verified)',
    email: 'oshadi.arch@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Oshadi Senanayake',
    description: 'Sustainable Construction & Structural Design Specialist (Kurunegala, Rating 4.9)',
  },
  {
    role: 'ENGINEER (Pending Admin Review)',
    email: 'rohan.applicant@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Rohan Dissanayake',
    description: 'Applicant with credentials pending admin audit on /admin/verification',
  },
  {
    role: 'HOMEOWNER / CLIENT 1',
    email: 'client@buildlink.lk',
    password: 'ClientPassword123!',
    displayName: 'Dilshan Perera',
    description: 'Homeowner with active residential construction projects, consultations, and messages',
  },
  {
    role: 'HOMEOWNER / CLIENT 2',
    email: 'malini.homeowner@buildlink.lk',
    password: 'ClientPassword123!',
    displayName: 'Malini Rajapaksa',
    description: 'Homeowner building a hillside villa in Kundasale, Kandy',
  },
];

/**
 * Idempotent Seed Function that persists all dummy accounts & test fixtures into Azure SQL Database
 */
export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Checking and seeding real database records...');

  // 1. Seed Admin Account
  let admin = await UserService.findByEmail('admin@buildlink.lk');
  if (!admin) {
    admin = await UserService.createUser({
      email: 'admin@buildlink.lk',
      password: 'AdminPassword123!',
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'Officer',
      district: 'Colombo',
      city: 'Colombo 01',
      phoneNumber: '+94 11 234 5678',
    });
    console.log('[Seed] Created Admin: admin@buildlink.lk');
  }
  await UserService.updateProfile(admin.id, {
    displayName: 'Admin Officer (IESL Verification Desk)',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=250&auto=format&fit=crop&q=80',
    bio: 'BuildLink Sri Lanka Official Verification & Compliance Administrator.',
  });

  // 2. Seed Verified Structural Engineer (Kamal Silva)
  let kamal = await UserService.findByEmail('kamal.engineer@buildlink.lk');
  if (!kamal) {
    kamal = await UserService.createUser({
      email: 'kamal.engineer@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Kamal',
      lastName: 'Silva',
      district: 'Colombo',
      city: 'Colombo 03',
      phoneNumber: '+94 77 123 4567',
      engineerTitle: 'Senior Chartered Structural Engineer',
      specialization: 'Structural Analysis',
    });
  }
  await UserService.updateProfile(kamal.id, {
    displayName: 'Eng. Kamal Silva',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=250&auto=format&fit=crop&q=80',
    bio: 'Chartered structural engineer with over 15 years experience in Sri Lankan commercial and high-rise residential construction. Specialized in Eurocode/CIDA concrete standards and foundation inspection.',
  });
  await UserService.updateEngineerProfile(kamal.id, {
    title: 'Senior Chartered Structural Engineer & Foundation Specialist',
    specializations: [
      'Structural Analysis',
      'High-Rise Concrete',
      'Foundation Design',
      'Earthquake Resistant Design',
    ],
    yearsOfExperience: 15,
    registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
    registrationNumber: 'IESL-CENG-8492',
    consultationFee: 7500,
    bio: 'Chartered structural engineer with over 15 years experience in Sri Lankan commercial and high-rise residential construction. Specialized in Eurocode/CIDA concrete standards and foundation inspection.',
    availableForConsultation: true,
  });
  await UserService.setEngineerVerificationAndRating(kamal.id, VerificationStatus.VERIFIED, 4.9, 28);
  kamal = (await UserService.findByEmail('kamal.engineer@buildlink.lk'))!;

  // 3. Seed Verified Geotechnical Engineer (Anura Wickramasinghe)
  let anura = await UserService.findByEmail('anura.geotech@buildlink.lk');
  if (!anura) {
    anura = await UserService.createUser({
      email: 'anura.geotech@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Anura',
      lastName: 'Wickramasinghe',
      district: 'Kandy',
      city: 'Peradeniya',
      phoneNumber: '+94 71 456 7890',
      engineerTitle: 'NBRO Accredited Geotechnical Engineer',
      specialization: 'Slope Stability & Foundation',
    });
  }
  await UserService.updateProfile(anura.id, {
    displayName: 'Eng. Anura Wickramasinghe',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=250&auto=format&fit=crop&q=80',
    bio: 'Specialist in hill-country slope stability assessments, NBRO building clearance certifications, and deep piling foundation design across Central and Sabaragamuwa provinces.',
  });
  await UserService.updateEngineerProfile(anura.id, {
    title: 'NBRO Accredited Geotechnical & Slope Stability Specialist',
    specializations: [
      'Slope Stability',
      'Retaining Walls',
      'NBRO Clearance',
      'Soil Investigation',
    ],
    yearsOfExperience: 12,
    registrationBody: 'IESL / NBRO Accredited',
    registrationNumber: 'IESL-GEO-4219',
    consultationFee: 6000,
    bio: 'Specialist in hill-country slope stability assessments, NBRO building clearance certifications, and deep piling foundation design across Central and Sabaragamuwa provinces.',
    availableForConsultation: true,
  });
  await UserService.setEngineerVerificationAndRating(anura.id, VerificationStatus.VERIFIED, 5.0, 14);
  anura = (await UserService.findByEmail('anura.geotech@buildlink.lk'))!;

  // 4. Seed Verified MEP Engineer (Nimal Jayawardena)
  let nimal = await UserService.findByEmail('nimal.mep@buildlink.lk');
  if (!nimal) {
    nimal = await UserService.createUser({
      email: 'nimal.mep@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Nimal',
      lastName: 'Jayawardena',
      district: 'Gampaha',
      city: 'Negombo',
      phoneNumber: '+94 76 987 6543',
      engineerTitle: 'Chartered MEP & Solar PV Engineer',
      specialization: 'MEP Systems & Solar',
    });
  }
  await UserService.updateProfile(nimal.id, {
    displayName: 'Eng. Nimal Jayawardena',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=250&auto=format&fit=crop&q=80',
    bio: 'Expertise in building mechanical, electrical, and plumbing engineering, rooftop solar net-metering integration, and rainwater harvesting designs compliant with UDA guidelines.',
  });
  await UserService.updateEngineerProfile(nimal.id, {
    title: 'Chartered MEP & Solar PV Building Systems Engineer',
    specializations: [
      'MEP Systems',
      'Solar PV Integration',
      'HVAC Design',
      'Plumbing & Drainage',
    ],
    yearsOfExperience: 10,
    registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
    registrationNumber: 'IESL-MEP-5190',
    consultationFee: 5000,
    bio: 'Expertise in building mechanical, electrical, and plumbing engineering, rooftop solar net-metering integration, and rainwater harvesting designs compliant with UDA guidelines.',
    availableForConsultation: true,
  });
  await UserService.setEngineerVerificationAndRating(nimal.id, VerificationStatus.VERIFIED, 4.8, 19);
  nimal = (await UserService.findByEmail('nimal.mep@buildlink.lk'))!;

  // 5. Seed Verified Quantity Surveyor & Cost Specialist (Tharindu Fernando)
  let tharindu = await UserService.findByEmail('tharindu.qs@buildlink.lk');
  if (!tharindu) {
    tharindu = await UserService.createUser({
      email: 'tharindu.qs@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Tharindu',
      lastName: 'Fernando',
      district: 'Colombo',
      city: 'Maharagama',
      phoneNumber: '+94 77 555 2341',
      engineerTitle: 'Chartered Quantity Surveyor & BOQ Specialist',
      specialization: 'Quantity Surveying & Costing',
    });
  }
  await UserService.updateProfile(tharindu.id, {
    displayName: 'Eng. Tharindu Fernando',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=250&auto=format&fit=crop&q=80',
    bio: 'Chartered Quantity Surveyor (IQSSL / RICS) specializing in residential BOQ preparation, contractor claim auditing, CIDA price fluctuation formulas, and bank housing loan stage valuations.',
  });
  await UserService.updateEngineerProfile(tharindu.id, {
    title: 'Chartered Quantity Surveyor & Construction Cost Consultant',
    specializations: [
      'BOQ & Cost Estimation',
      'Contractor Auditing',
      'Bank Loan Valuations',
      'Material Procurement',
    ],
    yearsOfExperience: 11,
    registrationBody: 'Institute of Quantity Surveyors Sri Lanka (IQSSL)',
    registrationNumber: 'IQSSL-CQS-3104',
    consultationFee: 5500,
    bio: 'Chartered Quantity Surveyor (IQSSL / RICS) specializing in residential BOQ preparation, contractor claim auditing, CIDA price fluctuation formulas, and bank housing loan stage valuations.',
    availableForConsultation: true,
  });
  await UserService.setEngineerVerificationAndRating(tharindu.id, VerificationStatus.VERIFIED, 4.9, 22);
  tharindu = (await UserService.findByEmail('tharindu.qs@buildlink.lk'))!;

  // 6. Seed Verified Eco & Structural Design Engineer (Oshadi Senanayake)
  let oshadi = await UserService.findByEmail('oshadi.arch@buildlink.lk');
  if (!oshadi) {
    oshadi = await UserService.createUser({
      email: 'oshadi.arch@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Oshadi',
      lastName: 'Senanayake',
      district: 'Kurunegala',
      city: 'Kurunegala Town',
      phoneNumber: '+94 71 888 1122',
      engineerTitle: 'Sustainable Construction & Structural Engineer',
      specialization: 'Eco Housing & Structural Design',
    });
  }
  await UserService.updateProfile(oshadi.id, {
    displayName: 'Eng. Oshadi Senanayake',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=250&auto=format&fit=crop&q=80',
    bio: 'Green Building Council Sri Lanka (GBCSL) accredited structural engineer focused on tropical passive cooling, CSEB compressed earth brick structures, and courtyard villa engineering.',
  });
  await UserService.updateEngineerProfile(oshadi.id, {
    title: 'Chartered Civil & Sustainable Tropical Building Engineer',
    specializations: [
      'Sustainable Construction',
      'CSEB Earth Blocks',
      'Residential Structural Design',
      'Waterproofing Systems',
    ],
    yearsOfExperience: 9,
    registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
    registrationNumber: 'IESL-CENG-7741',
    consultationFee: 6500,
    bio: 'Green Building Council Sri Lanka (GBCSL) accredited structural engineer focused on tropical passive cooling, CSEB compressed earth brick structures, and courtyard villa engineering.',
    availableForConsultation: true,
  });
  await UserService.setEngineerVerificationAndRating(oshadi.id, VerificationStatus.VERIFIED, 4.9, 16);
  oshadi = (await UserService.findByEmail('oshadi.arch@buildlink.lk'))!;

  // 7. Seed Engineer Applicant Pending Admin Audit (Rohan Dissanayake)
  let rohan = await UserService.findByEmail('rohan.applicant@buildlink.lk');
  if (!rohan) {
    rohan = await UserService.createUser({
      email: 'rohan.applicant@buildlink.lk',
      password: 'EngineerPassword123!',
      role: UserRole.ENGINEER,
      firstName: 'Rohan',
      lastName: 'Dissanayake',
      district: 'Galle',
      city: 'Galle Fort',
      phoneNumber: '+94 70 333 4455',
      engineerTitle: 'Coastal Structural Engineer',
      specialization: 'Marine & Coastal Concrete',
    });
  }
  await UserService.updateProfile(rohan.id, {
    displayName: 'Eng. Rohan Dissanayake',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=250&auto=format&fit=crop&q=80',
    bio: 'Practicing civil engineer specializing in saline-environment foundation designs and coastal breakwaters in the Southern Province.',
  });
  await UserService.updateEngineerProfile(rohan.id, {
    title: 'Civil & Coastal Construction Engineer',
    specializations: ['Marine & Coastal Concrete', 'Saline Resistant Foundations'],
    yearsOfExperience: 7,
    registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
    registrationNumber: 'IESL-AM-9812',
    consultationFee: 4500,
    bio: 'Practicing civil engineer specializing in saline-environment foundation designs and coastal breakwaters in the Southern Province.',
    availableForConsultation: true,
  });

  const existingRohanApp = await VerificationService.getMyVerificationStatus(rohan.id);
  if (!existingRohanApp) {
    try {
      await VerificationService.applyForVerification(rohan.id, rohan.email, {
        registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
        registrationNumber: 'IESL-AM-9812',
        documents: [
          {
            documentType: DocumentType.DEGREE_CERTIFICATE,
            originalFilename: 'BSc_Eng_University_of_Moratuwa.pdf',
            fileUrl: 'https://storage.buildlink.lk/docs/degrees/moratuwa_civil_rohan.pdf',
            fileSizeBytes: 2450000,
          },
          {
            documentType: DocumentType.IESL_MEMBERSHIP_CARD,
            originalFilename: 'IESL_Associate_Member_Card.pdf',
            fileUrl: 'https://storage.buildlink.lk/docs/licenses/iesl_am_9812.pdf',
            fileSizeBytes: 1120000,
          },
        ],
      });
    } catch {
      // ignore
    }
  }

  // 8. Seed Homeowner / Client 1 (Dilshan Perera)
  let client = await UserService.findByEmail('client@buildlink.lk');
  if (!client) {
    client = await UserService.createUser({
      email: 'client@buildlink.lk',
      password: 'ClientPassword123!',
      role: UserRole.USER,
      firstName: 'Dilshan',
      lastName: 'Perera',
      district: 'Colombo',
      city: 'Dehiwala',
      phoneNumber: '+94 77 999 8877',
    });
  }
  await UserService.updateProfile(client.id, {
    displayName: 'Dilshan Perera',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=250&auto=format&fit=crop&q=80',
    bio: 'Homeowner currently building a two-storey modern residence in Kandy and renovating a family house in Dehiwala.',
  });
  client = (await UserService.findByEmail('client@buildlink.lk'))!;

  // 9. Seed Homeowner / Client 2 (Malini Rajapaksa)
  let malini = await UserService.findByEmail('malini.homeowner@buildlink.lk');
  if (!malini) {
    malini = await UserService.createUser({
      email: 'malini.homeowner@buildlink.lk',
      password: 'ClientPassword123!',
      role: UserRole.USER,
      firstName: 'Malini',
      lastName: 'Rajapaksa',
      district: 'Kandy',
      city: 'Kundasale',
      phoneNumber: '+94 71 222 3344',
    });
  }
  await UserService.updateProfile(malini.id, {
    displayName: 'Malini Rajapaksa',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=250&auto=format&fit=crop&q=80',
    bio: 'Building an eco-friendly courtyard residence in Kundasale with solar PV and rainwater harvesting.',
  });
  malini = (await UserService.findByEmail('malini.homeowner@buildlink.lk'))!;

  // 10. Seed Knowledge Hub Articles in SQL Database
  try {
    await KnowledgeService.initSeedArticles();
    console.log('[Seed] Verified Knowledge Hub articles in database.');
  } catch (err) {
    console.warn('[Seed] Note on Knowledge Hub seeding:', err);
  }

  // 11. Seed Rich Community Posts, Project Showcases & Q&A Questions
  try {
    const existingPosts = await PostService.listPosts({});
    const existingTitles = new Set(existingPosts.map((p) => p.title));

    if (!existingTitles.has('Hairline cracks along ground-floor reinforced slab after 14 days of curing')) {
      const q1 = await PostService.createPost(client.id, {
        postType: PostType.QUESTION,
        category: 'Structural Engineering',
        title: 'Hairline cracks along ground-floor reinforced slab after 14 days of curing',
        content:
          'We completed pouring our ground floor slab using ready-mix Grade 25 concrete 14 days ago. During wet burlap curing we noticed minor hairline surface cracks near secondary beams. Are these plastic shrinkage cracks or signs of structural deflection? What remedial testing is required under SLS 1253?',
        mediaUrls: [
          'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80',
        ],
      });
      const c1 = await PostService.addComment(q1.id, kamal.id, {
        content:
          'These are characteristic plastic shrinkage cracks common in Sri Lanka when high ambient temperatures cause early surface moisture evaporation before concrete achieves tensile strength. If crack widths are under 0.2mm per SLS 1253, structural integrity is not compromised. Recommended remedial action: Clean surface with compressed air and seal with low-viscosity epoxy resin slurry to prevent moisture ingress to reinforcement.',
      });
      await PostService.resolveQuestion(q1.id, client.id, UserRole.USER, { acceptedCommentId: c1.id });
      await PostService.toggleHelpfulComment(c1.id, client.id);
      await PostService.toggleLike(q1.id, kamal.id, ReactionType.INSIGHT);
    }

    if (!existingTitles.has('Off-shore sea sand vs M-Sand for masonry plastering in coastal Gampaha')) {
      const q2 = await PostService.createPost(client.id, {
        postType: PostType.QUESTION,
        category: 'Materials & Supplies',
        title: 'Off-shore sea sand vs M-Sand for masonry plastering in coastal Gampaha',
        content:
          'With natural river sand shortages in Gampaha, should we use offshore washed sea sand from Sri Lanka Land Development Corporation (SLLDC) or manufactured sand (M-sand) for exterior wall plastering within 2km of the Negombo coastline?',
      });
      const c2 = await PostService.addComment(q2.id, nimal.id, {
        content:
          'For coastal zones within 2km of sea spray, offshore washed sea sand must strictly have a chloride ion test certificate confirming < 0.05% chloride content by mass of cement (SLS 1397). High-grade washed M-sand with controlled silt/fines below 5% is preferred for exterior rendering as it offers superior bond strength and minimizes efflorescence.',
      });
      await PostService.toggleHelpfulComment(c2.id, kamal.id);
      await PostService.toggleLike(q2.id, nimal.id, ReactionType.LIKE);
    }

    if (!existingTitles.has('CIDA SP/201 Mandatory Clear Cover Requirements for Coastal Sri Lanka')) {
      const p3 = await PostService.createPost(kamal.id, {
        postType: PostType.PROFESSIONAL_ADVICE,
        category: 'Building Regulations',
        title: 'CIDA SP/201 Mandatory Clear Cover Requirements for Coastal Sri Lanka',
        content:
          'A reminder to all contractors and builders: For residential structures within 5km of the sea, minimum concrete cover to main reinforcement must be at least 50mm (Grade 30 concrete) per CIDA SP/201. Never use site-broken bricks or timber as cover blocks — always use precast high-density concrete spacers tied to rebar with binding wire.',
        mediaUrls: [
          'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80',
        ],
      });
      await PostService.toggleLike(p3.id, client.id, ReactionType.SOLID);
      await PostService.toggleLike(p3.id, anura.id, ReactionType.LIKE);
    }

    if (!existingTitles.has('Completed NBRO Stepped Boulder & RC Retaining Wall in Hantana, Kandy')) {
      const p4 = await PostService.createPost(anura.id, {
        postType: PostType.PROJECT_UPDATE,
        category: 'Geotechnical & Landslides',
        title: 'Completed NBRO Stepped Boulder & RC Retaining Wall in Hantana, Kandy',
        content:
          'Just signed off the final stage of a 6.5m stepped reinforced concrete cantilever and random rubble retaining wall for a sloping residential block in Hantana. Installed 75mm perforated sub-surface drainage pipes with geotextile filter layers and weep holes at 1.5m staggered intervals to handle northeast monsoon runoff safely.',
        mediaUrls: [
          'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=800&auto=format&fit=crop&q=80',
        ],
      });
      await PostService.addComment(p4.id, malini.id, {
        content:
          'Excellent work Eng. Anura! What was the approximate cost per linear meter for the RC cantilever section compared to random rubble masonry?',
      });
      await PostService.addComment(p4.id, anura.id, {
        content:
          'Thank you Malini! Random rubble masonry (RRM) is economical up to 2.4m height (~Rs. 68,000/m), whereas heights above 3.0m on steep cuts require an engineered RC cantilever wall (~Rs. 145,000/m) per NBRO stability guidelines.',
      });
      await PostService.toggleLike(p4.id, client.id, ReactionType.LOVE);
      await PostService.toggleLike(p4.id, kamal.id, ReactionType.SOLID);
    }

    if (!existingTitles.has('2026 Sri Lanka Residential Construction Cost Breakdown per Sq.Ft (BOQ Guide)')) {
      const p5 = await PostService.createPost(tharindu.id, {
        postType: PostType.PROFESSIONAL_ADVICE,
        category: 'Costing & BOQ',
        title: '2026 Sri Lanka Residential Construction Cost Breakdown per Sq.Ft (BOQ Guide)',
        content:
          'Updated benchmark rates for standard two-storey residential construction in Western & Central Provinces:\n• Structural Shell (Substructure + RC Frame + Roof): Rs. 11,500 – 13,500 / sq.ft\n• Standard Turnkey Finishing (SLS Tiles, Alumex Windows, ACL Wiring): Rs. 21,000 – 25,500 / sq.ft\n• Always maintain a 10% contingency allocation and insist on an itemized BOQ before signing lump-sum contractor agreements.',
      });
      await PostService.addComment(p5.id, client.id, {
        content:
          'Very helpful breakdown Eng. Tharindu! Does the turnkey rate include boundary walls and rooftop waterproofing?',
      });
      await PostService.addComment(p5.id, tharindu.id, {
        content:
          'Boundary walls and external paving are usually measured separately under External Works in the BOQ, while bathroom and balcony brush-applied cementitious waterproofing is included in the standard turnkey rate.',
      });
      await PostService.toggleLike(p5.id, client.id, ReactionType.INSIGHT);
      await PostService.toggleLike(p5.id, malini.id, ReactionType.LIKE);
    }

    if (!existingTitles.has('5kW Hybrid Rooftop Solar PV + CEB Net Plus Installation Checklist for New Homes')) {
      const p6 = await PostService.createPost(nimal.id, {
        postType: PostType.PROJECT_UPDATE,
        category: 'Electrical & Renewable',
        title: '5kW Hybrid Rooftop Solar PV + CEB Net Plus Installation Checklist for New Homes',
        content:
          'Completed commissioning of a 5kW hybrid solar PV system with 10kWh LiFePO4 battery backup in Negombo. Pro tip for homeowners currently at the slab stage: Ask your MEP engineer to pre-install a dedicated 32mm heavy-duty uPVC conduit from the roof parapet directly to the main distribution board (DB) before plastering!',
        mediaUrls: [
          'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80',
        ],
      });
      await PostService.toggleLike(p6.id, oshadi.id, ReactionType.LOVE);
    }

    if (!existingTitles.has('What is the best waterproofing system for an exposed concrete flat roof in Kandy?')) {
      const q3 = await PostService.createPost(malini.id, {
        postType: PostType.QUESTION,
        category: 'Waterproofing & Finishes',
        title: 'What is the best waterproofing system for an exposed concrete flat roof in Kandy?',
        content:
          'Our new house design in Kundasale has a 650 sq.ft exposed concrete roof terrace. Given heavy monsoon rainfall and high daytime UV thermal expansion, should we use torch-on APP bitumen membrane or polyurethane liquid membrane with a protective screed?',
      });
      const c3 = await PostService.addComment(q3.id, oshadi.id, {
        content:
          'For an exposed trafficable roof terrace in Kandy, apply a two-component elastomeric polyurethane or crystalline cementitious waterproofing coat over the structural slab, followed by a geotextile separation layer and a 1:8 slope-to-fall protective screed with 10mm expansion joints every 3m filled with PU sealant.',
      });
      await PostService.toggleHelpfulComment(c3.id, malini.id);
      await PostService.toggleLike(q3.id, oshadi.id, ReactionType.INSIGHT);
    }

    if (!existingTitles.has('First-Floor Slab Casting Completed at Our Peradeniya Two-Storey Residence!')) {
      const p7 = await PostService.createPost(client.id, {
        postType: PostType.PROJECT_UPDATE,
        category: 'Residential',
        title: 'First-Floor Slab Casting Completed at Our Peradeniya Two-Storey Residence!',
        content:
          'Milestone update from our Kandy home build! After Eng. Anura Wickramasinghe and Eng. Kamal Silva verified the beam stirrup spacing and 40mm concrete cover blocks, we poured 28 cubic meters of Grade 30 ready-mix concrete today. Ponding curing starts tomorrow morning!',
        mediaUrls: [
          'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&auto=format&fit=crop&q=80',
        ],
      });
      await PostService.addComment(p7.id, kamal.id, {
        content:
          'Congratulations Dilshan! Remember to keep the slab ponded continuously for 14 days before stripping the soffit props.',
      });
      await PostService.toggleLike(p7.id, kamal.id, ReactionType.LOVE);
      await PostService.toggleLike(p7.id, anura.id, ReactionType.SOLID);
    }

    if (!existingTitles.has('Why CSEB Interlocking Earth Blocks Cut Indoor Temperatures by 4°C in Sri Lanka')) {
      const p8 = await PostService.createPost(oshadi.id, {
        postType: PostType.PROFESSIONAL_ADVICE,
        category: 'Sustainable Construction',
        title: 'Why CSEB Interlocking Earth Blocks Cut Indoor Temperatures by 4°C in Sri Lanka',
        content:
          'Compressed Stabilized Earth Blocks (CSEB) manufactured with 6% cement stabilization achieve > 3.5 N/mm² wet compressive strength under SLS 1382 while eliminating external wall plastering costs by 60% and reducing indoor thermal heat gain by up to 4°C in dry-zone districts like Kurunegala and Anuradhapura.',
        mediaUrls: [
          'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80',
        ],
      });
      await PostService.addComment(p8.id, malini.id, {
        content:
          'We used CSEB blocks on our Kundasale villa per Eng. Oshadi’s design and the rooms stay remarkably cool even at midday!',
      });
      await PostService.toggleLike(p8.id, malini.id, ReactionType.LOVE);
      await PostService.toggleLike(p8.id, tharindu.id, ReactionType.INSIGHT);
    }

    console.log('[Seed] Verified community posts, Q&A discussions, comments, and likes in database.');
  } catch (err) {
    console.warn('[Seed] Note on community post seeding:', err);
  }

  // 12. Seed Construction Projects & Engineer Signed-Off Milestones in SQL Database
  try {
    const clientProjects = await ProjectService.listUserProjects(client.id);
    if (clientProjects.length === 0) {
      // Project 1: Perera Two-Storey Residence, Kandy
      const proj1 = await ProjectService.createProject(client.id, {
        title: 'Perera Two-Storey Residence, Kandy',
        description:
          'Architecturally designed two-storey residential villa situated on a sloping hillside block in Peradeniya with NBRO certified retaining walls.',
        location: 'No. 42, Hantana View Road, Peradeniya',
        district: 'Kandy',
        stage: ProjectStage.STRUCTURAL_WORK,
        estimatedBudget: 26000000,
        assignedEngineerId: anura.engineerProfile?.id || anura.id,
        startDate: '2026-02-15',
        targetCompletionDate: '2027-03-30',
      });

      await ProjectService.updateProject(client.id, proj1.id, {
        actualSpent: 11200000,
      });

      const proj1Details = await ProjectService.getProjectById(client.id, proj1.id);
      if (proj1Details?.milestones) {
        for (let i = 0; i < 5; i++) {
          const m = proj1Details.milestones[i];
          if (m) {
            await ProjectService.signOffMilestone(anura.id, proj1.id, m.id, {
              notes: 'Inspected on-site and verified compliant with NBRO slope stability codes and CIDA SP/201 standards.',
            });
          }
        }
      }

      // Project 2: Dehiwala Coastal First-Floor Extension
      const proj2 = await ProjectService.createProject(client.id, {
        title: 'Dehiwala Coastal Residence Slab & Extension',
        description:
          'First-floor reinforced concrete slab extension and rooftop solar integration in Dehiwala.',
        location: 'No. 18, Station Road, Dehiwala',
        district: 'Colombo',
        stage: ProjectStage.FOUNDATION,
        estimatedBudget: 14500000,
        assignedEngineerId: kamal.engineerProfile?.id || kamal.id,
        startDate: '2026-06-01',
        targetCompletionDate: '2027-01-15',
      });

      await ProjectService.updateProject(client.id, proj2.id, {
        actualSpent: 5400000,
      });

      const proj2Details = await ProjectService.getProjectById(client.id, proj2.id);
      if (proj2Details?.milestones) {
        for (let i = 0; i < 4; i++) {
          const m = proj2Details.milestones[i];
          if (m) {
            await ProjectService.signOffMilestone(kamal.id, proj2.id, m.id, {
              notes: 'Verified column footing reinforcement and 50mm coastal concrete cover blocks per SLS 1253.',
            });
          }
        }
      }
      console.log('[Seed] Created Dilshan Perera construction projects & signed-off milestones in database.');
    }

    const maliniProjects = await ProjectService.listUserProjects(malini.id);
    if (maliniProjects.length === 0) {
      const proj3 = await ProjectService.createProject(malini.id, {
        title: 'Kundasale Eco Courtyard Villa',
        description:
          'Sustainable two-storey courtyard house utilizing CSEB earth blocks, passive ventilation, and a 5kW hybrid solar roof.',
        location: 'No. 105, Mahaweli Uyana, Kundasale',
        district: 'Kandy',
        stage: ProjectStage.ROOFING,
        estimatedBudget: 22000000,
        assignedEngineerId: oshadi.engineerProfile?.id || oshadi.id,
        startDate: '2025-11-10',
        targetCompletionDate: '2026-12-20',
      });

      await ProjectService.updateProject(malini.id, proj3.id, {
        actualSpent: 15800000,
      });

      const proj3Details = await ProjectService.getProjectById(malini.id, proj3.id);
      if (proj3Details?.milestones) {
        for (let i = 0; i < 6; i++) {
          const m = proj3Details.milestones[i];
          if (m) {
            await ProjectService.signOffMilestone(oshadi.id, proj3.id, m.id, {
              notes: 'Structural frame, CSEB load-bearing walls, and first-floor slab signed off per GBCSL & CIDA standards.',
            });
          }
        }
      }
      console.log('[Seed] Created Malini Rajapaksa eco-villa project & signed-off milestones in database.');
    }
  } catch (err) {
    console.warn('[Seed] Note on project seeding:', err);
  }

  // 13. Seed Consultations, In-App Messages & Verified Reviews (Idempotent)
  try {
    const existingConsultations = await EngineerService.listUserConsultations(client.id);
    if (existingConsultations.length === 0 && kamal.engineerProfile && anura.engineerProfile && tharindu.engineerProfile) {
      // Consultation 1: Kamal Silva (Completed + Reviewed)
      const c1 = await EngineerService.requestConsultation(client.id, {
        engineerId: kamal.engineerProfile.id,
        consultationType: ConsultationType.ONSITE,
        scheduledAt: new Date(Date.now() + 2 * 86400000).toISOString(),
        problemDescription:
          'Structural inspection and load-bearing verification for first-floor slab extension in Dehiwala.',
      });
      await EngineerService.updateConsultationStatus(kamal.id, c1.id, ConsultationStatus.ACCEPTED);

      await EngineerService.addConsultationMessage(
        client.id,
        c1.id,
        'Hello Eng. Kamal, I have uploaded the foundation structural blueprints for your review.'
      );
      await EngineerService.addConsultationMessage(
        kamal.id,
        c1.id,
        'Thank you Dilshan. I have reviewed the drawings. The beam rebars match CIDA SP/201. We will inspect the formwork on-site Saturday.'
      );

      await EngineerService.addEngineerReview(
        client.id,
        kamal.engineerProfile.id,
        5,
        'Eng. Kamal conducted a thorough structural audit of our slab. His report provided clear SLS 1253 load calculations and saved us significant costs.',
        c1.id
      );

      // Consultation 2: Anura Wickramasinghe (Geotechnical)
      const c2 = await EngineerService.requestConsultation(client.id, {
        engineerId: anura.engineerProfile.id,
        consultationType: ConsultationType.VIDEO,
        scheduledAt: new Date(Date.now() + 4 * 86400000).toISOString(),
        problemDescription:
          'NBRO slope stability clearance review and retaining wall weep-hole spacing verification for Peradeniya hillside plot.',
      });
      await EngineerService.updateConsultationStatus(anura.id, c2.id, ConsultationStatus.ACCEPTED);
      await EngineerService.addEngineerReview(
        client.id,
        anura.engineerProfile.id,
        5,
        'Eng. Anura guided us through the entire NBRO clearance process in Kandy and designed a rock-solid stepped retaining wall.',
        c2.id
      );

      // Consultation 3: Tharindu Fernando (BOQ Review)
      const c3 = await EngineerService.requestConsultation(malini.id, {
        engineerId: tharindu.engineerProfile.id,
        consultationType: ConsultationType.TEXT,
        problemDescription:
          'Audit of contractor interim payment valuation #4 and rebar rate escalation calculation for Kundasale villa.',
      });
      await EngineerService.addEngineerReview(
        malini.id,
        tharindu.engineerProfile.id,
        5,
        'Eng. Tharindu spotted Rs. 850,000 in duplicate formwork measurements in our contractor bill. Worth every rupee!',
        c3.id
      );

      // Ensure realistic aggregate ratings remain set on EngineerProfiles
      await UserService.setEngineerVerificationAndRating(kamal.id, VerificationStatus.VERIFIED, 4.9, 28);
      await UserService.setEngineerVerificationAndRating(anura.id, VerificationStatus.VERIFIED, 5.0, 14);
      await UserService.setEngineerVerificationAndRating(nimal.id, VerificationStatus.VERIFIED, 4.8, 19);
      await UserService.setEngineerVerificationAndRating(tharindu.id, VerificationStatus.VERIFIED, 4.9, 22);
      await UserService.setEngineerVerificationAndRating(oshadi.id, VerificationStatus.VERIFIED, 4.9, 16);

      console.log('[Seed] Created consultations, in-app chat threads, and verified reviews in database.');
    }
  } catch (err) {
    console.warn('[Seed] Note on consultation seeding:', err);
  }

  // 14. Seed Direct Private Messages & User Connections (Idempotent)
  try {
    const { MessagingService } = await import('../services/messaging.service');
    const existingConvos = await MessagingService.getConversations(client.id);
    if (existingConvos.length === 0) {
      // Conversation 1: Dilshan <-> Eng. Kamal Silva
      await MessagingService.sendMessage(
        client.id,
        kamal.id,
        'Ayubowan Eng. Kamal, I am constructing a two-storey house in Dehiwala and need your advice on the slab beam reinforcement layout.',
        ['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&auto=format&fit=crop&q=80']
      );
      await MessagingService.sendMessage(
        kamal.id,
        client.id,
        'Ayubowan Dilshan! I have received your site photo. Are you using Grade 25 or Grade 30 concrete? Make sure the clear cover is at least 40mm for coastal proximity in Dehiwala.'
      );
      await MessagingService.sendMessage(
        client.id,
        kamal.id,
        'We are using ready-mix Grade 30. Here is the bar bending schedule for your review.',
        ['https://storage.buildlink.lk/docs/bar_bending_schedule_dehiwala.pdf']
      );

      // Conversation 2: Dilshan <-> Eng. Anura Wickramasinghe
      await MessagingService.sendMessage(
        client.id,
        anura.id,
        'Hello Eng. Anura, we are starting excavation on the Peradeniya hillside slope. Sending you the stepped retaining wall blueprint.'
      );
      await MessagingService.sendMessage(
        anura.id,
        client.id,
        'Hello Dilshan, great. I inspected the soil bearing test results. Please ensure weep holes are installed every 1.5 meters for adequate monsoon drainage.',
        ['https://images.unsplash.com/photo-1541888946425-d0fbb18615f3?w=800&auto=format&fit=crop&q=80']
      );

      // Conversation 3: Dilshan <-> Eng. Tharindu Fernando (QS)
      await MessagingService.sendMessage(
        client.id,
        tharindu.id,
        'Hi Eng. Tharindu, can you review the ready-mix concrete and Tor steel rates in our stage 3 BOQ?'
      );
      await MessagingService.sendMessage(
        tharindu.id,
        client.id,
        'Sure Dilshan! Send over the Excel sheet and I will cross-check against the latest CIDA construction material price indices.'
      );

      // Additional network connections
      await MessagingService.connectUser(client.id, nimal.id);
      await MessagingService.connectUser(client.id, oshadi.id);
      await MessagingService.connectUser(malini.id, oshadi.id);
      await MessagingService.connectUser(malini.id, anura.id);

      console.log('[Seed] Created direct message threads and connections in database.');
    }
  } catch (err) {
    console.warn('[Seed] Note on direct message seeding:', err);
  }

  console.log('[Seed] All database test accounts and fixtures are verified and ready.');
}

if (require.main === module) {
  import('./data-source').then(({ initializeDatabase }) => {
    initializeDatabase()
      .then(() => seedDatabase())
      .then(() => {
        console.log('[Seed] Seeding completed successfully.');
        process.exit(0);
      })
      .catch((err) => {
        console.error('[Seed] Seeding failed:', err);
        process.exit(1);
      });
  });
}
