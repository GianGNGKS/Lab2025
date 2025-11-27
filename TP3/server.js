// 1. IMPORTS
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fileUpload from 'express-fileupload';

// 2. CONFIGURACIÓN BÁSICA 
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'clave_por_defecto_para_testing';
const PORT = process.env.PORT || 4000;

// 3. PATHS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 3.1 Paths importantes
const publicPath = path.join(__dirname, 'public');
const dataPath = path.join(__dirname, 'data');
const pagesPath = path.join(publicPath, 'pages');

//4. MIDDLEWARE (ANTES DE RUTAS)
//4.1 Logging simple de peticiones
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next(); // * Permite continuar a la siguiente función middleware o ruta
});

//4.2 Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

//4.3 Middleware para servir archivos estáticos
//EJ: /styles/main.css → public/styles/main.css
app.use(express.static(publicPath));

//4.4 Middleware para manejo de subida de archivos
app.use(fileUpload({
    limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
    abortOnLimit: true,
}));

//5. RUTAS
// 5.1 Rutas GET
//5.1.1 API: obtener lista completa de torneos
app.get('/api/torneos', async (req, res, next) => {
    try {
        const filePath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'Archivo de torneos no encontrado'
            });
        }

        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);

        if (!Array.isArray(torneos) || torneos.length === 0) {
            return res.status(404).json({
                error: 'No hay torneos disponibles'
            });
        }

        res.json(torneos);

    } catch (error) {
        next(error);
    }
});

//5.1.2 API: obtener datos específicos de un torneo
app.get('/api/torneos/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const filePath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo de torneos no encontrado' });
        }

        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({
                error: 'Torneo no encontrado',
                torneo_id: id
            });
        }
        res.json(torneo);
    } catch (error) {
        next(error);
    }
});

//5.1.3 obtener recursos específicos de un torneo (participantes, partidos, etc.)
function validarEstructuraRecurso(data, recurso) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { valido: false, error: 'Estructura inválida', codigo: 500 };
    }

    if (!data.hasOwnProperty(recurso)) {
        return {
            valido: false,
            error: `Propiedad "${recurso}" no encontrada`,
            codigo: 500
        };
    }

    if (!Array.isArray(data[recurso])) {
        return {
            valido: false,
            error: `"${recurso}" debe ser un array`,
            codigo: 500
        };
    }
    return { valido: true };
}

// 5.1.4 Ruta para obtener recursos específicos de un torneo
app.get('/api/torneos/:id/:recurso', async (req, res, next) => {
    try {
        const { id, recurso } = req.params;

        const recursosValidos = ['participantes', 'partidos'];
        if (!recursosValidos.includes(recurso)) {
            return res.status(400).json({
                error: 'Recurso inválido',
                recursos_disponibles: recursosValidos
            });
        }

        const fileName = `${recurso}-${id}.json`;
        const filePath = path.join(dataPath, id, fileName);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: `${recurso} no encontrados`,
                torneo_id: id
            });
        }

        const data = await fsPromises.readFile(filePath, 'utf8');
        const recursoData = JSON.parse(data);

        const validacion = validarEstructuraRecurso(recursoData, recurso);
        if (!validacion.valido) {
            return res.status(validacion.codigo).json({
                error: validacion.error
            });
        }

        res.json(recursoData);
    } catch (error) {
        next(error);
    }
});                                                           

//////////////////
// CRUD DE TORNEOS
//////////////////

