import swaggerUi from 'swagger-ui-express';
import { Router } from 'express';

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'BuildLink API Specification',
    version: '1.0.0',
    description:
      'Backend REST API for BuildLink: Construction Community, Verified Engineer Directory, and Consultation Platform.',
    contact: {
      name: 'BuildLink Engineering Team',
    },
  },
  servers: [
    {
      url: '/api/v1',
      description: 'Current Environment API Base',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide your JWT bearer token in the Authorization header.',
      },
    },
    schemas: {
      UserDto: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ENGINEER', 'ADMIN'] },
          status: { type: 'string', enum: ['ACTIVE', 'PENDING', 'SUSPENDED', 'DEACTIVATED'] },
          emailVerified: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: { type: 'object' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: { type: 'object' },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'System and database health check',
        tags: ['System'],
        description:
          'Returns real-time status of the API server and Microsoft SQL Server 2025 Express connection.',
        responses: {
          '200': {
            description: 'Health status response',
          },
        },
      },
    },
    '/auth/register': {
      post: {
        summary: 'Register a new homeowner or engineer',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'firstName', 'lastName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  role: { type: 'string', enum: ['USER', 'ENGINEER'] },
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  engineerTitle: { type: 'string' },
                  specialization: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Registration successful' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate and receive JWT token',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Authentication successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current authenticated user',
        tags: ['Authentication'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/auth/logout': {
      post: {
        summary: 'Sign out of active session',
        tags: ['Authentication'],
        responses: {
          '200': { description: 'Successfully signed out' },
        },
      },
    },
    '/users/profile': {
      get: {
        summary: 'Get profile of current user',
        tags: ['Profile'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Current profile' },
          '401': { description: 'Unauthorized' },
        },
      },
      put: {
        summary: 'Update profile information',
        tags: ['Profile'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  firstName: { type: 'string' },
                  lastName: { type: 'string' },
                  displayName: { type: 'string' },
                  avatarUrl: { type: 'string' },
                  bio: { type: 'string' },
                  city: { type: 'string' },
                  district: { type: 'string' },
                  phoneNumber: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/users/engineer-profile': {
      put: {
        summary: 'Update professional engineer details (Engineers only)',
        tags: ['Profile'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  specializations: { type: 'array', items: { type: 'string' } },
                  yearsOfExperience: { type: 'number' },
                  registrationBody: { type: 'string' },
                  registrationNumber: { type: 'string' },
                  consultationFee: { type: 'number' },
                  availableForConsultation: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Engineer profile updated' },
          '403': { description: 'Forbidden - not an engineer' },
        },
      },
    },
    '/verification/upload': {
      post: {
        summary: 'Upload supporting credential file (PDF or Image, max 10MB)',
        tags: ['Verification'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  document: { type: 'string', format: 'binary' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Document uploaded successfully' },
          '400': { description: 'Invalid file type or no file uploaded' },
        },
      },
    },
    '/verification/apply': {
      post: {
        summary: 'Submit engineer verification application with credential documents',
        tags: ['Verification'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['registrationBody', 'registrationNumber', 'documents'],
                properties: {
                  registrationBody: { type: 'string', example: 'IESL' },
                  registrationNumber: { type: 'string', example: 'IESL-M-8891' },
                  notes: { type: 'string' },
                  documents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        documentType: { type: 'string', enum: ['DEGREE_CERTIFICATE', 'IESL_MEMBERSHIP_CARD', 'PRACTICING_LICENSE', 'GOVERNMENT_ID', 'OTHER'] },
                        fileUrl: { type: 'string' },
                        originalFilename: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Verification application submitted' },
          '403': { description: 'Only engineers can apply' },
        },
      },
    },
    '/verification/status': {
      get: {
        summary: 'Get current engineer verification application and audit notes',
        tags: ['Verification'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Application status and audit details' },
        },
      },
    },
    '/verification/admin/applications': {
      get: {
        summary: 'List all verification applications for review (Admin only)',
        tags: ['Verification - Admin'],
        security: [{ BearerAuth: [] }],
        parameters: [
          {
            name: 'status',
            in: 'query',
            schema: { type: 'string', enum: ['PENDING_REVIEW', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'] },
          },
        ],
        responses: {
          '200': { description: 'List of applications' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/verification/admin/applications/{id}/review': {
      put: {
        summary: 'Review, approve, or reject verification application (Admin only)',
        tags: ['Verification - Admin'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status', 'reviewerNotes'],
                properties: {
                  status: { type: 'string', enum: ['VERIFIED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED', 'UNDER_REVIEW'] },
                  reviewerNotes: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Application reviewed and engineer profile updated' },
          '403': { description: 'Admin access required' },
        },
      },
    },
    '/verification/admin/audit-logs': {
      get: {
        summary: 'Get system audit trail and compliance history (Admin only)',
        tags: ['Verification - Admin'],
        security: [{ BearerAuth: [] }],
        responses: {
          '200': { description: 'Audit trail history' },
          '403': { description: 'Admin access required' },
        },
      },
    },
  },
};

const router = Router();
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export const docsRoutes = router;
