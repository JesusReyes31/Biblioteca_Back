import { Request, Response } from "express";
import { Venta } from "../models/sales.model";
import { Detail } from "../models/detailsales.model";
import { Book } from "../models/books.model";
import { user } from "../models/users.model";
import { handleHttp } from "../utils/error.handle";
import { Sequelize } from "sequelize";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import { Prestamos } from "../models/Prestamos.model";

const generarRecibo = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const venta: any = await Venta.findOne({
            where: { ID_Venta: parseInt(id) },
            attributes: [
                'ID_Venta',
                'Fecha_Venta',
                'Total',
                'ID_Metodo_Pago',
                [Sequelize.col('user.Nombre_completo'), 'nombre_cliente'],
                [Sequelize.col('user.Correo'), 'correo_cliente']
            ],
            include: [
                {
                    model: user,
                    attributes: []
                }
            ],
            raw: true
        });

        if (!venta) {
            return res.status(404).json({ message: "Venta no encontrada" });
        }

        const detallesVenta: any[] = await Detail.findAll({
            where: { ID_Venta: parseInt(id) },
            attributes: [
                'Cantidad',
                [Sequelize.col('Book.Titulo'), 'titulo_libro'],
                [Sequelize.col('Book.Precio'), 'precio']
            ],
            include: [
                {
                    model: Book,
                    attributes: []
                }
            ],
            raw: true
        });

        // Crear el PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]); // Tamaño carta aproximado
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Configuración de la página
        const { width, height } = page.getSize();
        const margin = 50;
        let yPosition = height - margin;

        // Título
        page.drawText('Recibo de Compra', {
            x: margin,
            y: yPosition,
            size: 24,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });
        yPosition -= 40;

        // Información de la venta
        page.drawText(`Número de Venta: ${venta.ID_Venta}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Fecha: ${new Date(venta.Fecha_Venta).toLocaleDateString()}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Información del cliente
        page.drawText('Información del Cliente:', {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Nombre: ${venta.nombre_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Correo: ${venta.correo_cliente}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Tabla de productos
        const tableTop = yPosition;
        const tableHeaders = ['Título', 'Cantidad', 'Precio', 'Subtotal'];
        const columnWidths = [250, 80, 100, 100];
        let xPosition = margin;

        // Encabezados de la tabla
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: tableTop,
                size: 12,
                font: helveticaBold
            });
            xPosition += columnWidths[index];
        });
        yPosition = tableTop - 20;

        // Detalles de productos
        detallesVenta.forEach(detalle => {
            xPosition = margin;
            const subtotal = detalle.Cantidad * detalle.precio;

            page.drawText(detalle.titulo_libro, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[0];

            page.drawText(detalle.Cantidad.toString(), {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[1];

            page.drawText(`$${detalle.precio.toFixed(2)}`, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });
            xPosition += columnWidths[2];

            page.drawText(`$${subtotal.toFixed(2)}`, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaFont
            });

            yPosition -= 20;
        });
        
        //Cargos
        // yPosition -= 0; // Espacio adicional antes de los cargos
        xPosition = margin;
        
        // Título "Cargos"
        page.drawText("Cargos por servicio", {
            x: xPosition,
            y: yPosition,
            size: 10,
            font: helveticaFont
        });
        
        // Mover a la última columna para el monto
        xPosition = margin + columnWidths[0] + columnWidths[1] + columnWidths[2];
        
        // Monto de los cargos
        page.drawText("$4.00", {
            x: xPosition,
            y: yPosition,
            size: 10,
            font: helveticaFont
        });

        // Total y método de pago
        yPosition -= 30;
        page.drawText(`Total: $${venta.Total.toFixed(2)}`, {
            x: width - margin - 150,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Método de Pago: ${venta.ID_Metodo_Pago ? 'Pago con Tarjeta' : 'Pago en Efectivo'}`, {
            x: width - margin - 190,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });

        // Pie de página
        page.drawText('Gracias por su compra', {
            x: width / 2 - 50,
            y: margin,
            size: 10,
            font: helveticaFont
        });

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();

        // Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=recibo-${venta.ID_Venta}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error completo:', error);
        handleHttp(res, 'ERROR_GENERAR_RECIBO');
    }
};

