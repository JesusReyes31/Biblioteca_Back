import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail', // o configura tu propio SMTP
    auth: {
        user: process.env.CORREO,
        pass: process.env.PASSC
    }
});

export const sendActivationEmail = async (email: string, token: string) => {
    const activationLink = `${process.env.FRONTEND_URL}/activate/${token}`;
    
    const mailOptions = {
        from: process.env.CORREO,
        to: email,
        subject: 'Activa tu cuenta',
        html: `
            <h1>Bienvenido</h1>
            <p>Para activar tu cuenta, haz clic en el siguiente enlace:</p>
            <a href="${activationLink}">Activar cuenta</a>
            <p>Este enlace expirará en 24 horas.</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw new Error('Error al enviar el correo de activación');
    }
};

interface ReminderEmailParams {
    email: string;
    nombre: string;
    titulo_libro: string;
    fecha_devolucion: Date;
    dias_restantes: number;
}

export const sendReminderEmail = async ({
    email,
    nombre,
    titulo_libro,
    fecha_devolucion,
    dias_restantes
}: ReminderEmailParams) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Recordatorio de devolución de libro',
        html: `
            <h1>Recordatorio de devolución</h1>
            <p>Hola ${nombre},</p>
            <p>Te recordamos que el libro "${titulo_libro}" debe ser devuelto en ${dias_restantes} día(s).</p>
            <p>Fecha de devolución: ${fecha_devolucion.toLocaleDateString()}</p>
            <p>Por favor, asegúrate de devolverlo a tiempo para evitar sanciones.</p>
            <br>
            <p>Saludos cordiales,</p>
            <p>Biblioteca</p>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.error('Error al enviar email de recordatorio:', error);
    }
};