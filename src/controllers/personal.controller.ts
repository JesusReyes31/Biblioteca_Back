import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { Personal } from "../models/personal.model";


//Obtener el id de la sucursal del usuario
const getSucursalForUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const sucursal = await Personal.findAll({ where: { ID_Usuario: parseInt(id) } });
        return sucursal ? res.json(sucursal) : res.status(404).json({ message: "No existe ese usuario"});
    } catch (error) {
        handleHttp(res, 'ERROR_GET_SUCURSAL_FOR_USER');
    }
}

export { getSucursalForUser };
