import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { env } from '../config';

const uploadDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH, 'verification');

// Ensure destination directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const allowedMimeTypes = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const uploadVerificationDocs = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Only PDF, JPG, PNG, and WEBP files are accepted.'));
    }
  },
});

// Chat Media Uploads (Images, Videos, Blueprints, Documents, Audio)
const chatUploadDir = path.resolve(process.cwd(), env.STORAGE_LOCAL_PATH, 'chat');
if (!fs.existsSync(chatUploadDir)) {
  fs.mkdirSync(chatUploadDir, { recursive: true });
}

const chatStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, chatUploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `chat-${Date.now()}-${randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

export const uploadChatMedia = multer({
  storage: chatStorage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB for videos & large blueprints
  },
  fileFilter: (_req, file, cb) => {
    // Permit common image, video, audio, and document formats
    const allowed = [
      'image/',
      'video/',
      'audio/',
      'application/pdf',
      'application/zip',
      'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument',
      'text/plain',
    ];
    const isAllowed = allowed.some((prefix) => file.mimetype.startsWith(prefix));
    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE: Unsupported media attachment format.'));
    }
  },
});

