import { Request, Response } from "express";
import { handleHttp } from "../utils/error.handle";
import { Sucursales } from "../models/sucursales.model";
import { where } from "sequelize";

const getSucursal = async (req:Request,res:Response)=>{
    try {
        const { id } = req.params;
        const sucursal = await Sucursales.findByPk(id);
        return sucursal ? res.json(sucursal) : res.status(404).json({ message: "No se encontró la Sucursal" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_SUCURSAL', error);
    }
}
const getSucursales = async (req:Request,res:Response)=>{
    try {
        const sucursales = await Sucursales.findAll({
            order: [
                ['ID', 'DESC'] // Agregamos el orden descendente
            ],
        });
        return sucursales ? res.json(sucursales) : res.status(404).json({ message: "No se hay Sucursales Registradas" });
    } catch (error) {
        handleHttp(res, 'ERROR_GET_SUCURSAL', error);
    }
}
const postSucursal = async (req:Request,res:Response)=>{
    try{
        const Suc = req.body;
        const admin = await Sucursales.findOne({where:{ID_Usuario:Suc.ID_Usuario}});
        if(admin){
            return res.status(404).json({ message: "El Administrador Seleccionado ya tiene sucursal asignada"})
        }
        const nombre = await Sucursales.findOne({where:{Nombre:Suc.Nombre}});
        if(nombre){
            return res.status(404).json({ message: "El Nombre de la sucursal ya existe"})
        }
        const newSuc = await Sucursales.create(Suc);
        res.status(201).json(newSuc);
    } catch(error){
        handleHttp(res, 'ERROR_POSTING_SUCURSAL',error)
    }
}
const putSucursal = async (req:Request,res:Response) => {
    try{
        const { id } = req.params;
        const Suc = req.body;
        if(!Suc.Nombre){
            putSucursalIDUser(req,res)
            return
        }
        const idSuc = await Sucursales.findByPk(id);
        if(!idSuc){
            return res.status(404).json({ message: "No existe esa Sucursal"})
        } 
        await idSuc.update(Suc);
        res.json(idSuc);
    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_SUCURSAL',error);
    }
}
const putSucursalIDUser = async (req:Request,res:Response) => {
    try{
        const { id } = req.params;
        const {ID_Usuario} = req.body;
        const idSuc = await Sucursales.findByPk(id);
        if(!idSuc){
            return res.status(404).json({ message: "No existe esa Sucursal"})
        } 
        await idSuc.update({ID_Usuario});
        res.json(idSuc);
    }catch(error){
        handleHttp(res, 'ERROR_UPDATING_SUCURSAL',error);
    }
}
const deleteSucursal = async (req:Request,res:Response) =>{
    try{
        const { id } = req.params;
        const Suc = await Sucursales.findByPk(id);
        if(!Suc){
            return res.status(404).json({ message: "No existe esa Sucursal"})
        }
        await Suc.destroy()
        res.json({ message:"Sucursal borrada de la base de datos"});

    }catch(error){
        handleHttp(res, 'ERROR_DELETING_SUCURSAL',error)
    }
}
export {getSucursal,getSucursales,postSucursal,putSucursal,putSucursalIDUser,deleteSucursal}