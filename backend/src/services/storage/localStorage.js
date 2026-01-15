/**
 * Local File Storage Provider
 */
const fs = require('fs').promises;
const path = require('path');

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '../../../uploads');
const BASE_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Ensure directory exists
 */
async function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Save file to local storage
 */
async function save(filePath, buffer) {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  await ensureDir(fullPath);
  await fs.writeFile(fullPath, buffer);
  return fullPath;
}

/**
 * Delete file from local storage
 */
async function deleteFile(filePath) {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.unlink(fullPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

/**
 * Get public URL for file
 */
function getUrl(filePath) {
  return `${BASE_URL}/uploads/${filePath}`;
}

/**
 * Check if file exists
 */
async function exists(filePath) {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  try {
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file buffer
 */
async function get(filePath) {
  const fullPath = path.join(UPLOAD_DIR, filePath);
  return fs.readFile(fullPath);
}

module.exports = {
  save,
  delete: deleteFile,
  getUrl,
  exists,
  get
};
