import { Request, Response } from "express";
import { Op, Sequelize } from "sequelize";
import { Book } from "../models/books.model";
import { handleHttp } from "../utils/error.handle";
import { user} from "../models/users.model";
import jwt,{ JwtPayload } from "jsonwebtoken";
import { encrypt } from "../utils/bcrypt.handle";
import nodemailer,{ SentMessageInfo} from 'nodemailer';
import { Tokens } from "../models/Tokens.model";
import { Reservas } from "../models/Reservas.model";
import { Prestamos } from "../models/Prestamos.model";
import { Venta } from "../models/sales.model";
import { Sucursales } from "../models/sucursales.model";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import fs from 'fs';
import bwipjs from 'bwip-js';
import axios from 'axios';

//Otros endpoints de libros que se utilizan
const getGenres = async (req: Request, res: Response) => {
    try {
        // Consulta para obtener géneros distintos
        const genres = await Book.findAll({
            attributes: [
                [Sequelize.fn('DISTINCT', Sequelize.col('Genero')), 'Genero']
            ]
        });
        if (!genres || genres.length === 0) {
            return res.status(404).json({ message: "No se encontraron géneros" });
        }
        res.json(genres); // Retorna los géneros distintos
    } catch (error) {
        handleHttp(res, 'ERROR_GET_GENRES', error);
    }
}
const getBooksByGenre = async (req: Request, res: Response) => {
    try {
        // Obtener el parámetro del género desde req.params
        const { genre } = req.params;
        // Consulta para obtener todos los libros que coincidan con el género
        const books = await Book.findAll({
            where: {
                Genero: genre // Filtrar libros por el género recibido
            }
        });
        if (!books || books.length === 0) {
            return res.status(404).json({ message: `No se encontraron libros del género ${genre}` });
        }
        res.json(books); // Retorna los libros encontrados
    } catch (error) {
        handleHttp(res, 'ERROR_GET_BOOKS_BY_GENRE', error);
    }
};
const search = async (req: Request, res: Response) => {
    const { clave } = req.body;
    try {
        if (!clave) {
            return res.status(400).json({ message: 'Debe proporcionar una clave de búsqueda' });
        }
        // Consulta utilizando Sequelize para buscar en los campos título, autor, género y resumen
        const busqueda = await Book.findAll({
            where: {
                [Op.or]: [
                    { Titulo: { [Op.like]: `%${clave}%` } },
                    { Autor: { [Op.like]: `%${clave}%` } },
                    { Genero: { [Op.like]: `%${clave}%` } },
                    { Resumen: { [Op.like]: `%${clave}%` } },
                    { Titulo: { [Op.like]: `${clave}%` } },
                    { Autor: { [Op.like]: `${clave}%` } },
                    { Genero: { [Op.like]: `${clave}%` } },
                    { Resumen: { [Op.like]: `${clave}%` } },
                    { Titulo: { [Op.like]: `%${clave}` } },
                    { Autor: { [Op.like]: `%${clave}` } },
                    { Genero: { [Op.like]: `%${clave}` } },
                    { Resumen: { [Op.like]: `%${clave}` } },
                    { Titulo: { [Op.like]: `${clave}` } },
                    { Autor: { [Op.like]: `${clave}` } },
                    { Genero: { [Op.like]: `${clave}` } },
                    { Resumen: { [Op.like]: `${clave}` } }
                ]
            }
        });
        console.log(busqueda)
        // Verificar si se encontraron resultados
        if (busqueda.length > 0) {
            res.json(busqueda);
        } else {
            res.json({ message: 'No se encontraron resultados' });
        }
    } catch (err) {
        console.error('Error al realizar la búsqueda:', err);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};
const resetpassword = async (req: Request, res: Response) => {
    const { newPassword } = req.body;
    const token = req.headers.authorization;
    console.log('Entró')
    try {
        if (!token) {
            return res.status(401).json({ message: 'No se proporcionó el token' });
        }
        // Verificar el token y decodificarlo
        const decoded:any = jwt.verify(token, process.env.JWT_SECRET as string);
        // Buscar al usuario por su ID
        const User = await user.findByPk(decoded.User.ID);
        if (!User) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const TBLtokens = await Tokens.findOne({ where: { ID_Usuario: User.dataValues.ID} });
        if (TBLtokens?.dataValues.Token!==token) {
            return res.status(404).json({ message: 'El usuario no tiene ese token' });
        }
        // Actualizar la contraseña del usuario
        User.Contra = await encrypt(newPassword);
        await User.save();
        await TBLtokens.destroy();
        res.json({ message: 'Contraseña restablecida correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error al restablecer la contraseña' });
    }
};

//Envío de correo utilizando nodemailer, se envia el link con un token de acceso para poder cambiar contraseña que se guarda en la BD
const nodemail = async (req:Request,res:Response) => {
    const {Correo} = req.body;
    console.log(Correo)
    let usuario;
    if(!Correo){
        const {Nombre_Usuario} = req.body;
        console.log(Nombre_Usuario)
        usuario = await user.findOne({ where: { Nombre_Usuario:Nombre_Usuario } });
    }else{
        usuario = await user.findOne({ where: { Correo:Correo } });
    }
    if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    console.log(usuario?.dataValues)
    // Eliminar cualquier token existente para el usuario antes de generar uno nuevo
    try {
        const deletedTokens = await Tokens.destroy({ where: { ID_Usuario: usuario.ID } });
        if (deletedTokens > 0) {
            console.log('Token anterior eliminado');
        } else {
            console.log('No se encontró un token previo para eliminar');
        }
    } catch (err) {
        console.error('Error al eliminar el token existente:', err);
    }
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.CORREO, 
            pass: process.env.PASSC
    }
    });
    // Generar un token con el ID del usuario y una expiración de 1 hora
    const resetToken = jwt.sign(
        { User: usuario },
        process.env.JWT_SECRET as string, // Llave secreta para JWT
        { expiresIn: '1h' } // El token expirará en 1 hora
    );
    
    // Generar un enlace de restablecimiento de contraseña con el token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password/${resetToken}`;
    console.log(`Enlace para restablecer contraseña: ${resetLink}`);
    let mailOptions = {
        from: process.env.CORREO, // Remitente
        to: usuario?.dataValues.Correo, // Destinatario
        subject: 'Reestablecer Contraseña Biblioteca',
        html: `<h2>Para reestablecer tu contraseña entra al siguiente enlace:</h2>
            <a href='${resetLink}'>REESTABLECER CONTRASEÑA</a>`
    };
    try{
        transporter.sendMail(mailOptions, async (error: Error | null, info: SentMessageInfo) =>{
            if (error) {
                console.log('no se pudo: ',error)
                res.json({ message: 'Envio incorrecto, verifique el correo ingresado' });
                return console.log(error);
            }
            console.log('Correo enviado: ' + info.response);
            const newToken = await Tokens.create({ID_Usuario:usuario.ID,Token:resetToken});
            setTimeout(async () => {
                try {
                    const rowsAffected = await Tokens.destroy({
                        where: {
                            ID_Usuario: usuario.ID,
                            Token: resetToken
                        }
                    });
                    if (rowsAffected > 0) {
                        console.log('Token eliminado después de 1 hora.');
                    } else {
                        console.log('El token ya fue eliminado o no existe.');
                    }
                } catch (err) {
                    console.error('Error al eliminar el token:', err);
                }
            }, 3600000);
            res.json('Correo enviado: ');
        });
    }catch(err){ console.log(err)}
}

