import * as admin from 'firebase-admin';

// Asegúrate de tener el archivo JSON correcto
const serviceAccount = require('./sdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.STORAGE_BUCKET, // Cambia esto por tu bucket
});

const bucket = admin.storage().bucket();

export { admin, bucket };
