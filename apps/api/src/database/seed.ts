import { UserService } from '../services/user.service';
import { PostService } from '../services/post.service';
import { ProjectService } from '../services/project.service';
import { EngineerService } from '../services/engineer.service';
import { VerificationService } from '../services/verification.service';
import {
  UserRole,
  VerificationStatus,
  PostType,
  ConsultationType,
  ProjectStage,
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
    role: 'ENGINEER (Structural)',
    email: 'kamal.engineer@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Kamal Silva',
    description: 'Senior Chartered Structural Engineer (IESL Chartered, 15 Yrs Exp, Rating 4.9)',
  },
  {
    role: 'ENGINEER (Geotechnical / NBRO)',
    email: 'anura.geotech@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Anura Wickramasinghe',
    description: 'NBRO Accredited Geotechnical & Slope Stability Specialist (Kandy, Rating 5.0)',
  },
  {
    role: 'ENGINEER (MEP / Building Services)',
    email: 'nimal.mep@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Nimal Jayawardena',
    description: 'Chartered MEP & Solar PV Building Systems Engineer (Gampaha, Rating 4.8)',
  },
  {
    role: 'ENGINEER (Pending Review)',
    email: 'rohan.applicant@buildlink.lk',
    password: 'EngineerPassword123!',
    displayName: 'Eng. Rohan Dissanayake',
    description: 'Applicant with credentials pending admin audit on /admin/verification',
  },
  {
    role: 'HOMEOWNER / CLIENT',
    email: 'client@buildlink.lk',
    password: 'ClientPassword123!',
    displayName: 'Dilshan Perera',
    description: 'Homeowner with an active two-storey construction project and consultations',
  },
];

/**
 * Idempotent Seed Function for both Database & In-Memory Fallback Stores
 */
