import request from 'supertest';
import { createApp } from '../app';
import { UserService } from '../services/user.service';
import { MessagingService } from '../services/messaging.service';
import { UserRole } from '@buildlink/shared';

const app = createApp();

describe('Facebook-Style Direct Messaging & Messenger', () => {
  let engineerToken: string;
  let engineerUserId: string;

  let homeownerToken: string;
  let homeownerUserId: string;

  beforeAll(async () => {
    UserService.clearMemoryStoreForTesting();
    MessagingService.clearMemoryForTesting();

    // 1. Register an Engineer
    const engRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'priyantha.structural@buildlink.lk',
        password: 'Password123!',
        role: UserRole.ENGINEER,
        firstName: 'Priyantha',
        lastName: 'Alwis',
        district: 'Colombo',
        engineerTitle: 'Chartered Structural Engineer',
      });
    expect(engRes.status).toBe(201);
    engineerToken = engRes.body.data.token;
    engineerUserId = engRes.body.data.user.id;

    // 2. Register a Homeowner / Client
    const homeRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'kasun.client@gmail.com',
        password: 'Password123!',
        role: UserRole.USER,
        firstName: 'Kasun',
        lastName: 'Silva',
        district: 'Colombo',
      });
    expect(homeRes.status).toBe(201);
    homeownerToken = homeRes.body.data.token;
    homeownerUserId = homeRes.body.data.user.id;
  });

  it('allows homeowner to send a private direct message with attachments to engineer', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${homeownerToken}`)
      .send({
        recipientId: engineerUserId,
        content: 'Hello Eng. Priyantha, please review our column reinforcement photo and foundation video.',
        attachments: [
          'https://images.unsplash.com/photo-1541888946425-d0fbb18615f3',
          'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.senderId).toBe(homeownerUserId);
    expect(res.body.data.recipientId).toBe(engineerUserId);
    expect(res.body.data.content).toContain('column reinforcement');
    expect(res.body.data.attachments).toHaveLength(2);
  });

  it('allows engineer to reply to the private thread', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        recipientId: homeownerUserId,
        content: 'Hello Kasun, the rebars are spaced properly at 150mm centres. You can proceed with casting.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.senderId).toBe(engineerUserId);
    expect(res.body.data.recipientId).toBe(homeownerUserId);
  });

  it('retrieves the chronological private chat thread', async () => {
    const res = await request(app)
      .get(`/api/v1/messages/thread/${engineerUserId}`)
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].content).toContain('column reinforcement');
    expect(res.body.data[1].content).toContain('proceed with casting');
  });

  it('lists conversations in Messenger inbox summary', async () => {
    const res = await request(app)
      .get('/api/v1/messages/conversations')
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].otherUserId).toBe(engineerUserId);
    expect(res.body.data[0].lastMessage).toContain('proceed with casting');
  });

  it('allows user to connect with engineer (Add Contact / Friend)', async () => {
    const res = await request(app)
      .post(`/api/v1/messages/connect/${engineerUserId}`)
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.connectedUserId).toBe(engineerUserId);
  });

  it('lists user connections', async () => {
    const res = await request(app)
      .get('/api/v1/messages/connections')
      .set('Authorization', `Bearer ${homeownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].connectedUserId).toBe(engineerUserId);
  });

  it('rejects message sent to self', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${homeownerToken}`)
      .send({
        recipientId: homeownerUserId,
        content: 'Self message test',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('BAD_REQUEST');
  });

  it('rejects empty message content', async () => {
    const res = await request(app)
      .post('/api/v1/messages')
      .set('Authorization', `Bearer ${homeownerToken}`)
      .send({
        recipientId: engineerUserId,
        content: '   ',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
