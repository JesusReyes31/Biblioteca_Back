import {Auth} from "../interfaces/auth.interface";
import {user} from "../models/users.model";
import { encrypt, verified } from "../utils/bcrypt.handle";
import { generateToken } from "../utils/jwt.handle";
import { ActivationToken } from "../models/activation_tokens.model";
import { sendActivationEmail } from "../utils/email.handle";
import { Personal } from "../models/personal.model";
import { Sucursales } from "../models/sucursales.model";
const { Op } = require('sequelize');
const registerNewUser = async(body: any)=>{
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
        Fecha_Registro: new Date(),
        Activo: false
    });
    if(registerNewUser){
        // console.log(body.Sucursal)
        // Array de tipos de usuario que requieren registro en Personal
        const tiposPersonal = ['Inventario', 'Prestamos', 'Admin Sucursal'];
        
        // Verificar si el tipo de usuario requiere registro en Personal
        if (tiposPersonal.includes(body.Tipo_Usuario)) {
            try {
                if(body.Tipo_Usuario === 'Admin Sucursal'){
                    const sucursal = await Sucursales.findOne({where:{ID:parseInt(body.ID_Sucursal)}});
                    sucursal?.update({ID_Usuario:registerNewUser.ID});
                }
                await Personal.create({
                    ID_Usuario: registerNewUser.ID,
                    ID_Sucursal: parseInt(body.user.User.ID_Sucursal)
                });
            } catch (error) {
                console.error('Error al crear registro de Personal:', error);
                // Opcionalmente, podrías eliminar el usuario creado si falla la creación del Personal
                await registerNewUser.destroy();
                return { message: "Error al registrar el personal, inténtelo de nuevo" };
            }
        }

        // Generar token de activación
        const activationToken = generateToken(registerNewUser);
        
        // Guardar token en la base de datos
        await ActivationToken.create({
            ID: registerNewUser.ID,
            ID_Usuario: registerNewUser.ID,
            Token: activationToken,
            Usado: false
        });

        // Enviar correo de activación
        await sendActivationEmail(body.Correo, activationToken);

        return {
            message: "Usuario registrado con éxito. Por favor, revise su correo para activar la cuenta.",
            datos: {Nombre_completo:body.Nombre_completo,Correo:body.Correo,Tipo_Usuario:body.Tipo_Usuario,Nombre_Usuario:body.Nombre_Usuario,CURP:body.CURP,ID:registerNewUser.ID,ID_Sucursal:body.user.User.ID_Sucursal}
        };
    }
    return {message:"No se pudo registrar al usuario, intentelo de nuevo"};;

};
const loginUser = async(body: Auth)=>{
    const checkIs = await user.findOne({ 
        where: {
            [Op.or]: [
                { Correo: body.Correo },
                { Nombre_Usuario: body.Correo } // Aquí usamos body.Correo para ambos
            ],
            Activo: true // Verificar que el usuario esté activo
        }
    });
    if(!checkIs) return "Usuario no encontrado o cuenta no activada";
    const passwordHash = checkIs.Contra
    const isCorrect = await verified(body.Contra, passwordHash);
    if(!isCorrect) return "Password no coincide";
    const token = generateToken(checkIs);
    const idSucursal = await Personal.findOne({where:{ID_Usuario:checkIs.ID}});
    return {Token:token,Datos:checkIs,ID_Sucursal:idSucursal?.ID_Sucursal};
}
export{registerNewUser, loginUser}