import "dotenv/config"
import express,{Request,Response}  from "express";
import cors from "cors";
import {router} from "./routes";
import './models';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { initScheduledJobs } from './utils/programadas.handle';
import { createServer } from "http";
import { Server } from "socket.io";
const PORT = process.env.PORT || 3001;
const app = express();
app.use(cors({
  origin: '*', // Cambia al origen correcto de tu frontend
  exposedHeaders: ['Authorization'] 
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({  limit:'10mb',extended: true })); 
app.use(router);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración de Socket.IO
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('joinRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`Usuario ${userId} unido a su sala`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

// Exporta io para usarlo en otros archivos
export { io };

// Iniciar tareas programadas
initScheduledJobs();

app.listen(PORT,()=>console.log(`Servidor escuchando en el puerto ${PORT}`))