//Verificar el token enviado, para ver si se puede mostrar la pagina de reset-password
const verify_token = async (req:Request,res:Response) => {
    const token = req.headers.authorization;
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    try {
        //Checar si el token existe en la BD
        const tokenDB = await Tokens.findOne({ where: { Token: token } });
        if(!tokenDB){
            return res.status(401).json({ message: 'Token no existe' });
        }   
        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        // Enviar respuesta positiva si el token es válido
        res.json({ valid: true });
    } catch (error) {
        console.error('Token inválido o expirado:', error);
        res.status(401).json({ valid: false, message: 'Token inválido o expirado' });
    }
}

//Consulta para inicio del administrador de sucursal
const prinAdminSuc = async (req:Request,res:Response) => {
    try {
        const [clientesCount, inventarioCount, prestamosCount, totalBooksCount, distinctGenerosCount, reservasCount, prestamosTotalCount, prestamosPendientesCount, totalVentasCount, ventasNoEntregadasCount] = await Promise.all([
            user.count({ where: { Tipo_Usuario: 'Cliente' } }),//Usuarios tipo cliente
            user.count({ where: { Tipo_Usuario: 'Inventario' } }),//Usuarios tipo Inventario
            user.count({ where: { Tipo_Usuario: 'Prestamos' } }),//Usuarios tipo Prestamos
            Book.count(), //Cuenta de Libros
            Book.count({ distinct: true, col: 'genero' }), //Libros distinguido por géneros
            Reservas.count(), //Cuenta de Reservas
            Prestamos.count(), //Cuentas de Prestamos
            Prestamos.count({ where: { Estado: 'Pendiente' } }), //Cuenta de Prestamos Pendientes
            Venta.count(), //Cuenta de Ventas Completas
            Venta.count({ where: { Entregado: 'No' } }) //Cuentas de Ventas sin entregar
        ]);
        const adminCounts = { clientes: clientesCount, inventario: inventarioCount, prestamos: prestamosCount, totalBooks: totalBooksCount, distinctGeneros: distinctGenerosCount, reservas: reservasCount, prestamosTotal: prestamosTotalCount, prestamosPendientes: prestamosPendientesCount, totalVentas: totalVentasCount, ventasNoEntregadas: ventasNoEntregadasCount};
        // console.log(adminCounts)
        res.json(adminCounts);
    } catch (err) {
        console.error('Error al ejecutar la consulta SQL:', err);
        res.status(500).send('Error interno del servidor');
    }
}

