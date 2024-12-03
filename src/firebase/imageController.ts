import { Request, Response } from 'express';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import dotenv from 'dotenv';
import sharp from 'sharp';
import { bucket } from './firebaseAdmin';

dotenv.config();

// const algorithm = 'aes-256-cbc'; // Algoritmo de encriptación
// const key = Buffer.from(process.env.SECRET_IMGS!.slice(0, 32), 'utf-8'); // Clave de 32 bytes

// const encrypt = (text: string) => {
//   const iv = randomBytes(16); // Vector de inicialización
//   const cipher = createCipheriv(algorithm, key, iv);
//   let encrypted = cipher.update(text, 'utf-8', 'hex');
//   encrypted += cipher.final('hex');
//   return { iv: iv.toString('hex'), encryptedData: encrypted };
// };
// const decrypt = (encryptedData: string) => {
//   const { iv, encryptedData: encryptedBuffer } = JSON.parse(encryptedData);

//   const ivBuffer = Buffer.from(iv, 'hex'); // Convierte el IV a Buffer
//   const encryptedTextBuffer = Buffer.from(encryptedBuffer, 'hex'); // Convierte el texto cifrado a Buffer

//   const decipher = createDecipheriv(algorithm, key, ivBuffer);
//   let decrypted = decipher.update(encryptedTextBuffer.toString('hex'), 'hex', 'utf-8'); // Cambiado
//   decrypted += decipher.final('utf-8');

//   return decrypted; // Retorna el texto desencriptado
// };

const uploadImage = async (req: Request, res: Response) => {
  if (!req.body.Imagen) {
    console.error('No image uploaded');
    return { success: false, message: 'No image uploaded' };
  }

  const base64Data = req.body.Imagen.replace(/^data:image\/\w+;base64,/, "");
  const imageBuffer = Buffer.from(base64Data, 'base64');
  const mimetype = req.body.Imagen.split(';')[0].split('/')[1];
  let processedBuffer = imageBuffer;

  if (mimetype !== 'jpeg') {
    processedBuffer = await sharp(imageBuffer).jpeg({ quality: 80 }).toBuffer();
  }

  try {
    let fileName = req.body.Genero
      ? `Libros/${req.body.Genero}/${req.body.Titulo}`
      : `Perfil/${req.body.Nombre_Usuario}`;

    const file = bucket.file(fileName);
    await file.save(processedBuffer, { metadata: { contentType: `image/${mimetype}` } });
    
    // Generar una URL de acceso temporal (firmada) para el archivo
    const url = await file.getSignedUrl({
      action: 'read',
      expires: '03-17-2030' // Ajusta la fecha de expiración según lo necesites
    });

    return { success: true, message: "éxito", url: url[0] }; 
  } catch (error) {
    console.error('Upload failed', error);
    return { success: false, message: 'Upload failed' };
  }
};


export { uploadImage };