// I. Crear nuevo torneo
app.post('/api/torneos', async (req, res, next) => {
    try {
        const nuevoTorneo = req.body;

        const validacion = validarDatosTorneo(nuevoTorneo, false);

        if (!validacion.valido) {
            return res.status(400).json({ error: 'Datos de torneo inválidos', detalles: validacion.errores });
        }

        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);

        if (!nuevoTorneo.portadaURL) {
            nuevoTorneo.portadaURL = `/api/imagenes/Banner-fondo.png`;
        }

        //generar ID simple único no usado (para simplicidad)
        let nuevoId;
        do {
            nuevoId = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        } while (torneos.some(t => t.torneo_id === nuevoId));
        nuevoTorneo.torneo_id = nuevoId;

        // Generar clave admin simple
        const admin_key = generarClave();

        //Hashear clave admin
        const admin_key_hashed = await bcrypt.hash(admin_key, 10);
        nuevoTorneo.admin_key_hashed = admin_key_hashed;
        nuevoTorneo.creado_en = new Date().toISOString();

        torneos.push(nuevoTorneo);
        await fsPromises.writeFile(filePath, JSON.stringify(torneos, null, 2), 'utf8');

        console.log(`Torneo ${nuevoId} creado con clave: ${admin_key.substring(0, 8)}...`);

        res.status(201).json({ message: 'Torneo creado', torneo_id: nuevoId, admin_key: admin_key });
    } catch (error) {
        next(error);
    }
});

/**
 * Función para generar una clave única y relativamente segura.
 * Forma una clave combinando entre dos palabras aleatorias y un número aleatorio.
 *      Ejemplo: "anaxagoras-lycurgus-4821"
 * @returns {string} Clave generada para el torneo
 */
function generarClave() {
    const palabrasClave = [
        "anaxagoras", "mydeimos", "tribios", "helektra", "cifera",
        "castorice", "aglaea", "khaslana", "hyacinthia", "oronyx",
        "polyxia", "cyrene", "demiurge", "lycurgus", "terravox"];

    const palabra1 = palabrasClave[Math.floor(Math.random() * palabrasClave.length)];
    const palabra2 = palabrasClave[Math.floor(Math.random() * palabrasClave.length)];
    const numero = Math.floor(1000 + Math.random() * 9000);

    return `${palabra1}-${palabra2}-${numero}`;
}

function validarDatosTorneo(torneo, esActualizacion) {
    const errores = [];

    //1. Validar que el objeto torneo sea válido
    if (!torneo || typeof torneo !== 'object') {
        return { valido: false, errores: ['Formato de torneo inválido.'] };
    }

    //2. Validar campos requeridos (solo si es creación)
    if (!esActualizacion) {
        const camposRequeridos = ['nombre', 'disciplina', 'formato', 'organizador', 'estado', 'nro_participantes'];
        camposRequeridos.forEach(campo => {
            if (!torneo.hasOwnProperty(campo)) {
                errores.push(`Campo requerido faltante: ${campo}\n`);
            }
        });
    }

    //3. Validación de tipos de datos
    const tiposEsperados = {
        nombre: 'string',
        disciplina: 'string',
        formato: 'string',
        organizador: 'string',
        estado: 'number',
        nro_participantes: 'number'
    };

    Object.entries(tiposEsperados).forEach(([campo, tipo]) => {
        if (torneo.hasOwnProperty(campo) && typeof torneo[campo] !== tipo) {
            errores.push(`Tipo inválido para campo "${campo}". Se esperaba ${tipo}.\n`);
        }
    });

    return { valido: errores.length === 0, errores };
}

// II. Verificar clave admin y obtener token JWT
app.post('/api/torneos/:id/verificar-key-admin', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { admin_key } = req.body;

        console.warn(`Verificando clave para torneo ${id}. Clave recibida: ${admin_key}`);
        if (!admin_key || typeof admin_key !== 'string') {
            console.error('Clave admin inválida en la petición');
            return res.status(400).json({ error: 'Clave admin inválida' });
        }

        //2. Leer archivo de torneos
        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            console.error(`Torneo ${id} no encontrado para verificación de clave`);
            return res.status(404).json({ error: 'Torneo no encontrado', torneo_id: id });
        }

        //3. Verificar clave
        if (!torneo.admin_key_hashed) {
            console.error(`Torneo ${id} no tiene clave admin configurada`);
            return res.status(500).json({ error: 'Torneo sin clave admin configurada' });
        }

        const esValida = await bcrypt.compare(admin_key, torneo.admin_key_hashed);

        if (!esValida) {
            console.error(`Clave admin incorrecta para torneo ${id}`);
            return res.status(401).json({ error: 'Clave admin incorrecta' });
        }

        const token = jwt.sign({ torneo_id: id, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });

        console.warn(`Clave admin verificada para torneo ${id}. Generando token JWT.`);

        res.json({ valid: true, message: 'Clave verificada', token, expires_in: '2 horas' });

    } catch (error) {
        next(error);
    }
});

