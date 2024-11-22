import {Auth} from "../interfaces/auth.interface";
import {user} from "../models/users.model";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { generateToken } from "../utils/jwt.handle";
const { Op } = require('sequelize');
const registerNewUser = async(body: user)=>{
    const checkCorreo = await user.findOne({ 
        where:{
            [Op.or]: [
                {Correo: body.Correo},
                {Nombre_Usuario: body.Nombre_Usuario},
                {CURP:body.CURP}
            ]
        }
    })
    if(checkCorreo) return "Este Usuario ya esta registrado";
    
    const passHash = await encrypt(body.Contra);
    const registerNewUser = await user.create({ 
        Nombre_completo:body.Nombre_completo,
        Correo: body.Correo,
        Contra:passHash, 
        CURP:body.CURP,
        Nombre_Usuario:body.Nombre_Usuario,
        Tipo_Usuario:body.Tipo_Usuario,
        Fecha_Registro: new Date()
    });
    if(registerNewUser){
        return {message:"Usuario registrado con éxito",datos:body};
    }
    return {message:"No se pudo registrar al usuario, intentelo de nuevo"};;

};
const loginUser = async(body: Auth)=>{
    const checkIs = await user.findOne({ 
        where: {
            [Op.or]: [
                { Correo: body.Correo },
                { Nombre_Usuario: body.Correo } // Aquí usamos body.Correo para ambos
            ]
        }
    });
    if(!checkIs) return "No se encontro el usuario";
    const passwordHash = checkIs.Contra
    const isCorrect = await verified(body.Contra, passwordHash);

    if(!isCorrect) return "Password no coincide";
    const token = generateToken(checkIs);    
    return {Token:token,Datos:checkIs};
}
export{registerNewUser, loginUser}