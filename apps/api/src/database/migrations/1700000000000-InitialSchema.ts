import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Users Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
      BEGIN
        CREATE TABLE users (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          email NVARCHAR(255) NOT NULL UNIQUE,
          passwordHash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'USER',
          status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
          emailVerified BIT NOT NULL DEFAULT 0,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE UNIQUE INDEX idx_users_email ON users(email);
      END
    `);

    // 2. User Profiles Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'user_profiles')
      BEGIN
        CREATE TABLE user_profiles (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          userId UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          firstName NVARCHAR(100) NOT NULL,
          lastName NVARCHAR(100) NOT NULL,
          displayName NVARCHAR(200) NULL,
          avatarUrl NVARCHAR(500) NULL,
          bio NVARCHAR(1000) NULL,
          city NVARCHAR(100) NULL,
          district NVARCHAR(100) NULL,
          phoneNumber NVARCHAR(30) NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_user_profiles_user ON user_profiles(userId);
      END
    `);

    // 3. Engineer Profiles Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'engineer_profiles')
      BEGIN
        CREATE TABLE engineer_profiles (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          userId UNIQUEIDENTIFIER NOT NULL UNIQUE FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          title NVARCHAR(150) NOT NULL,
          specializations NVARCHAR(MAX) NOT NULL,
          yearsOfExperience INT NOT NULL DEFAULT 0,
          registrationBody NVARCHAR(150) NULL,
          registrationNumber NVARCHAR(100) NULL,
          verificationStatus VARCHAR(30) NOT NULL DEFAULT 'NOT_SUBMITTED',
          consultationFee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
          availableForConsultation BIT NOT NULL DEFAULT 1,
          ratingAverage DECIMAL(3, 2) NOT NULL DEFAULT 0.00,
          ratingCount INT NOT NULL DEFAULT 0,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_engineer_profiles_status ON engineer_profiles(verificationStatus);
      END
    `);

    // 4. Verification Applications Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'verification_applications')
      BEGIN
        CREATE TABLE verification_applications (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          engineerProfileId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES engineer_profiles(id) ON DELETE CASCADE,
          status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
          reviewerNotes NVARCHAR(MAX) NULL,
          reviewedBy UNIQUEIDENTIFIER NULL,
          reviewedAt DATETIME2 NULL,
          submittedDocumentsJson NVARCHAR(MAX) NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_verif_app_engineer ON verification_applications(engineerProfileId);
      END
    `);

    // 5. Posts Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'posts')
      BEGIN
        CREATE TABLE posts (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          authorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
          postType VARCHAR(30) NOT NULL DEFAULT 'GENERAL',
          category NVARCHAR(100) NOT NULL,
          title NVARCHAR(255) NOT NULL,
          content NVARCHAR(MAX) NOT NULL,
          mediaUrlsJson NVARCHAR(MAX) NULL,
          questionStatus VARCHAR(30) NULL DEFAULT 'OPEN',
          likesCount INT NOT NULL DEFAULT 0,
          commentsCount INT NOT NULL DEFAULT 0,
          isResolved BIT NOT NULL DEFAULT 0,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_posts_category ON posts(category);
        CREATE INDEX idx_posts_type ON posts(postType);
        CREATE INDEX idx_posts_author ON posts(authorId);
      END
    `);

    // 6. Comments Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'comments')
      BEGIN
        CREATE TABLE comments (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          postId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES posts(id) ON DELETE CASCADE,
          authorId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id),
          parentCommentId UNIQUEIDENTIFIER NULL,
          content NVARCHAR(MAX) NOT NULL,
          isProfessionalAnswer BIT NOT NULL DEFAULT 0,
          isMarkedHelpful BIT NOT NULL DEFAULT 0,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_comments_post ON comments(postId);
      END
    `);

    // 7. Consultations Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'consultations')
      BEGIN
        CREATE TABLE consultations (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          clientId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES users(id),
          engineerId UNIQUEIDENTIFIER NOT NULL FOREIGN KEY REFERENCES engineer_profiles(id),
          consultationType VARCHAR(20) NOT NULL DEFAULT 'TEXT',
          status VARCHAR(30) NOT NULL DEFAULT 'REQUESTED',
          scheduledAt DATETIMEOFFSET NULL,
          problemDescription NVARCHAR(MAX) NOT NULL,
          attachmentsJson NVARCHAR(MAX) NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE INDEX idx_consultations_client ON consultations(clientId);
        CREATE INDEX idx_consultations_engineer ON consultations(engineerId);
      END
    `);

    // 8. Knowledge Articles Table
    await queryRunner.query(`
      IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'knowledge_articles')
      BEGIN
        CREATE TABLE knowledge_articles (
          id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
          slug NVARCHAR(200) NOT NULL UNIQUE,
          title NVARCHAR(255) NOT NULL,
          category NVARCHAR(100) NOT NULL,
          summary NVARCHAR(500) NOT NULL,
          content NVARCHAR(MAX) NOT NULL,
          coverImageUrl NVARCHAR(500) NULL,
          authorName NVARCHAR(100) NOT NULL,
          isPublished BIT NOT NULL DEFAULT 1,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
        CREATE UNIQUE INDEX idx_articles_slug ON knowledge_articles(slug);
        CREATE INDEX idx_articles_category ON knowledge_articles(category);
      END
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS knowledge_articles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS consultations;`);
    await queryRunner.query(`DROP TABLE IF EXISTS comments;`);
    await queryRunner.query(`DROP TABLE IF EXISTS posts;`);
    await queryRunner.query(`DROP TABLE IF EXISTS verification_applications;`);
    await queryRunner.query(`DROP TABLE IF EXISTS engineer_profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS user_profiles;`);
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