//III Verificación clave participante
app.post('/api/torneos/:id/verificar-key-participante', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { participante_key } = req.body;

        console.warn(`Verificando clave participante para torneo ${id}. Clave recibida: ${participante_key}`);
        if (!participante_key || typeof participante_key !== 'string') {
            return res.status(400).json({ error: 'Clave participante inválida' });
        }

        //2. Leer archivo de participantes
        const filePath = path.join(dataPath, id, `participantes-${id}.json`);
        const data = await fsPromises.readFile(filePath, 'utf8');
        const participantesData = JSON.parse(data);

        //3. Verificar estructura
        const validacion = validarEstructuraRecurso(participantesData, 'participantes');

        if (!validacion.valido) {
            console.error(`Estructura inválida en archivo de participantes para torneo ${id}: ${validacion.error}`);
            return res.status(validacion.codigo).json({ error: validacion.error });
        }

        //4. Buscar participante con clave hasheada que coincida
        const participante = participantesData.participantes.find(p => p.participante_key_hashed &&
            bcrypt.compareSync(participante_key, p.participante_key_hashed));

        if (!participante) {
            console.error(`Clave participante incorrecta para torneo ${id}`);
            return res.status(401).json({ error: 'Clave participante incorrecta' });
        }
        console.warn(`Clave participante verificada para torneo ${id}, participante ${participante.nombre}.`);

        // 5. true respuesta exitosa
        return res.json({ valid: true, message: 'Clave participante verificada', participante_id: participante.id, nombre: participante.nombre });
    } catch (error) {
        next(error);
    }
});


// III. Middleware para verificar token JWT en rutas protegidas
function verificarTokenAdmin(req, res, next) {
    try {
        //1. Obtener token del encabezado Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Encabezado Authorization faltante' });
        }

        //2. Analizar formato (Bearer)
        const partesToken = authHeader.split(' ');
        if (partesToken.length !== 2 || partesToken[0] !== 'Bearer') {
            return res.status(401).json({ error: 'Formato de token inválido' });
        }

        const token = partesToken[1];

        //3. Verificar token
        const payload = jwt.verify(token, JWT_SECRET);

        //4. Validar que el token corresponda al torneo solicitado
        const { id } = req.params;
        const torneo_id_token = payload.torneo_id;

        if (torneo_id_token !== id) {
            return res.status(403).json({
                error: 'El token no corresponde al torneo solicitado'
            });
        }

        //5. Token válido, continuar
        req.adminData = payload;
        console.log(`Token verificado para torneo ${id}`);
        next();

    } catch (error) {
        // Errores comunes de JWT
        // Token expirado
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expirado. Vuelve a autenticarte.'
            });
        }

        // Token inválido
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Token inválido o corrupto.'
            });
        }

        // Error en verificación (otros)
        console.error('Error en verificarTokenAdmin:', error);
        return res.status(500).json({
            error: 'Error al verificar token.'
        });
    }
}

// II. Actualizar torneo existente
app.put('/api/torneos/:id', verificarTokenAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        const validacion = validarDatosTorneo(datosActualizados, true);

        if (!validacion.valido) {
            return res.status(400).json({ error: 'Datos de torneo inválidos', detalles: validacion.errores });
        }

        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const indice = torneos.findIndex(t => t.torneo_id === id);

        if (indice === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado', torneo_id: id });
        }

        torneos[indice] = {
            ...torneos[indice],
            ...datosActualizados,
            torneo_id: id
        };

        await fsPromises.writeFile(filePath, JSON.stringify(torneos, null, 2), 'utf8');

        res.json({ message: 'Torneo actualizado', torneo_id: id });
    } catch (error) {
        next(error);
    }
});

