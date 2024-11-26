import "dotenv/config"
import express,{Request,Response}  from "express";
import cors from "cors";
import {router} from "./routes";
import './models';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initScheduledJobs } from './utils/programadas.handle';
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors({
  origin: '*', // Cambia al origen correcto de tu frontend
  exposedHeaders: ['Authorization'] 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({  limit:'10mb',extended: true })); 
app.use(router);
// Configuración de multer para guardar imágenes en la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });
// Endpoint para subir imágenes
app.post('/upload', upload.single('image'), (req: Request, res: Response) => {
  const imageUrl = `/uploads/${req.file?.filename}`;
  res.json({ imageUrl }); // Devolvemos la ruta de la imagen para almacenarla en la BD o utilizarla en el frontend
});
app.get('/images', (req: Request, res: Response) => {
    console.log("HOLAAAAAAAAAAA")
    console.log(__dirname);
    const directoryPath = path.join(__dirname, 'uploads');
    
    // Lee los archivos en la carpeta 'uploads'
    fs.readdir(directoryPath, (err, files) => {
      if (err) {
        return res.status(500).json({
          message: 'No se pudieron listar los archivos.',
          error: err,
        });
      }
  
      // Devuelve la lista de URLs de las imágenes
      const imageUrls = files.map((file) => `http://localhost:9500/uploads/${file}`);
      console.log(imageUrls)
      res.json({ images: imageUrls });
    });
  });
// Middleware para servir imágenes estáticamente

// Iniciar tareas programadas
initScheduledJobs();

app.listen(PORT,()=>console.log(`Servidor escuchando en el puerto ${PORT}`))