const generarInformePrestamos = async (req: Request, res: Response) => {
    try {
        // Obtener todos los préstamos con información relacionada
        const prestamos: any[] = await Prestamos.findAll({
            attributes: [
                'ID_Prestamo',
                'Fecha_prestamo',
                'Fecha_devolucion_prevista',
                'Estado',
                [Sequelize.col('user.Nombre_Usuario'), 'nombre_usuario'],
                [Sequelize.col('Book.Titulo'), 'titulo_libro']
            ],
            include: [
                {
                    model: user,
                    attributes: []
                },
                {
                    model: Book,
                    attributes: []
                }
            ],
            raw: true
        });

        // Crear el PDF
        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage([600, 800]); // Tamaño carta
        const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        // Configuración de la página
        const { width, height } = page.getSize();
        const margin = 35;
        let yPosition = height - margin - 20;

        // Título y fecha del informe
        page.drawText('Informe de Préstamos', {
            x: margin,
            y: yPosition,
            size: 24,
            font: helveticaBold,
            color: rgb(0, 0, 0)
        });
        yPosition -= 30;

        const fechaActual = new Date().toLocaleDateString();
        page.drawText(`Fecha de generación: ${fechaActual}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Resumen
        const prestamosActivos = prestamos.filter(p => p.Estado === 'Pendiente').length;
        const prestamosDevueltos = prestamos.filter(p => p.Estado === 'Devuelto').length;

        page.drawText('Resumen:', {
            x: margin,
            y: yPosition,
            size: 14,
            font: helveticaBold
        });
        yPosition -= 20;

        page.drawText(`Total de préstamos: ${prestamos.length}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Préstamos activos: ${prestamosActivos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 20;

        page.drawText(`Préstamos devueltos: ${prestamosDevueltos}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaFont
        });
        yPosition -= 40;

        // Tabla de préstamos
        const tableHeaders = ['ID', 'Usuario', 'Libro', 'Fecha Préstamo', 'Fecha Devolución', 'Estado'];
        const columnWidths = [50, 100, 150, 100, 100, 80];
        let xPosition = margin;

        // Encabezados de la tabla
        tableHeaders.forEach((header, index) => {
            page.drawText(header, {
                x: xPosition,
                y: yPosition,
                size: 10,
                font: helveticaBold
            });
            xPosition += columnWidths[index];
        });
        yPosition -= 20;

        // Contenido de la tabla
        prestamos.forEach(prestamo => {
            // Si no hay suficiente espacio en la página actual, crear una nueva
            if (yPosition < margin + 50) {
                page = pdfDoc.addPage([600, 800]);
                yPosition = height - margin;
            }

            xPosition = margin;

            // ID
            page.drawText(prestamo.ID_Prestamo.toString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[0];

            // Usuario
            page.drawText(prestamo.nombre_usuario, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[1];

            // Libro
            page.drawText(prestamo.titulo_libro, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[2];

            // Fecha Préstamo
            page.drawText(new Date(prestamo.Fecha_prestamo).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[3];

            // Fecha Devolución
            page.drawText(new Date(prestamo.Fecha_devolucion_prevista).toLocaleDateString(), {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont
            });
            xPosition += columnWidths[4];

            // Estado
            const colorEstado = prestamo.Estado === 'Pendiente' ? rgb(0.9, 0.3, 0.3) : rgb(0.2, 0.7, 0.2);
            page.drawText(prestamo.Estado, {
                x: xPosition,
                y: yPosition,
                size: 9,
                font: helveticaFont,
                color: colorEstado
            });

            yPosition -= 20;
        });

        // Generar el PDF
        const pdfBytes = await pdfDoc.save();

        // Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=informe-prestamos-${fechaActual}.pdf`);
        res.send(Buffer.from(pdfBytes));

    } catch (error) {
        console.error('Error completo:', error);
        handleHttp(res, 'ERROR_GENERAR_INFORME_PRESTAMOS');
    }
};

export { generarRecibo, generarInformePrestamos };
