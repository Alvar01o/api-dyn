import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

const schemaPath = process.env.SCHEMA_TMP_PATH || '/tmp/schemas';
fs.mkdirSync(schemaPath, { recursive: true });

const maxSizeRaw = Number(process.env.MAX_SCHEMA_FILE_SIZE ?? 0);
const maxSize = maxSizeRaw > 0 ? maxSizeRaw : undefined;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, schemaPath),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.sql';
    cb(null, `${randomUUID()}${ext}`);
  },
});

function isSqlUpload(file: Express.Multer.File) {
  const extOk = path.extname(file.originalname).toLowerCase() === '.sql';
  const mime = (file.mimetype || '').toLowerCase();
  // Muchos clientes suben SQL como text/plain; aceptamos ambos
  const mimeOk = mime.includes('text') || mime.includes('sql') || mime === 'application/octet-stream';
  return extOk && mimeOk;
}

export const uploadSchema = multer({
  storage,
  limits: maxSize ? { fileSize: maxSize } : undefined,
  fileFilter: (_req, file, cb) => {
    if (!isSqlUpload(file)) return cb(new Error('Only .sql files are allowed'));
    cb(null, true);
  },
});