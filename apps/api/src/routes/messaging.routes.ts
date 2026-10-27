import { Router } from 'express';
import { MessagingController } from '../controllers/messaging.controller';
import { authenticateJwt } from '../middleware/auth.middleware';
import { uploadChatMedia } from '../middleware/upload.middleware';

const router = Router();

// Send direct message (free private chat like Messenger)
router.post('/', authenticateJwt, MessagingController.sendMessage);

// Upload chat media attachment (Images, Videos, Blueprints, Documents, Audio)
router.post(
  '/upload',
  authenticateJwt,
  uploadChatMedia.single('attachment'),
  MessagingController.uploadAttachment
);

// Get conversations inbox list
router.get('/conversations', authenticateJwt, MessagingController.getConversations);

// Get message thread with a specific user or engineer
router.get('/thread/:otherUserId', authenticateJwt, MessagingController.getThread);

// Connect / Add engineer (Facebook-style friend connection)
router.post('/connect/:targetUserId', authenticateJwt, MessagingController.connectUser);

// List user's connected engineers / contacts
router.get('/connections', authenticateJwt, MessagingController.listConnections);

export const messagingRoutes = router;
