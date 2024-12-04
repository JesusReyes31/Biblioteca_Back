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
import { PDFDocument, PDFPage, rgb, StandardFonts } from 'pdf-lib';
import * as XLSX from 'xlsx';
import fs from 'fs';
import bwipjs from 'bwip-js';
import axios from 'axios';
import { Ejemplares } from "../models/ejemplares.model";

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
        const { genre } = req.params;
        
        const books = await Book.findAll({
            where: {
                Genero: genre
            },
            include: [{
                model: Ejemplares,
                attributes: ['Cantidad', 'ID_Sucursal','ID','Precio'],
                include: [{
                    model: Sucursales,
                    as: 'Sucursales',
                    attributes: ['Nombre']
                }]
            }]
        });

        if (!books || books.length === 0) {
            return res.status(404).json({ message: `No se encontraron libros del género ${genre}` });
        }

        res.json(books);
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
            },
            include: [{
                model: Ejemplares,
                attributes: ['Cantidad', 'ID_Sucursal','ID','Precio'],
                include: [{
                    model: Sucursales,
                    as: 'Sucursales',
                    attributes: ['Nombre']
                }]
            }]
        });
        // // Consulta utilizando Sequelize para buscar en los campos título, autor, género y resumen
        // const busquedas = await Ejemplares.findAll({
        //     attributes: ['ID_Libro','ID_Sucursal','ID','Cantidad','Precio',
        //         [Sequelize.col('Book.Titulo'),'Titulo'],
        //         [Sequelize.col('Book.Autor'),'Autor'],
        //         [Sequelize.col('Book.Genero'),'Genero'],
        //         [Sequelize.col('Book.ISBN'),'ISBN'],
        //         [Sequelize.col('Book.Anio_publicacion'),'Anio_publicacion'],
        //         [Sequelize.col('Book.Imagen'),'Imagen'],
        //         [Sequelize.col('Book.Resumen'),'Resumen'],
        //         [Sequelize.col('Sucursales.Nombre'),'Sucursal']
        //     ],
        //     include: [{
        //         model: Book,
        //         attributes: [],
        //         required: true,
                
        //     },{
        //         model: Sucursales,
        //         as: 'Sucursales',
        //         attributes: []
        //     }]
        // });
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
const nodemail = async (req: Request, res: Response) => {
    try {
        const { Mail, Tipo } = req.body;
        let usuario;
        // Validar datos de entrada
        if (!Mail || !Tipo) {
            return res.status(400).json({ 
                message: 'Datos incompletos' 
            });
        }

        // Buscar usuario
        if (Tipo == 'Correo') {
            usuario = await user.findOne({ where: { Correo: Mail } });
        } else {
            usuario = await user.findOne({ where: { Nombre_Usuario: Mail } });
        }

        if (!usuario) {
            return res.status(404).json({ 
                message: 'Usuario no encontrado' 
            });
        }

        // Eliminar tokens existentes
        await Tokens.destroy({ where: { ID_Usuario: usuario.ID } });

        // Configurar transporter
        let transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.CORREO,
                pass: process.env.PASSC
            }
        });

        // Generar token
        const resetToken = jwt.sign(
            { User: usuario },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        // Generar enlace
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
        const resetLink = `${frontendUrl}/reset-password/${resetToken}`;

        // Configurar email
        let mailOptions = {
            from: process.env.CORREO,
            to: usuario.dataValues.Correo,
            subject: 'Reestablecer Contraseña Biblioteca',
            html: `<h2>Para reestablecer tu contraseña entra al siguiente enlace:</h2>
                   <a href='${resetLink}'>REESTABLECER CONTRASEÑA</a>`
        };

        // Enviar email
        await new Promise((resolve, reject) => {
            transporter.sendMail(mailOptions, async (error, info) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                try {
                    // Guardar token
                    await Tokens.create({
                        ID_Usuario: usuario.ID,
                        Token: resetToken
                    });

                    // Programar eliminación del token
                    setTimeout(async () => {
                        await Tokens.destroy({
                            where: {
                                ID_Usuario: usuario.ID,
                                Token: resetToken
                            }
                        });
                    }, 3600000);

                    resolve(info);
                } catch (err) {
                    reject(err);
                }
            });
        });

        // Respuesta exitosa
        return res.status(200).json({
            success: true,
            message: 'Correo enviado exitosamente'
        });

    } catch (error) {
        console.error('Error en nodemail:', error);
        return res.status(500).json({
            message: 'Error al procesar la solicitud'
        });
    }
};

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
        const adminCounts = { clientes: clientesCount, inventario: inventarioCount, prestamos: prestamosCount, totalLibros: totalBooksCount, generos: distinctGenerosCount, reservas: reservasCount, prestamosTotal: prestamosTotalCount, prestamosPendientes: prestamosPendientesCount, totalVentas: totalVentasCount, ventasNoEntregadas: ventasNoEntregadasCount};
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
            Sucursales.count(),//Cuenta de Sucursales
            user.count({ where: { Tipo_Usuario: 'Admin Sucursal' } }),//Usuarios tipo cliente
            user.count({ where: { Tipo_Usuario: 'Cliente' } }),//Usuarios tipo cliente
            user.count({ where: { Tipo_Usuario: 'Inventario' } }),//Usuarios tipo Inventario
            user.count({ where: { Tipo_Usuario: 'Prestamos' } }),//Usuarios tipo Prestamos
            Book.count(), //Cuenta de Libros
        ]);
        const adminCounts = {Sucursales:sucs,Administradores_Sucursales:adminsSucs,Clientes:clientes,Personal_Inventario:inventario,Personal_Prestamo:prestamos,Libros:libros};
        res.json(adminCounts);
    } catch (err) {
        console.error('Error al ejecutar la consulta SQL:', err);
        res.status(500).send('Error interno del servidor');
    }
}

