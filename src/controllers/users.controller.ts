import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { user } from "../models/users.model";
import { Sequelize } from "sequelize";
import { uploadImage } from "../firebase/imageController";
import { Sucursales } from "../models/sucursales.model";
import { encrypt } from "../utils/bcrypt.handle";
import { Op } from "sequelize";
import { ActivationToken } from "../models/activation_tokens.model";
import { Personal } from "../models/personal.model";

const getUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const idUser = await user.findByPk(parseInt(id));
        return idUser ? res.json(idUser) : res.status(404).json({ message: "No existe ese usuario"});
    } catch (error) {
        handleHttp(res, 'ERROR_GET_USER');
    }
}

const getUsers = async (req: Request, res: Response) => {
    try {
        // Obtener el tipo de usuario desde el cuerpo de la solicitud
        const userType = req.body.user.User.Tipo_Usuario;

        // Definir el mapeo de tipos de usuario
        const userTypeMapping: { [key: string]: string[] } = {
            Admin: ['Admin Sucursal'],
            'Admin Sucursal': ['Prestamos', 'Inventario', 'Cliente'],
            Prestamos: ['Cliente']
        };

        // Verificar si el tipo de usuario tiene permisos definidos
        if (!userTypeMapping[userType]) {
            return res.status(403).json({ message: "No tienes permisos para acceder a esta información." });
        }

        // Obtener los tipos de usuario que el usuario autenticado puede ver
        const allowedUserTypes = userTypeMapping[userType];

        // Consultar los usuarios que coincidan con los tipos permitidos
        const users = await user.findAll({
            where: {
                Tipo_Usuario: allowedUserTypes
            }
        });
        // Devolver la lista de usuarios
        return res.status(200).json(users);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_USERS');
    }

}
const getTypeUsers = async (req: Request, res: Response) => {
    try {
        const u = req.body.user.User;
        const userTypeMapping: { [key: string]: string[] } = {
            Admin: ['Admin Sucursal'],
            'Admin Sucursal': ['Prestamos', 'Inventario', 'Cliente'],
            Prestamos: ['Cliente']
        };
        
        const allowedTypes = userTypeMapping[u.Tipo_Usuario];
        if (!allowedTypes) {
            return res.status(403).json({ message: 'Rol no válido para esta acción' });
        }

        // Transformar el array en un array de objetos para el JSON
        const typesResponse = allowedTypes.map(type => ({
            Tipo_Usuario: type
        }));

        
        res.status(200).json(typesResponse);
    } catch(error) {
        handleHttp(res, 'ERROR_GET_USERS');
    }
}

const getSucForUser = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const sucursales = await Sucursales.findAll({ where: { ID_Usuario: parseInt(id) } });
        console.log(sucursales);
        res.status(200).json(sucursales);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_USERS_BY_SUCURSAL');
    }
}

//El post está dentro del archivo auth.controller ya que sería un controlador para el logi
const putUser = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const User = req.body;
        console.log(id,User);
        const idUser = await user.findByPk(parseInt(id));
        if(!idUser){
            return res.status(404).json({ message: "No existe ese usuario"})
        } 
        await idUser.update(User);
        res.json({ message: "Información actualizada exitosamente"});

    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_USERS');
    }
}

//Para actualizar la imagen de perfil
const putUserImage = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const file = req.body; // Dependiendo de cómo configures multer
        console.log(file);
        if (!file) {
            return res.status(400).json({ message: "No se proporcionó ninguna imagen" });
        }
        const idUser = await user.findByPk(id);
        if (!idUser) {
            return res.status(404).json({ message: "No existe ese usuario" });
        }

        // La imagen se guarda en firebase y se obtiene el link
        const imageLink = await uploadImage(req,res);
        await idUser.update({ Imagen: imageLink.url });
        
        res.json(idUser);
    } catch (error) {
        console.error('Error al actualizar imagen:', error);
        handleHttp(res, 'ERROR_UPDATING_USERS');
    }
}

const putUserPassword = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const { Password } = req.body;
        console.log(id,Password);
        const idUser = await user.findByPk(parseInt(id));
        if(!idUser){
            return res.status(404).json({ message: "No existe ese usuario"})
        }
        const passHash = await encrypt(Password);
        await idUser.update({ Contra: passHash });
        res.json({ message: "Contraseña actualizada exitosamente"});
    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_USERS');
    }
}

const deleteUserr = async (req: Request, res: Response) => {
    try{
        const { id } = req.params;
        const token_activation = await ActivationToken.findOne({where:{ID_Usuario:parseInt(id)}});
        if(token_activation){
            await token_activation.destroy()
        }
        const personal = await Personal.findOne({where:{ID_Usuario:parseInt(id)}});
        if(personal){
            await personal.destroy()
        }
        const idUser = await user.findByPk(id);
        if(!idUser){
            return res.status(404).json({ message: "No existe ese usuario"})
        }
        await idUser.destroy()
        res.json({ message:"Usuario borrado de la base de datos"});

    }catch{
        handleHttp(res, 'ERROR_DELETING_USERS')
    }
}

const activateUser = async (req: Request, res: Response) => {
    try {
        const { token } = req.params;
        
        const activationToken = await ActivationToken.findOne({
            where: {
                Token: token,
            }
        });

        if (!activationToken) {
            return res.status(400).json({ message: "Token inválido o expirado" });
        }

        // Activar usuario
        await user.update(
            { Activo: true },
            { where: { ID: activationToken.ID_Usuario } }
        );
        res.json({ message: "Cuenta activada exitosamente" });
    } catch (error) {
        handleHttp(res, 'ERROR_ACTIVATING_USER');
    }
};

export { getSucForUser,getUsers,getTypeUsers, getUser, putUser, putUserImage,putUserPassword, deleteUserr, activateUser };