// III. Eliminar torneo
app.delete('/api/torneos/:id', verificarTokenAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        //Leer archivo de torneos
        const torneosPath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(torneosPath)) {
            return res.status(404).json({
                error: 'Archivo de torneos no encontrado'
            });
        }

        const data = await fsPromises.readFile(torneosPath, 'utf8');
        const torneos = JSON.parse(data);

        //Buscar el torneo
        const indice = torneos.findIndex(t => t.torneo_id === id);

        if (indice === -1) {
            return res.status(404).json({
                error: 'Torneo no encontrado',
                torneo_id: id
            });
        }

        //liminar el torneo del array
        const torneoEliminado = torneos.splice(indice, 1)[0];

        //Guardar archivo actualizado
        await fsPromises.writeFile(
            torneosPath,
            JSON.stringify(torneos, null, 2),
            'utf8'
        );

        //Responder con éxito
        res.json({
            message: 'Torneo eliminado con éxito',
            torneo_id: id,
            nombre: torneoEliminado.nombre
        });

    } catch (error) {
        next(error);
    }
});

////////////////////////
// CRUD de participantes
////////////////////////

// IV. Agregar participante a un torneo
app.post('/api/torneos/:id/participantes', async (req, res, next) => {
    try {
        // 1. Obtener ID del torneo y cuerpo del participante
        const { id } = req.params;
        const { nombre } = req.body;

        // 2. Validar nombre del participante
        if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
            return res.status(400).json({
                error: 'El nombre del participante es requerido y debe ser un texto no vacío.'
            });
        }

        // 3. Verificar si torneo existe y leer archivo de participantes
        const torneosFilePath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(torneosFilePath)) {
            return res.status(404).json({
                error: 'Archivo de torneos no encontrado'
            });
        }

        const torneosData = await fsPromises.readFile(torneosFilePath, 'utf8');
        const torneos = JSON.parse(torneosData);
        const torneo = torneos.find(t => t.torneo_id === id);

        // 3.1 Verificar que el torneo esté en estado de inscripción abierta (estado = 2)
        if (torneo.estado === 2) {
            return res.status(400).json({
                error: 'No se pueden agregar participantes a un torneo que no está en estado de inscripción abierta'
            });
        }

        //4. Leer o crear archivo de participantes
        const participantesPath = path.join(dataPath, id, `participantes-${id}.json`);

        // Asegurarse de que el directorio del torneo exista
        const torneoDir = path.join(dataPath, id);
        if (!fs.existsSync(torneoDir)) {
            await fsPromises.mkdir(torneoDir, { recursive: true });
        }

        // Si no existe, crear estructura inicial ej: '{"torneo_id": "00", "participantes": [}}'
        if (!fs.existsSync(participantesPath)) {
            await fsPromises.writeFile(
                participantesPath,
                JSON.stringify({ torneo_id: id, participantes: [] }, null, 2),
                'utf8'
            );
        }

        const data = await fsPromises.readFile(participantesPath, 'utf8');
        const participantesData = JSON.parse(data);

        // 5. Verificar estructura y si el participante ya existe
        if (!participantesData.participantes || !Array.isArray(participantesData.participantes)) {
            return res.status(500).json({ error: 'Estructura de archivo de participantes inválida' });
        }

        const participantes = participantesData.participantes;

        // 5.1 Verificar límite y si el participante ya existe
        if (participantes.length >= torneo.nro_participantes) {
            return res.status(400).json({ error: 'Límite de participantes alcanzado para el torneo' });
        }

        const nombreExiste = participantes.some(
            p => p.nombre.toLowerCase() === nombre.trim().toLowerCase()
        );

        if (nombreExiste) {
            return res.status(409).json({ error: 'Participante ya existe en el torneo' });
        }

        // 5.2 Crear clave única para el participante y hashearla
        const participante_key = generarClave();
        const user_key_hashed = await bcrypt.hash(participante_key, 10);

        // 6. Agregar participante
        const participanteId = String(participantes.length + 1).padStart(4, '0');

        const participanteAgregar = {
            id: participanteId,
            nombre: nombre.trim(),
            participante_key_hashed: user_key_hashed,
            creado_en: new Date().toISOString(),
            partidos_jugados: 0,
            ganados: 0,
            empatados: 0,
            perdidos: 0,
            puntos: 0
        };
        participantesData.participantes.push(participanteAgregar);

        // 7. Guardar archivo actualizado
        await fsPromises.writeFile(
            participantesPath,
            JSON.stringify(participantesData, null, 2),
            'utf8'
        );

        // 8. Responder con éxito
        res.status(201).json({
            message: 'Participante registrado con éxito',
            torneo_id: id,
            participante_id: participanteId,
            participante_key: participante_key,
            nombre: nombre.trim()
        });

    } catch (error) {
        next(error);
    }
});

