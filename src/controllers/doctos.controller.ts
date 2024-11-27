import { Request, Response } from "express";
import { Venta } from "../models/sales.model";
import { Detail } from "../models/detailsales.model";
import { Book } from "../models/books.model";
import { user } from "../models/users.model";
import { handleHttp } from "../utils/error.handle";
import { Sequelize } from "sequelize";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

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
        const page = pdfDoc.addPage([600, 800]); // Tamaño carta aproximado
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

export { generarRecibo };
