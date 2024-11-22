import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

// Define una clave secreta (debe almacenarse en variables de entorno en producción)
const SECRET_KEY = process.env.JWT_SECRET|| "secreto.01";

interface CustomRequest extends Request {
  user?: string | JwtPayload;
}

const checkAuth = (req: CustomRequest, res: Response, next: NextFunction) => {
  // Obtener el token desde la cabecera Authorization
  const token = req.headers['authorization'];
  // console.log(req.headers,token)
  if (!token) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }
  try {
    // Verificar y desencriptar el token
    const decoded = jwt.verify(token, SECRET_KEY);
    req.body.user = decoded; // Almacena la información del usuario en la solicitud

    // Si el token es válido, sigue con la siguiente función middleware o ruta
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token no válido o expirado' });
  }
};

const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verificamos que el token se haya decodificado en el middleware anterior
    if (!req.body.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    // Extraemos el rol del usuario desde el token decodificado
    const Usuario = req.body.user as JwtPayload; 
    const Tipo_Usuario = Usuario.User.Tipo_Usuario;
    console.log(Tipo_Usuario)
    // Comprobamos si Tipo_Usuario está en los roles permitidos
    if (!roles.includes(Tipo_Usuario)) {
      return res.status(403).json({ message: 'Acceso denegado' });
    }
    // Si tiene el rol correcto, sigue con la siguiente función middleware o ruta
    next();
  };
};

export { checkAuth, checkRole };