//Consulta para inicio del Cliente, Inventario y Prestamos
const prinGen = async (req:Request,res:Response) => {
    try {
        // Consulta para obtener exactamente 4 registros aleatorios
        const libros = await Book.findAll({
            include: [{
                model: Ejemplares,
                attributes: ['Cantidad', 'ID_Sucursal','ID','Precio'],
                include: [{
                    model: Sucursales,
                    as: 'Sucursales',
                    attributes: ['Nombre']
                }]
            }],
            order: Sequelize.literal('NEWID()'), 
            limit: 4,
        });
        // Verificar que se obtuvieron exactamente 4 registros
        if (libros.length !== 4) {
            return res.status(400).json({ 
                message: 'No se pudieron obtener 4 ejemplares aleatorios' 
            });
        }

        res.json(libros);
    } catch (err) {
        console.error('Error al ejecutar la consulta SQL:', err);
        res.status(500).send('Error interno del servidor');
    }
}

//Generar credencial en PDF
const credencial = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { Nombre } = req.body;
        
        const User = await user.findOne({ where: { ID: parseInt(id), Nombre_Usuario: Nombre } });
        
        if (User) {
            const pdfPath = `./credenciales/${id}.pdf`;
            
            if (!fs.existsSync(pdfPath)) {
                const pdfDoc = await PDFDocument.create();
                const page = pdfDoc.addPage([600, 400]); // Formato horizontal
                
                // Fuentes
                const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
                const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
                
                // Esquema de colores modernos
                const primaryColor = rgb(0.12, 0.29, 0.49);    // Azul oscuro
                const secondaryColor = rgb(0.97, 0.97, 0.97);  // Gris muy claro
                const accentColor = rgb(0.0, 0.47, 0.75);      // Azul medio
                const textColor = rgb(0.2, 0.2, 0.2);          // Gris oscuro
                const whiteColor = rgb(1, 1, 1);               // Blanco

                // Fondo principal
                page.drawRectangle({
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight(),
                    color: secondaryColor,
                });

                // Barra superior
                page.drawRectangle({
                    x: 0,
                    y: page.getHeight() - 100,
                    width: page.getWidth(),
                    height: 100,
                    color: primaryColor,
                });

                // Título
                page.drawText('BIBLIOTECA GETBOOK', {
                    x: 20,
                    y: page.getHeight() - 60,
                    font: helveticaBold,
                    size: 28,
                    color: whiteColor,
                });

                // Subtítulo
                page.drawText('CREDENCIAL DE USUARIO', {
                    x: 20,
                    y: page.getHeight() - 85,
                    font: helvetica,
                    size: 14,
                    color: whiteColor,
                });

                // Marco decorativo para la información
                page.drawRectangle({
                    x: 220,
                    y: 60,
                    width: 360,
                    height: 240,
                    color: whiteColor,
                    borderColor: accentColor,
                    borderWidth: 2,
                    opacity: 0.9,
                });

                // Sombra decorativa
                page.drawRectangle({
                    x: 223,
                    y: 57,
                    width: 360,
                    height: 240,
                    color: rgb(0, 0, 0),
                    opacity: 0.1,
                });

                const FIXED_WIDTH = 180;
                const FIXED_HEIGHT = 200;
                const IMAGE_WIDTH = 160;
                const IMAGE_HEIGHT = 180;

                // Marco para la foto (contenedor)
                page.drawRectangle({
                    x: 19,
                    y: 79,
                    width: FIXED_WIDTH + 2,
                    height: FIXED_HEIGHT + 2,
                    borderColor: accentColor,
                    borderWidth: 2,
                    color: whiteColor,
                });
                if(!User.Imagen){
                    User.Imagen = 'https://firebasestorage.googleapis.com/v0/b/biblioteca-8fa9c.appspot.com/o/Perfil%2Fuser.png?alt=media&token=42d09dc5-8ef9-4351-adb9-440dec5c01d1'
                }

                const response = await axios.get(User.Imagen, { 
                    responseType: 'arraybuffer',
                    headers: {
                        'Accept': 'image/*',
                        'Cache-Control': 'no-cache'
                    }
                });
                
                const sharp = require('sharp');
                const processedBuffer = await sharp(Buffer.from(response.data))
                    .resize(IMAGE_WIDTH+10, IMAGE_HEIGHT+10, {
                        fit: 'cover',
                        position: 'center'
                    })
                    .png()
                    .toBuffer();

                const image = await pdfDoc.embedPng(processedBuffer);
                
                // Centrar la imagen en el contenedor
                const xOffset = (FIXED_WIDTH - IMAGE_WIDTH) / 2;
                const yOffset = (FIXED_HEIGHT - IMAGE_HEIGHT) / 2;
                
                page.drawImage(image, {
                    x: 20 + xOffset,
                    y: 80 + yOffset,
                    width: IMAGE_WIDTH,
                    height: IMAGE_HEIGHT,
                });
                // Información del usuario con mejor formato
                const drawUserInfo = (label: string, value: string, yPos: number) => {
                    // Fondo para la etiqueta
                    page.drawRectangle({
                        x: 240,
                        y: yPos - 5,
                        width: 100,
                        height: 20,
                        color: accentColor,
                    });

                    // Etiqueta
                    page.drawText(label, {
                        x: 245,
                        y: yPos,
                        font: helveticaBold,
                        size: 12,
                        color: whiteColor,
                    });

                    // Valor
                    page.drawText(value, {
                        x: 350,
                        y: yPos,
                        font: helvetica,
                        size: 14,
                        color: textColor,
                    });
                };

                drawUserInfo('NOMBRE:', User.Nombre_completo, 260);
                drawUserInfo('USUARIO:', User.Tipo_Usuario, 220);
                drawUserInfo('ID:', User.ID.toString(), 180);

                // Código de barras mejorado
                const barcodeOptions = { 
                    bcid: 'code128',
                    text: id.toString(),
                    height: 15,
                    includetext: false,
                    textxalign: 'center' as 'center',
                };
                
                const barcodeBuffer = await bwipjs.toBuffer(barcodeOptions);
                const barcodeImage = await pdfDoc.embedPng(barcodeBuffer);
                
                // Marco para el código de barras
                page.drawRectangle({
                    x: 239,
                    y: 69,
                    width: 322,
                    height: 62,
                    color: whiteColor,
                });

                page.drawImage(barcodeImage, {
                    x: 240,
                    y: 70,
                    width: 320,
                    height: 60,
                });

                // Pie de página
                page.drawText('Esta credencial es personal e intransferible', {
                    x: 20,
                    y: 30,
                    font: helvetica,
                    size: 10,
                    color: textColor,
                });

                const pdfBytes = await pdfDoc.save();
                fs.writeFileSync(pdfPath, pdfBytes);
            }

            const pdfContent = fs.readFileSync(pdfPath);
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

// Función auxiliar para cargar imagen por defecto con dimensiones fijas
async function cargarImagenPorDefecto(
    pdfDoc: PDFDocument, 
    page: PDFPage, 
    width: number, 
    height: number
) {
    try {
        const defaultImagePath = 'firebase/user.png';
        if (fs.existsSync(defaultImagePath)) {
            const sharp = require('sharp');
            const processedBuffer = await sharp(defaultImagePath)
                .resize(width, height, {
                    fit: 'cover',
                    position: 'center'
                })
                .png()
                .toBuffer();

            const defaultImage = await pdfDoc.embedPng(processedBuffer);
            
            // Centrar la imagen
            const xPosition = (page.getWidth() - width) / 2;
            const yPosition = page.getHeight() - 330;

            page.drawImage(defaultImage, {
                x: xPosition,
                y: yPosition,
                width,
                height
            });
        }
    } catch (defaultError) {
        console.error('Error al cargar imagen por defecto:', defaultError);
    }
}

const reportes = async (req:Request,res:Response) => {
    const { fechain, fechaf, genero, ID_Usuario } = req.body;
    const { reporte } = req.params;

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

export {getGenres,getBooksByGenre,search,nodemail,resetpassword,prinAdminSuc,prinAdmin,prinGen,credencial,reportes,verify_token};