//Consulta para inicio del administrador general
const prinAdmin = async (req:Request,res:Response) => {
    try {
        const [sucs,adminsSucs,clientes,inventario,prestamos,libros] = await Promise.all([
            Sucursales.count(),
            user.count({ where: { Tipo_Usuario: 'Admin Sucursal' } }),//Usuarios tipo cliente
            user.count({ where: { Tipo_Usuario: 'Cliente' } }),//Usuarios tipo cliente
            user.count({ where: { Tipo_Usuario: 'Inventario' } }),//Usuarios tipo Inventario
            user.count({ where: { Tipo_Usuario: 'Prestamos' } }),//Usuarios tipo Prestamos
            Book.count(), //Cuenta de Libros
        ]);
        const adminCounts = {Sucursales:sucs,Administradores_Sucursales:adminsSucs,Clientes:clientes,Personal_Inventario:inventario,Personal_Prestamo:prestamos,Libros:libros };
        // console.log(adminCounts)
        res.json(adminCounts);
    } catch (err) {
        console.error('Error al ejecutar la consulta SQL:', err);
        res.status(500).send('Error interno del servidor');
    }
}
const credencial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {Nombre} = req.body;
        console.log(id,Nombre)
        // Consulta a la base de datos usando Sequelize
        const User = await user.findOne({ where: { ID: parseInt(id), Nombre_Usuario: Nombre } });
        if (User) {
            // Si el usuario existe, generar la credencial en PDF
            const pdfPath = `./credenciales/${id}.pdf`;
            // Si el PDF no existe, crearlo
            if (!fs.existsSync(pdfPath)) {
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([400, 600]); // Tamaño personalizado para la credencial
                // Establecer la fuente y el estilo
                const helveticaFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                const fontSizeTitle = 24;
                const fontSizeText = 16;
                // Establecer colores
                const backgroundColor = rgb(0.8, 0.9, 1); // Color de fondo (azul claro)
                const textColor = rgb(0, 0, 0); // Color de texto (negro)
                // Dibujar un rectángulo de fondo
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                    color: backgroundColor,
                });
                // Establecer el título "IDENTIFICACIÓN"
                page.drawText('IDENTIFICACIÓN', {
                    x: 100,
                    y: page.getHeight() - 60,
                    font: helveticaFont,
                    size: fontSizeTitle,
                    color: textColor,
                });
                // Añadir información del usuario
                page.drawText(`Nombre: ${User.Nombre_completo}`, {
                    x: 50,
                    y: page.getHeight() - 120,
                    font: helveticaFont,
                    size: fontSizeText,
                    color: textColor,
                });
                page.drawText(`Tipo de Usuario: ${User.Tipo_Usuario}`, {
                    x: 50,
                    y: page.getHeight() - 150,
                    font: helveticaFont,
                    size: fontSizeText,
                    color: textColor,
                });
                page.drawText(`ID: ${User.ID}`, {
                    x: 50,
                    y: page.getHeight() - 180,
                    font: helveticaFont,
                    size: fontSizeText,
                    color: textColor,
                });
                if (User.Imagen) {
                    try {
                        // const decoded = jwt.verify(User.Imagen, process.env.JWT_SECRET || "secreto.01");
                        // const imageUrl = decoded.toString();
                        const response = await axios.get(User.Imagen, { responseType: 'arraybuffer' });
                        console.log('Tipo de contenido:', response.headers['content-type']);
                        
                        const contentType = response.headers['content-type'];
                        const imageBytes = Buffer.from(response.data);
                        
                        console.log('Primeros bytes de la imagen:', imageBytes.slice(0, 10));
                        
                        let image;
                        if (contentType === 'image/jpeg') {
                            image = await pdfDoc.embedJpg(imageBytes);
                        } else if (contentType === 'image/png') {
                            image = await pdfDoc.embedPng(imageBytes);
                        } else {
                            throw new Error('Tipo de imagen no soportado');
                        }
                        
                        const { width, height } = image.scale(0.3); // Escalar la imagen al 50%
                        console.log(`Imagen: width=${width}, height=${height}`);
                        
                        // Dibujar la imagen en el PDF
                        page.drawImage(image, {
                            x: 110,
                            y: page.getHeight() - 330, // Posición vertical
                            width,
                            height,
                        });
                    } catch (error) {
                        console.error('Error al cargar la imagen:', error);
                        // Puedes decidir cómo manejar este error (ej., enviando un mensaje en el PDF)
                    }
                }               
                // Insertar código de barras
                const barcodeOptions = { bcid: 'code128', text: id.toString() };
                // Convertir el código de barras a una imagen
                const barcodeBuffer = await bwipjs.toBuffer(barcodeOptions);
                const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);          
                // Insertar la imagen del código de barras
                page.drawImage(barcodeImage, {
                    x: 100,
                    y: page.getHeight() - 430,
                    width: 200,
                    height: 60,
                });
                // Guardar el PDF en la carpeta "credenciales"
                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(pdfPath, pdfBytes);
            }
            // Leer el contenido del PDF y enviarlo como respuesta
            const pdfContent = fs.readFileSync(pdfPath);
            //Eliminar el archivo temporal
            fs.unlinkSync(pdfPath);
            res.setHeader('Content-Disposition', 'inline; filename="Credencial_usuario.pdf"');
            res.contentType('application/pdf');
            res.send(pdfContent);
        } else {
            res.status(404).send('El usuario no existe');
        }
    } catch (err) {
        console.error('Error al generar la credencial:', err);
        res.status(500).send('Error interno del servidor');
    }
}