export async function seedDatabase(): Promise<void> {
  console.log('[Seed] Checking and seeding test fixtures...');

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

  // 2. Seed Verified Structural Engineer
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

    // Update verified engineer profile details
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

    // Mark as Verified in storage
    const memory = UserService.getMemoryStore();
    const record = memory.get(kamal.id);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
      record.engineerProfile.ratingAverage = 4.9;
      record.engineerProfile.ratingCount = 28;
    }
    console.log('[Seed] Created Verified Structural Engineer: kamal.engineer@buildlink.lk');
  }

  // 3. Seed Verified Geotechnical Engineer
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

    const memory = UserService.getMemoryStore();
    const record = memory.get(anura.id);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
      record.engineerProfile.ratingAverage = 5.0;
      record.engineerProfile.ratingCount = 14;
    }
    console.log('[Seed] Created Verified Geotechnical Engineer: anura.geotech@buildlink.lk');
  }

  // 4. Seed Verified MEP Engineer
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

    const memory = UserService.getMemoryStore();
    const record = memory.get(nimal.id);
    if (record && record.engineerProfile) {
      record.engineerProfile.verificationStatus = VerificationStatus.VERIFIED;
      record.engineerProfile.ratingAverage = 4.8;
      record.engineerProfile.ratingCount = 19;
    }
    console.log('[Seed] Created Verified MEP Engineer: nimal.mep@buildlink.lk');
  }

  // 5. Seed Engineer Applicant Pending Admin Audit
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

    // Submit verification application
    try {
      await VerificationService.applyForVerification(rohan.id, {
        registrationBody: 'Institution of Engineers Sri Lanka (IESL)',
        registrationNumber: 'IESL-AM-9812',
        specializations: ['Marine & Coastal Concrete', 'Saline Resistant Foundations'],
        yearsOfExperience: 7,
        documents: [
          {
            type: 'DEGREE_CERTIFICATE',
            fileName: 'BSc_Eng_University_of_Moratuwa.pdf',
            fileUrl: 'https://storage.buildlink.lk/docs/degrees/moratuwa_civil_rohan.pdf',
            fileSize: 2450000,
            mimeType: 'application/pdf',
          },
          {
            type: 'IESL_MEMBERSHIP_CARD',
            fileName: 'IESL_Associate_Member_Card.pdf',
            fileUrl: 'https://storage.buildlink.lk/docs/licenses/iesl_am_9812.pdf',
            fileSize: 1120000,
            mimeType: 'application/pdf',
          },
        ],
      });
      console.log('[Seed] Created Pending Applicant & Application: rohan.applicant@buildlink.lk');
    } catch {
      // ignore
    }
  }

  // 6. Seed Homeowner / Client
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
    console.log('[Seed] Created Client: client@buildlink.lk');
  }

  // 7. Seed Community Posts & Q&A Questions
  try {
    const existingPosts = await PostService.listPosts({});
    if (existingPosts.length === 0) {
      // Question 1: Slab cracks
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

      // Answer from Eng. Kamal Silva
      const c1 = await PostService.addComment(q1.id, kamal.id, {
        content:
          'These are characteristic plastic shrinkage cracks common in Sri Lanka when high ambient temperatures cause early surface moisture evaporation before concrete achieves tensile strength. If crack widths are under 0.2mm per SLS 1253, structural integrity is not compromised. Recommended remedial action: Clean surface with compressed air and seal with low-viscosity epoxy resin slurry to prevent moisture ingress to reinforcement.',
      });

      // Mark as accepted solution and vote helpful
      await PostService.resolveQuestion(q1.id, client.id, UserRole.USER, { acceptedCommentId: c1.id });
      await PostService.toggleHelpfulComment(c1.id, client.id);

      // Question 2: M-Sand vs Sea Sand
      const q2 = await PostService.createPost(client.id, {
        postType: PostType.QUESTION,
        category: 'Materials & Supplies',
        title: 'Off-shore sea sand vs M-Sand for masonry plastering in coastal Gampaha',
        content:
          'With natural river sand shortages in Gampaha, should we use offshore washed sea sand from Sri Lanka Land Development Corporation (SLLDC) or manufactured sand (M-sand) for exterior wall plastering within 2km of the Negombo coastline?',
      });

      // Answer from Eng. Nimal Jayawardena
      const c2 = await PostService.addComment(q2.id, nimal.id, {
        content:
          'For coastal zones within 2km of sea spray, offshore washed sea sand must strictly have a chloride ion test certificate confirming < 0.05% chloride content by mass of cement (SLS 1397). High-grade washed M-sand with controlled silt/fines below 5% is preferred for exterior rendering as it offers superior bond strength and minimizes efflorescence.',
      });
      await PostService.toggleHelpfulComment(c2.id, kamal.id);

      // Post 3: Professional Technical Advice
      await PostService.createPost(kamal.id, {
        postType: PostType.PROFESSIONAL_ADVICE,
        category: 'Building Regulations',
        title: 'CIDA SP/201 Mandatory Clear Cover Requirements for Coastal Sri Lanka',
        content:
          'A reminder to all contractors and builders: For residential structures within 5km of the sea, minimum concrete cover to main reinforcement must be at least 50mm (Grade 30 concrete) per CIDA SP/201. Never use site-broken bricks or timber as cover blocks — always use precast high-density concrete spacers tied to rebar with binding wire.',
      });

      console.log('[Seed] Created sample community posts & Q&A discussions');
    }
  } catch (err) {
    console.warn('[Seed] Note on community post seeding:', err);
  }

  // 8. Seed Construction Project
  try {
    const existingProjects = await ProjectService.listUserProjects(client.id);
    if (existingProjects.length === 0) {
      const proj = await ProjectService.createProject(client.id, {
        title: 'Perera Two-Storey Residence, Kandy',
        description:
          'Architecturally designed two-storey residential villa situated on a sloping hillside block in Peradeniya.',
        location: 'No. 42, Hantana View Road, Peradeniya',
        district: 'Kandy',
        stage: ProjectStage.STRUCTURAL_WORK,
        budget: 26000000,
        spent: 11200000,
        assignedEngineerId: anura.id,
      });

      // Sign off early stage milestones by Eng. Anura
      const milestones = await ProjectService.getProjectById(client.id, proj.id);
      if (milestones && milestones.milestones) {
        for (let i = 0; i < 4; i++) {
          const m = milestones.milestones[i];
          if (m) {
            await ProjectService.signOffMilestone(anura.id, proj.id, m.id, {
              notes: `Inspected and verified compliant with NBRO slope stability codes and CIDA standards on-site.`,
            });
          }
        }
      }
      console.log('[Seed] Created active construction project: Perera Two-Storey Residence, Kandy');
    }
  } catch (err) {
    console.warn('[Seed] Note on project seeding:', err);
  }

  // 9. Seed Consultations, In-App Messages & Reviews
  try {
    const kamalProfile = await UserService.findByEmail('kamal.engineer@buildlink.lk');
    if (kamalProfile?.engineerProfile) {
      // Consultation
      const consultation = await EngineerService.requestConsultation(client.id, {
        engineerId: kamalProfile.engineerProfile.id,
        consultationType: ConsultationType.ONSITE,
        problemDescription:
          'Structural inspection and load-bearing verification for first-floor slab extension in Colombo.',
      });

      // Consultation in-app messages
      await EngineerService.addConsultationMessage(
        client.id,
        consultation.id,
        'Hello Eng. Kamal, I have uploaded the foundation structural blueprints for your review.'
      );
      await EngineerService.addConsultationMessage(
        kamal.id,
        consultation.id,
        'Thank you Dilshan. I have reviewed the drawings. The beam rebars match CIDA SP/201. We will inspect the formwork on-site Saturday.'
      );

      // Verified Review
      await EngineerService.addEngineerReview(
        client.id,
        kamalProfile.engineerProfile.id,
        5,
        'Eng. Kamal conducted a thorough structural audit of our slab. His report provided clear SLS 1253 load calculations and saved us significant costs.',
        consultation.id
      );

      console.log('[Seed] Created consultation, in-app chat thread, and verified 5-star review');
    }
  } catch (err) {
    console.warn('[Seed] Note on consultation seeding:', err);
  }

  // 10. Seed Facebook Messenger-style Direct Private Messages & Attachments
  try {
    const { MessagingService } = await import('../services/messaging.service');

    // Conversation 1: Dilshan <-> Eng. Kamal Silva (Structural)
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
      'We are using ready-mix Grade 30. Here is the bar bending schedule and the site progress video for your review.',
      [
        'https://storage.buildlink.lk/docs/bar_bending_schedule_dehiwala.pdf',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      ]
    );

    // Conversation 2: Dilshan <-> Eng. Anura Wickramasinghe (Geotechnical / NBRO)
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

    console.log('[Seed] Created Facebook-style private chat threads with image, document, and video attachments');
  } catch (err) {
    console.warn('[Seed] Note on direct message seeding:', err);
  }

  console.log('[Seed] Test fixtures and demonstration data ready.');
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

