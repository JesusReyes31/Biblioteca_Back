import multer from 'multer';

const storage = multer.memoryStorage(); // Almacena el archivo en memoria

export const upload = multer({ storage });