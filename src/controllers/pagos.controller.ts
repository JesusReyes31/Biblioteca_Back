import { Request, Response } from "express"
import { handleHttp } from "../utils/error.handle";
import { MetodosPago } from "../models/pagos.model";

const getMetodosPago = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        const metodosPago = await MetodosPago.findAll({where:{ID_Usuario:id}});
        res.status(200).json(metodosPago);
    } catch (error) {
        handleHttp(res, 'ERROR_GET_METODOS_PAGO');
    }
}

const postMetodosPago = async (req: Request, res: Response) => {
    try {
        const { ID_Usuario, Nombre_Titular, Numero_Tarjeta, Fecha_Vencimiento, Tipo_Tarjeta } = req.body;
        const Activa = true;
        const newMetodoPago = await MetodosPago.create({ ID_Usuario, Nombre_Titular, Numero_Tarjeta, Fecha_Vencimiento, Tipo_Tarjeta, Activa });
        res.status(201).json({message: "Metodo de Pago creado correctamente"});
    } catch (error) {
        handleHttp(res, 'ERROR_POST_METODOS_PAGO');
    }
}

const updateMetodosPago = async (req: Request, res: Response) => {
    try {
        const { ID_Tarjeta, Nombre_Titular, Numero_Tarjeta, Fecha_Vencimiento, Tipo_Tarjeta, Activa } = req.body;
        const actualizacion = await MetodosPago.update({ Nombre_Titular, Numero_Tarjeta, Fecha_Vencimiento, Tipo_Tarjeta, Activa }, { where: { ID: parseInt(ID_Tarjeta) } });
        res.status(200).json({message: "Metodo de Pago actualizado correctamente"});
    } catch (error) {
        handleHttp(res, 'ERROR_UPDATE_METODOS_PAGO');
    }
}

const deleteMetodosPago = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await MetodosPago.destroy({ where: { ID: parseInt(id) } });
        res.status(200).json({message: "Metodo de Pago eliminado correctamente"});
    } catch (error) {
        handleHttp(res, 'ERROR_DELETE_METODOS_PAGO');
    }
}

export { getMetodosPago, postMetodosPago, updateMetodosPago, deleteMetodosPago };
