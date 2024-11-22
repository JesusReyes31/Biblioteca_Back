import {Request, Response, Express } from "express"
import {registerNewUser, loginUser} from "../services/auth";
import jwt from 'jsonwebtoken';

const registerCtrl = async (req:Request, res:Response) =>{
    const responseUser = await registerNewUser(req.body);
    res.send(responseUser);
}

const loginCtrl = async (req:Request, res:Response) =>{
    const responseUser = await loginUser(req.body);
    if (typeof responseUser === 'string') {
        return res.status(403).send(responseUser);
    }
    res
    /*.cookie('authToken', responseUser.Token, {
        httpOnly: true, // Solo accesible desde el servidor, no desde JavaScript
        secure: true,   // Solo se envía a través de HTTPS
        sameSite: 'strict', // Restringe el envío de cookies a solicitudes del mismo origen
        maxAge: 3600000   // Tiempo de vida de la cookie (1 hora)
    })*/.header('authorization', responseUser.Token)
    .json({ Datos:{ID:responseUser.Datos.ID,Nombre_usuario:responseUser.Datos.Nombre_Usuario,Correo:responseUser.Datos.Correo,Tipo_usuario:responseUser.Datos.Tipo_Usuario,Imagen:responseUser.Datos.Imagen} });
    // res.json({jwt:responseUser.Token,Datos:{Nombre_usuario:responseUser.Datos.Nombre_usuario,Correo:responseUser.Datos.Correo,Tipo_usuario:responseUser.Datos.Tipo_Usuario}});
}

const verifyTokenCtrl = (req: Request, res: Response) => {
    // Obtener el token desde la cabecera Authorization
    const { Token } = req.params; 
    if (!Token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }

    try {
        // Verificar el token
        const decoded = jwt.verify(Token, process.env.JWT_SECRET || 'secreto.01') as jwt.JwtPayload;

        // Extraer el tipo de usuario desde el token decodificado
        const Tipo_Usuario = decoded.User.Tipo_Usuario;
        if (!Tipo_Usuario) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        // Retornar el tipo de usuario y otros datos relevantes
        res.json({ Tipo_Usuario });
    } catch (error) {
        return res.status(403).json({ message: 'Token no válido o expirado' });
    }
};
export{loginCtrl, registerCtrl,verifyTokenCtrl}