const reportes = async (req:Request,res:Response) => {
    const { fechain, fechaf, genero, ID_Usuario } = req.body;
    const { reporte } = req.params;
    console.log("Reporte:", reporte, "Fecha In:", fechain, "FechaF:", fechaf, "Genero:", genero, "ID:", ID_Usuario);

    try {
        let nombre: string;
        let data: any[] = [];

        switch (reporte) {
            case 'general':
                data = await Prestamos.findAll({
                    include: [
                        {
                            model: Book,
                            attributes: ['Titulo']
                        },
                        {
                            model: user,
                            attributes: ['Nombre'],
                            where: {
                                Numero_Cuenta: { [Op.ne]: null }
                            }
                        }
                    ],
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechain, fechaf]
                        }
                    },
                    attributes: ['ID_Libro', 'Fecha_prestamo', 'Fecha_devolucion_prevista', 'Estado']
                });
                nombre = `Prestamos del ${fechain} al ${fechaf}.xlsx`;
                break;

            case 'interno':
                data = await Prestamos.findAll({
                    include: [
                        {
                            model: Book,
                            attributes: ['Titulo']
                        },
                        {
                            model: user,
                            attributes: ['Nombre'],
                            where: {
                                Numero_Cuenta: { [Op.ne]: null }
                            }
                        }
                    ],
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechain, fechaf]
                        }
                    },
                    attributes: ['ID_Libro', 'Fecha_prestamo', 'Fecha_devolucion_prevista', 'Estado']
                });
                nombre = `Prestamos internos del ${fechain} al ${fechaf}.xlsx`;
                break;

            case 'externo':
                data = await Prestamos.findAll({
                    include: [
                        {
                            model: Book,
                            attributes: ['Titulo']
                        },
                        {
                            model: user,
                            attributes: ['Nombre'],
                            where: {
                                Numero_Cuenta: null
                            }
                        }
                    ],
                    where: {
                        Fecha_prestamo: {
                            [Op.between]: [fechain, fechaf]
                        }
                    },
                    attributes: ['ID_Libro', 'Fecha_prestamo', 'Fecha_devolucion_prevista', 'Estado']
                });
                nombre = `Prestamos externos del ${fechain} al ${fechaf}.xlsx`;
                break;

            case 'inventario':
                data = await Book.findAll({
                    attributes: ['Titulo', 'Autor', 'Genero', 'ISBN', 'Anio_publicacion', 'Resumen', 'Disponibilidad']
                });
                nombre = "Inventario_Libros.xlsx";
                break;

            case 'categoria':
                data = await Book.findAll({
                    where: { Genero: genero },
                    attributes: ['Titulo', 'Autor', 'Genero', 'ISBN', 'Anio_publicacion', 'Resumen', 'Disponibilidad']
                });
                nombre = `Libros por genero ${genero}.xlsx`;
                break;

            case 'usuarios':
                data = await Prestamos.findAll({
                    include: [
                        {
                            model: Book,
                            attributes: ['Titulo']
                        },
                        {
                            model: user,
                            attributes: ['Nombre'],
                            where: { ID_usuario: ID_Usuario }
                        }
                    ],
                    attributes: ['ID_Libro', 'Fecha_prestamo', 'Fecha_devolucion_prevista', 'Estado']
                });
                nombre = `Prestamos devueltos ${ID_Usuario}.xlsx`;
                break;

            default:
                return res.status(400).send('Tipo de reporte no válido');
        }

        // Convertir los datos a JSON y crear el archivo Excel
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data.map((d: any) => d.toJSON()));
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');
        XLSX.writeFile(workbook, nombre);

        console.log('Archivo Excel creado exitosamente');
        res.download(nombre, nombre, (err) => {
            if (err) {
                console.error('Error al descargar el archivo:', err);
                res.status(500).send('Error al descargar el archivo');
            }
            fs.unlinkSync(nombre); // Eliminar el archivo después de enviarlo
        });

    } catch (err) {
        console.error('Error al ejecutar la consulta:', err);
        res.status(500).send('Error interno del servidor');
    }
}

export {getGenres,getBooksByGenre,search,nodemail,resetpassword,prinAdminSuc,prinAdmin,credencial,reportes,verify_token};