// V. Eliminar participante de un torneo
app.delete('/api/torneos/:id/participantes/:participanteId', async (req, res, next) => {
    try {
        const { id, participanteId } = req.params;

        // 1. Validar que sea un string válido
        if (!participanteId || typeof participanteId !== 'string' || participanteId.trim() === '') {
            return res.status(400).json({
                error: 'ID de participante inválido',
                participante_id_recibido: participanteId
            });
        }

        // 2. Leer archivo de participantes
        const participantesPath = path.join(dataPath, id, `participantes-${id}.json`);

        // 3. Verificar si el archivo existe
        if (!fs.existsSync(participantesPath)) {
            return res.status(404).json({
                error: 'Archivo de participantes no encontrado',
                torneo_id: id
            });
        }

        // 4. Leer y parsear archivo
        const data = await fsPromises.readFile(participantesPath, 'utf8');
        const participantesData = JSON.parse(data);

        // 5. Validar estructura
        if (!participantesData.participantes || !Array.isArray(participantesData.participantes)) {
            return res.status(500).json({ error: 'Estructura de archivo de participantes inválida' });
        }

        //6. Buscar participante
        const participantes = participantesData.participantes;
        const indice = participantes.findIndex(p => p.id === participanteId);

        if (indice === -1) {
            return res.status(404).json({
                error: 'Participante no encontrado en el torneo',
                torneo_id: id,
                participante_id: participanteId
            });
        }

        //7. Eliminar participante
        const participanteEliminado = participantes.splice(indice, 1)[0];

        //8. Guardar archivo actualizado
        await fsPromises.writeFile(
            participantesPath,
            JSON.stringify(participantesData, null, 2),
            'utf8'
        );

        //9. Responder con éxito
        res.json({
            message: 'Participante eliminado con éxito',
            torneo_id: id,
            participante_id: participanteId,
            nombre: participanteEliminado.nombre
        });
    } catch (error) {
        next(error);
    }
});





// VI. Actualizar datos de un participante (nombre, partidas, ganadas, perdidas, empatadas, puntos)


//5.2 Rutas para servir imágenes
// 5.2.1 Imágenes específicas de torneos
app.get('/api/imagenes/torneos/:id/:archivo', (req, res, next) => {
    try {
        const { id, archivo } = req.params;

        // 1. Validación de seguridad
        if (id.includes('..') || archivo.includes('..')) {
            return res.status(400).send('Ruta inválida');
        }

        // 2. Construir path del archivo
        const imagePath = path.join(dataPath, id, archivo);

        // 3. Verificar existencia del archivo
        if (!fs.existsSync(imagePath)) {
            return res.status(404).send('Imagen no encontrada');
        }

        // 4. Validar extensión de archivo
        const respuestaImagen = validarImagenTorneo({ name: archivo });

        if (!respuestaImagen.valido) {
            return res.status(400).send(respuestaImagen.error);
        }

        // 5. Enviar archivo
        res.sendFile(imagePath);
    } catch (error) {
        console.error('ERROR en GET /api/imagenes/torneos/:id/:archivo:', error);
        next(error);
    }
});

// 5.2.2 Imágenes comunes (banner, logos generales, etc.)
// GET /api/imagenes/Banner-fondo.png → data/images/Banner-fondo.png
app.use('/api/imagenes', express.static(path.join(dataPath, 'images')));

