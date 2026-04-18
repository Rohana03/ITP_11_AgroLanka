
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination:(req,file,cb)=>cb(null,uploadDir),
  filename:(req,file,cb)=>{ const ext=path.extname(file.originalname); const name=file.originalname.replace(/\s+/g,'_').replace(ext,''); cb(null, `${name}_${Date.now()}${ext}`) }
});
export const upload = multer({ storage });
