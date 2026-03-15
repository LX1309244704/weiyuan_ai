const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTENSIONS = {
  '.zip': 'application/zip',
  '.json': 'application/json',
  '.js': 'application/javascript',
  '.md': 'text/markdown'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function ensureSkillDir(skillId) {
  const skillDir = path.join(UPLOAD_DIR, 'skills', skillId);
  if (!fs.existsSync(skillDir)) {
    fs.mkdirSync(skillDir, { recursive: true });
  }
  return skillDir;
}

async function saveSkillPackage(skillId, file) {
  const skillDir = ensureSkillDir(skillId);
  
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXTENSIONS[ext]) {
    throw new Error(`不支持的文件类型: ${ext}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件大小超过限制 (最大 ${MAX_FILE_SIZE / 1024 / 1024}MB)`);
  }
  
  const filename = `package${ext}`;
  const filepath = path.join(skillDir, filename);
  
  fs.writeFileSync(filepath, file.buffer);
  
  return {
    filename,
    filepath,
    url: `/uploads/skills/${skillId}/${filename}`,
    size: file.size,
    mimetype: ALLOWED_EXTENSIONS[ext]
  };
}

async function deleteSkillPackage(skillId) {
  const skillDir = path.join(UPLOAD_DIR, 'skills', skillId);
  if (fs.existsSync(skillDir)) {
    fs.rmSync(skillDir, { recursive: true, force: true });
  }
}

function generateSignedUrl(skillId, filename, expiresIn = 300) {
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expires = Math.floor(Date.now() / 1000) + expiresIn;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${skillId}:${filename}:${expires}`)
    .digest('hex');
  
  const signedUrl = `/api/skills/${skillId}/download?token=${signature}&expires=${expires}`;
  
  return {
    url: signedUrl,
    expiresIn,
    expiresAt: new Date(expires * 1000).toISOString()
  };
}

function verifySignedUrl(skillId, filename, token, expires) {
  if (Date.now() / 1000 > expires) {
    return { valid: false, error: '链接已过期' };
  }
  
  const secret = process.env.JWT_SECRET || 'default_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${skillId}:${filename}:${expires}`)
    .digest('hex');
  
  if (token !== expectedSignature) {
    return { valid: false, error: '无效的签名' };
  }
  
  return { valid: true };
}

function getSkillPackagePath(skillId) {
  const skillDir = path.join(UPLOAD_DIR, 'skills', skillId);
  const packagePath = path.join(skillDir, 'package.zip');
  
  if (!fs.existsSync(packagePath)) {
    return null;
  }
  
  return packagePath;
}

async function saveIcon(skillId, file) {
  const skillDir = ensureSkillDir(skillId);
  
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedImages = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
  
  if (!allowedImages.includes(ext)) {
    throw new Error(`不支持的图片类型: ${ext}`);
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('图片大小不能超过 5MB');
  }
  
  const filename = `icon${ext}`;
  const filepath = path.join(skillDir, filename);
  
  fs.writeFileSync(filepath, file.buffer);
  
  return {
    filename,
    filepath,
    url: `/uploads/skills/${skillId}/${filename}`
  };
}

module.exports = {
  saveSkillPackage,
  deleteSkillPackage,
  generateSignedUrl,
  verifySignedUrl,
  getSkillPackagePath,
  saveIcon,
  UPLOAD_DIR
};