//5.2.3 Subir imágen de torneo
app.post('/api/imagenes/torneos/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validar que se haya enviado un archivo
        if (!req.files || !req.files.imagen) {
            return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });
        }

        const imagen = req.files.imagen;

        // 2. Validar tipo de archivo
        const respuestaImagen = validarImagenTorneo(imagen);
        if (!respuestaImagen.valido) {
            return res.status(400).json({ error: respuestaImagen.error });
        }

        //3. Validar que el torneo exista
        const torneosPath = path.join(dataPath, 'torneos.json');
        const torneosData = await fsPromises.readFile(torneosPath, 'utf8');
        const torneos = JSON.parse(torneosData);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({ error: 'Torneo no encontrado', torneo_id: id });
        }

        // 4. Normalizar nombre de archivo para evitar problemas
        const nombreNormalizado = imagen.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-\.]/g, '');

        // 5. Crear directorio del torneo si no existe directorio
        const torneoDir = path.join(dataPath, id);
        if (!fs.existsSync(torneoDir)) {
            await fsPromises.mkdir(torneoDir, { recursive: true });
        }

        const imagenPath = path.join(torneoDir, nombreNormalizado);

        // 6. Si el torneo ya tiene una imagen personalizada, eliminarla
        // Falta verificar el token admin en caso de que se esté subiendo una imagen de reemplazo.
        if (torneo.portadaURL && torneo.portadaURL.includes(`/torneos/${id}/`)) {
            const nombreImagenAnterior = path.basename(torneo.portadaURL);
            const imagenExistentePath = path.join(torneoDir, nombreImagenAnterior);
            if (fs.existsSync(imagenExistentePath)) {
                await fsPromises.unlink(imagenExistentePath);
            }
        }

        // 7. Usar mv() de express-fileupload para mover el archivo
        await imagen.mv(imagenPath);

        // 8. Actualizar referencia en el objeto del torneo
        torneo.portadaURL = `/api/imagenes/torneos/${id}/${nombreNormalizado}`;
        await fsPromises.writeFile(torneosPath, JSON.stringify(torneos, null, 2), 'utf8');

        res.status(201).json({ message: 'Imagen subida con éxito', torneo_id: id, archivo: nombreNormalizado, url: `/api/imagenes/torneos/${id}/${nombreNormalizado}` });
    } catch (error) {
        next(error)
    }
});

//5.2.4 Validar imagen de torneo
function validarImagenTorneo(imagen) {
    const extValidas = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
    const nombreArchivo = imagen.name || imagen;
    const ext = path.extname(nombreArchivo).toLowerCase();

    if (!extValidas.includes(ext)) {
        return { valido: false, error: 'Formato de imagen inválido' };
    }
    // Tamaño máximo 5MB
    if (imagen.size !== undefined) {
        const maxSize = 5 * 1024 * 1024;
        if (imagen.size > maxSize) {
            return { valido: false, error: 'Imagen excede el tamaño máximo de 5MB' };
        }
    }

    return { valido: true };
}


//5.3 Rutas para servir páginas HTML específicas
// (No necesario, pero recomendado para claridad y posterior control).

//5.3.1 Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

//5.3.2 Catálogo de torneos
app.get('/torneosCatalogo', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneosCatalogo.html'));
});

//5.3.2 Vista de torneo individual
app.get('/torneoView', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneoView.html'));
});

//5.3.3 Página de contacto
app.get('/contacto', (req, res) => {
    res.sendFile(path.join(pagesPath, 'contacto.html'));
});

//5.4 Ruta comodín (fallback SPA) para otras páginas HTML
app.use((req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    if (req.accepts('html')) {
        return res.sendFile(path.join(pagesPath, 'index.html'));
    }

    res.status(404).json({ error: 'Recurso no encontrado' });
});

//5.5 Manejador de errores genérico
app.use((err, req, res, next) => {
    console.error(err.stack);

    // Determinar código de estado y mensaje
    const statusCode = err.status || 500;
    const response = {
        error: err.message || 'Error interno del servidor',
        timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(response);
});


// 6. INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✓ Archivos públicos en: ${publicPath}`);
    console.log(`✓ Archivos de datos en: ${dataPath}`);
    console.log(`✓ Páginas HTML en: ${pagesPath}`);
    console.log(`✓ JWT Secret: ${JWT_SECRET}`);
    console.log(`\n✓ Presiona Ctrl+C para detener el servidor`);
});