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

//4.3 Middleware para manejo de subida de archivos
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

//5.1.3 Función para validar la estructura de recurso (participantes, partidos, etc...)
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

// 5.1.4 ruta para obtener los torneos paginados
app.get('/api/torneos-limitados', async (req, res, next) => {

    try {
        const indice = parseInt(req.query.index) - 1 || 0;
        const limite = parseInt(req.query.limite) || 5;

        // 1. Validar parámetros
        if (indice < 0 || limite <= 0) {
            return res.status(400).json({ error: 'Parámetros inválidos. "index" debe ser >= 0 y "limite" debe ser > 0.' });
        }

        // 2. Leer archivo de torneos
        const filePath = path.join(dataPath, 'torneos.json');
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                error: 'Archivo de torneos no encontrado'
            });
        }
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const totalTorneos = torneos.length;

        //3. Validar que el índice no exceda la cantidad de torneos
        if (indice >= totalTorneos && totalTorneos > 0) {
            return res.status(400).json({
                error: 'Índice fuera de rango',
                index_solicitado: indice + 1,
                total_torneos: totalTorneos
            });
        }

        //4. Calcular torneos paginados
        const torneosPaginados = torneos.slice(indice, indice + limite);

        //5. Responder con los torneos paginados y metadatos
        res.json({
            data: torneosPaginados,
            paginacion: {
                total_torneos: totalTorneos,
                indice_solicitado: indice + 1,
                limite: limite
            }
        });

    } catch (error) {
        next(error);
    }
});

// 5.1.2.1 Imágenes portadas de torneos
app.get('/api/torneos/:id/portada', async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Leer torneo para obtener portadaURL
        const torneosPath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(torneosPath)) {
            return res.status(404).json({ error: 'Archivo de torneos no encontrado' });
        }

        const torneosData = await fsPromises.readFile(torneosPath, 'utf8');
        const torneos = JSON.parse(torneosData);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        // 2. Si usa imagen por defecto, redirigir
        if (!torneo.portadaURL || torneo.portadaURL.includes('/api/imagenes/Banner-fondo.png')) {
            return res.redirect('/api/imagenes/Banner-fondo.png');
        }

        // 3. Si tiene imagen personalizada, buscarla en el directorio del torneo
        const torneoDir = path.join(dataPath, id);

        if (!fs.existsSync(torneoDir)) {
            return res.redirect('/api/imagenes/Banner-fondo.png');
        }

        // 4. Buscar cualquier imagen de portada en el directorio
        const archivos = await fsPromises.readdir(torneoDir);
        const imagenPortada = archivos.find(archivo =>
            archivo.startsWith('portada-') &&
            validarImagenTorneo({ name: archivo }).valido
        );

        if (!imagenPortada) {
            return res.redirect('/api/imagenes/Banner-fondo.png');
        }

        // 5. Enviar imagen
        const imagePath = path.join(torneoDir, imagenPortada);
        res.sendFile(imagePath);

    } catch (error) {
        next(error);
    }
});

//5.1.2.1 Subir imágen de torneo
app.post('/api/torneos/:id/portada', verificarTokenAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;

        // 1. Validar archivo
        if (!req.files || !req.files.imagen) {
            return res.status(400).json({ error: 'No se ha enviado ninguna imagen' });
        }

        const imagen = req.files.imagen;

        // 2. Validar tipo y tamaño
        const respuestaImagen = validarImagenTorneo(imagen);
        if (!respuestaImagen.valido) {
            return res.status(400).json({ error: respuestaImagen.error });
        }

        // 3. Verificar que el torneo existe
        const torneosPath = path.join(dataPath, 'torneos.json');
        const torneosData = await fsPromises.readFile(torneosPath, 'utf8');
        const torneos = JSON.parse(torneosData);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        // 4. Crear directorio del torneo si no existe
        const torneoDir = path.join(dataPath, id);
        if (!fs.existsSync(torneoDir)) {
            await fsPromises.mkdir(torneoDir, { recursive: true });
        }

        // 5. Nombre estandarizado (portada-{id}.{ext})
        const extension = path.extname(imagen.name).toLowerCase();
        const nombreNormalizado = `portada-${id}${extension}`;
        const imagenPath = path.join(torneoDir, nombreNormalizado);

        // 6. Eliminar imagen anterior si existe
        const archivos = await fsPromises.readdir(torneoDir);
        const imagenesAnteriores = archivos.filter(archivo =>
            archivo.startsWith('portada-') &&
            archivo !== nombreNormalizado
        );

        for (const imagenAnterior of imagenesAnteriores) {
            await fsPromises.unlink(path.join(torneoDir, imagenAnterior));
        }

        // 7. Guardar nueva imagen
        await imagen.mv(imagenPath);

        // 8. Actualizar torneo con URL estandarizada
        torneo.portadaURL = `/api/torneos/${id}/portada`;
        await fsPromises.writeFile(torneosPath, JSON.stringify(torneos, null, 2), 'utf8');

        res.status(200).json({
            message: 'Portada actualizada con éxito',
            url: torneo.portadaURL
        });

    } catch (error) {
        next(error);
    }
});

//5.1.4 Validar imagen de torneo
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

// 5.1.2.3 Ruta para obtener recursos específicos de un torneo
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

        // Genera un ID simple único
        let nuevoId;
        do {
            nuevoId = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
        } while (torneos.some(t => t.torneo_id === nuevoId));
        nuevoTorneo.torneo_id = nuevoId;

        // Genera una clave de admin simple
        const admin_key = generarClave();

        // Hashea la clave del admin
        const admin_key_hashed = await bcrypt.hash(admin_key, 10);
        nuevoTorneo.admin_key_hashed = admin_key_hashed;
        nuevoTorneo.creado_en = new Date().toISOString();

        torneos.push(nuevoTorneo);
        await fsPromises.writeFile(filePath, JSON.stringify(torneos, null, 2), 'utf8');
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

/** 
* Función para validar los datos de un torneo.
* @param { object } torneo - Objeto con los datos del torneo a validar.
* @param { boolean } esActualizacion - Indica si es una actualización(true) o creación(false).
* @returns { object } Objeto con propiedad 'valido'(boolean) y 'errores'(array de strings).
*/
function validarDatosTorneo(torneo, esActualizacion) {
    const errores = [];

    // 1. Valida que el objeto torneo sea válido
    if (!torneo || typeof torneo !== 'object') {
        return { valido: false, errores: ['Formato de torneo inválido.'] };
    }

    // 2. Valida los campos requeridos (solo si es creación)
    if (!esActualizacion) {
        const camposRequeridos = ['nombre', 'disciplina', 'formato', 'organizador', 'estado', 'nro_participantes'];
        camposRequeridos.forEach(campo => {
            if (!torneo.hasOwnProperty(campo)) {
                errores.push(`Campo requerido faltante: ${campo}\n`);
            }
        });
    }

    // 3. Validación de tipos de datos
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

// II. Verifica clave admin y obtiene token
app.post('/api/torneos/:id/auth/admin', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { admin_key } = req.body;

        if (!admin_key || typeof admin_key !== 'string') {
            return res.status(400).json({ error: 'Clave admin inválida' });
        }

        // 1. Lee el archivo de torneos
        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({ error: 'Torneo no encontrado', torneo_id: id });
        }

        // 2. Verifica la clave
        if (!torneo.admin_key_hashed) {
            return res.status(500).json({ error: 'Torneo sin clave admin configurada' });
        }

        const esValida = await bcrypt.compare(admin_key, torneo.admin_key_hashed);

        if (!esValida) {
            return res.status(401).json({ error: 'Clave admin incorrecta' });
        }

        const token = jwt.sign({ torneo_id: id, role: 'admin' }, JWT_SECRET, { expiresIn: '2h' });

        res.json({ valid: true, message: 'Clave verificada', token, expires_in: '2 horas' });

    } catch (error) {
        next(error);
    }
});

// III. Verifica la clave del participante
app.post('/api/torneos/:id/auth/participante', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { participante_key } = req.body;

        if (!participante_key || typeof participante_key !== 'string') {
            return res.status(400).json({ error: 'Clave participante inválida' });
        }

        // 1. Lee el archivo de participantes
        const filePath = path.join(dataPath, id, `participantes-${id}.json`);
        const data = await fsPromises.readFile(filePath, 'utf8');
        const participantesData = JSON.parse(data);

        // 2. Verifica la estructura
        const validacion = validarEstructuraRecurso(participantesData, 'participantes');

        if (!validacion.valido) {
            return res.status(validacion.codigo).json({ error: validacion.error });
        }

        // 3. Busca el participante con la clave hasheada que coincida
        const participante = participantesData.participantes.find(p => p.participante_key_hashed &&
            bcrypt.compareSync(participante_key, p.participante_key_hashed));

        if (!participante) {
            return res.status(401).json({ error: 'Clave participante incorrecta' });
        }

        return res.json({ valid: true, message: 'Clave participante verificada', participante_id: participante.id, nombre: participante.nombre });
    } catch (error) {
        next(error);
    }
});

// IV. Middleware para verificar token JWT en rutas protegidas
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
        return res.status(500).json({
            error: 'Error al verificar token.'
        });
    }
}

// V. Actualizar torneo existente
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

// VI. Eliminar torneo
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

// VII. Agregar participante a un torneo
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
        if (torneo.estado !== 0) {
            return res.status(400).json({
                error: 'No se pueden agregar participantes a un torneo que no está en estado de inscripción abierta'
            });
        }

        //4. Leer o crear archivo de participantes
        const participantesPath = path.join(dataPath, id, `participantes-${id}.json`);

        // 5.Asegurarse de que el directorio del torneo exista
        const torneoDir = path.join(dataPath, id);
        if (!fs.existsSync(torneoDir)) {
            await fsPromises.mkdir(torneoDir, { recursive: true });
        }

        // 5.1 Si no existe, crear estructura inicial
        if (!fs.existsSync(participantesPath)) {
            await fsPromises.writeFile(
                participantesPath,
                JSON.stringify({ torneo_id: id, participantes: [] }, null, 2),
                'utf8'
            );
        }

        const data = await fsPromises.readFile(participantesPath, 'utf8');
        const participantesData = JSON.parse(data);

        // 6. Verificar estructura y si el participante ya existe
        if (!participantesData.participantes || !Array.isArray(participantesData.participantes)) {
            return res.status(500).json({ error: 'Estructura de archivo de participantes inválida' });
        }

        const participantes = participantesData.participantes;

        // 6.1 Verificar límite y si el participante ya existe
        if (participantes.length >= torneo.nro_participantes) {
            return res.status(400).json({ error: 'Límite de participantes alcanzado para el torneo' });
        }

        const nombreExiste = participantes.some(
            p => p.nombre.toLowerCase() === nombre.trim().toLowerCase()
        );

        if (nombreExiste) {
            return res.status(409).json({ error: 'Participante ya existe en el torneo' });
        }

        // 6.2 Crear clave única para el participante y hashearla
        const participante_key = generarClave();
        const user_key_hashed = await bcrypt.hash(participante_key, 10);

        // 7. Agregar participante
        let participanteId;
        if (participantes.length === 0) {
            participanteId = "0001";
        } else {
            // Obtener el ID numérico más alto y sumar 1
            const maxId = Math.max(...participantes.map(p => parseInt(p.id, 10)));
            participanteId = String(maxId + 1).padStart(4, '0');
        }

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

        // 8. Guardar archivo actualizado
        await fsPromises.writeFile(
            participantesPath,
            JSON.stringify(participantesData, null, 2),
            'utf8'
        );

        // 9. Responder con éxito
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

// VIII. Eliminar participante de un torneo
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

//IX. POSTEAR PARTIDO (agregar partido a un torneo)
app.post('/api/torneos/:id/partidos', verificarTokenAdmin, async (req, res, next) => {
    try {
        //1. Obtener ID del torneo y cuerpo del partido
        const { id } = req.params;
        const datosPartido = req.body;

        //2. Validar datos del partido
        const validacion = await validarDatosPartido(datosPartido, id);

        if (!validacion.valido) {
            return res.status(400).json({
                error: 'Datos de partido inválidos',
                detalles: validacion.errores
            });
        }

        //3. Leer o crear archivo de partidos
        const partidosPath = path.join(dataPath, id, `partidos-${id}.json`);

        //3.1 Asegurar que el directorio existe
        const torneoDir = path.join(dataPath, id);
        if (!fs.existsSync(torneoDir)) {
            await fsPromises.mkdir(torneoDir, { recursive: true });
        }

        if (!fs.existsSync(partidosPath)) {
            await fsPromises.writeFile(
                partidosPath,
                JSON.stringify({ torneo_id: id, partidos: [] }, null, 2),
                'utf8'
            );
        }

        const data = await fsPromises.readFile(partidosPath, 'utf8');
        const partidosData = JSON.parse(data);
        const partidos = partidosData.partidos;

        //4. Generar ID único para el partido
        let partidoId;
        if (partidos.length === 0) {
            partidoId = "0001";
        } else {
            const maxId = Math.max(...partidos.map(p => parseInt(p.partido_id, 10)));
            partidoId = String(maxId + 1).padStart(4, '0');
        }

        //5. Crear objeto partido con estructura correcta
        const nuevoPartido = {
            partido_id: partidoId,
            participante1_id: datosPartido.participante1_id,
            participante2_id: datosPartido.participante2_id,
            fecha: datosPartido.fecha,
            jugado_en: datosPartido.jugado_en || '',
            resultado1: parseInt(datosPartido.resultado1) || 0,
            resultado2: parseInt(datosPartido.resultado2) || 0
        };

        //6. Agregar partido
        partidosData.partidos.push(nuevoPartido);

        //7. Guardar archivo actualizado
        await fsPromises.writeFile(
            partidosPath,
            JSON.stringify(partidosData, null, 2),
            'utf8'
        );

        //8. Actualizar estadísticas de participantes si el partido fue jugado
        if (nuevoPartido.resultado1 !== null && nuevoPartido.resultado2 !== null) {
            await recalcularEstadisticasCompletas(id);
        }

        //9. Responder con éxito
        res.status(201).json({
            message: 'Partido agregado con éxito',
            torneo_id: id,
            partido_id: partidoId,
            partido: nuevoPartido
        });

    } catch (error) {
        next(error);
    }
});

async function validarDatosPartido(partido, idTorneo) {
    const errores = [];

    //1. Validar que el objeto partido sea válido
    if (!partido || typeof partido !== 'object') {
        return { valido: false, errores: ['Formato de partido inválido.'] };
    }

    //2. Validar campos requeridos
    const camposRequeridos = ['participante1_id', 'participante2_id', 'fecha'];
    camposRequeridos.forEach(campo => {
        if (!partido.hasOwnProperty(campo)) {
            errores.push(`Campo requerido faltante: ${campo}\n`);
        }
    });

    //3. Validación de tipos de datos
    const tiposEsperados = {
        participante1_id: 'string',
        participante2_id: 'string',
        fecha: 'string'
    };

    //3.1 Validar tipos
    Object.entries(tiposEsperados).forEach(([campo, tipo]) => {
        if (partido.hasOwnProperty(campo) && typeof partido[campo] !== tipo) {
            errores.push(`Tipo inválido para campo "${campo}". Se esperaba ${tipo}.\n`);
        }
    });

    //3.2 Validar resultado1 y resultado2 si están presentes
    if (partido.hasOwnProperty('resultado1') || partido.hasOwnProperty('resultado2')) {
        // Si uno está presente, ambos deben estarlo
        if (!partido.hasOwnProperty('resultado1') || !partido.hasOwnProperty('resultado2')) {
            errores.push('Si se provee resultado, ambos resultado1 y resultado2 son obligatorios.\n');
        } else {
            // Validar que sean números
            const res1 = partido.resultado1;
            const res2 = partido.resultado2;

            // Permitir strings que representen números o números directos
            const res1Num = typeof res1 === 'string' ? parseInt(res1) : res1;
            const res2Num = typeof res2 === 'string' ? parseInt(res2) : res2;

            if (isNaN(res1Num) || isNaN(res2Num)) {
                errores.push('resultado1 y resultado2 deben ser números válidos.\n');
            }

            if (res1Num < 0 || res2Num < 0) {
                errores.push('Los resultados no pueden ser negativos.\n');
            }
        }
    }

    //4. Validar participantes existentes (diferentes)
    if (partido.participante1_id === partido.participante2_id) {
        errores.push('Los participantes del partido deben ser diferentes.\n');
    }

    //5 Verificar si participantes existen en el torneo
    if (!partido.participante1_id || partido.participante1_id.trim() === '' ||
        !partido.participante2_id || partido.participante2_id.trim() === '') {
        errores.push('Los IDs de los participantes no pueden estar vacíos.\n');
    }

    //5.1 Traigo torneo y participantes para validar existencia
    const participantesPath = path.join(dataPath, idTorneo, `participantes-${idTorneo}.json`);
    if (!fs.existsSync(participantesPath)) {
        errores.push('Archivo de participantes no encontrado para validar IDs.\n');
    } else {
        const data = await fsPromises.readFile(participantesPath, 'utf8');
        const participantesData = JSON.parse(data);
        const participantes = participantesData.participantes;

        const participante1Existe = participantes.some(p => p.id === partido.participante1_id);
        const participante2Existe = participantes.some(p => p.id === partido.participante2_id);

        if (!participante1Existe) {
            errores.push(`Participante 1 con ID "${partido.participante1_id}" no encontrado en el torneo.\n`);
        }
        if (!participante2Existe) {
            errores.push(`Participante 2 con ID "${partido.participante2_id}" no encontrado en el torneo.\n`);
        }
    }
    return { valido: errores.length === 0, errores };
}

//X. Actualizar partido de un torneo
app.put('/api/torneos/:id/partidos/:partidoId', verificarTokenAdmin, async (req, res, next) => {
    try {
        //1. Obtener IDs y datos actualizados
        const { id, partidoId } = req.params;
        const datosActualizados = req.body;

        //2. Leer archivo de partidos
        const partidosPath = path.join(dataPath, id, `partidos-${id}.json`);
        if (!fs.existsSync(partidosPath)) {
            return res.status(404).json({
                error: 'Archivo de partidos no encontrado',
                torneo_id: id
            });
        }

        //3. Leer y parsear archivo
        const data = await fsPromises.readFile(partidosPath, 'utf8');
        const partidosData = JSON.parse(data);
        const partidos = partidosData.partidos;

        //4. Buscar partido a actualizar
        const indice = partidos.findIndex(p => p.partido_id === partidoId);
        if (indice === -1) {
            return res.status(404).json({
                error: 'Partido no encontrado en el torneo',
                torneo_id: id,
                partido_id: partidoId
            });
        }

        //5. Validar solo los campos que se están actualizando
        if (datosActualizados.hasOwnProperty('resultado1') || datosActualizados.hasOwnProperty('resultado2')) {
            if (!datosActualizados.hasOwnProperty('resultado1') || !datosActualizados.hasOwnProperty('resultado2')) {
                return res.status(400).json({
                    error: 'Ambos resultado1 y resultado2 son obligatorios al actualizar'
                });
            }

            const res1 = parseInt(datosActualizados.resultado1);
            const res2 = parseInt(datosActualizados.resultado2);

            if (isNaN(res1) || isNaN(res2)) {
                return res.status(400).json({
                    error: 'resultado1 y resultado2 deben ser números válidos'
                });
            }

            if (res1 < 0 || res2 < 0) {
                return res.status(400).json({
                    error: 'Los resultados no pueden ser negativos'
                });
            }
        }

        //6. Actualizar partido (mantener campos no editables)
        partidos[indice] = {
            ...partidos[indice],
            resultado1: datosActualizados.resultado1 !== undefined
                ? parseInt(datosActualizados.resultado1)
                : partidos[indice].resultado1,
            resultado2: datosActualizados.resultado2 !== undefined
                ? parseInt(datosActualizados.resultado2)
                : partidos[indice].resultado2,
            jugado_en: datosActualizados.jugado_en !== undefined
                ? datosActualizados.jugado_en
                : partidos[indice].jugado_en
        };

        //7. Guardar archivo actualizado
        await fsPromises.writeFile(
            partidosPath,
            JSON.stringify(partidosData, null, 2),
            'utf8'
        );

        //8. Actualizar estadísticas de participantes si el partido fue jugado
        if (partidos[indice].resultado1 !== null && partidos[indice].resultado2 !== null) {
            await recalcularEstadisticasCompletas(id);
        }

        //9. Responder con éxito
        res.json({
            message: 'Partido actualizado con éxito',
            torneo_id: id,
            partido_id: partidoId,
            partido: partidos[indice]
        });

    } catch (error) {
        next(error);
    }
});

//XI. Eliminar partido de un torneo
app.delete('/api/torneos/:id/partidos/:partidoId', verificarTokenAdmin, async (req, res, next) => {
    try {
        //1. Obtener IDs
        const { id, partidoId } = req.params;

        //2. Leer archivo de partidos
        const partidosPath = path.join(dataPath, id, `partidos-${id}.json`);
        if (!fs.existsSync(partidosPath)) {
            return res.status(404).json({
                error: 'Archivo de partidos no encontrado',
                torneo_id: id
            });
        }

        //3. Leer y parsear archivo
        const data = await fsPromises.readFile(partidosPath, 'utf8');
        const partidosData = JSON.parse(data);
        const partidos = partidosData.partidos;

        //4. Buscar partido a eliminar
        const indice = partidos.findIndex(p => p.partido_id === partidoId);
        if (indice === -1) {
            return res.status(404).json({
                error: 'Partido no encontrado en el torneo',
                torneo_id: id,
                partido_id: partidoId
            });
        }

        //5. Guardar referencia del partido antes de eliminarlo
        const partidoEliminado = partidos[indice];

        //6. Eliminar partido del array
        partidos.splice(indice, 1);

        //7. Guardar archivo actualizado
        await fsPromises.writeFile(
            partidosPath,
            JSON.stringify(partidosData, null, 2),
            'utf8'
        );

        //8. Restar estadísticas de participantes si el partido fue jugado
        await recalcularEstadisticasCompletas(id);

        //9. Responder con éxito
        res.json({
            message: 'Partido eliminado con éxito',
            torneo_id: id,
            partidoEliminado_id: partidoEliminado.partido_id,
            participante1_id: partidoEliminado.participante1_id,
            participante2_id: partidoEliminado.participante2_id,
            fecha: partidoEliminado.fecha
        });
    } catch (error) {
        next(error);
    }
});

//XII. Actualizar participantes después de un cambio en partidos (creación, eliminación o actualización)

/**
 * Recalcula TODAS las estadísticas de los participantes desde cero.
 * Lee todos los partidos y reconstruye las estadísticas.
 * @param {string} torneoId - ID del torneo
 */
async function recalcularEstadisticasCompletas(torneoId) {
    try {
        // 1. Leer participantes
        const participantesPath = path.join(dataPath, torneoId, `participantes-${torneoId}.json`);
        const participantesData = JSON.parse(await fsPromises.readFile(participantesPath, 'utf8'));
        const participantes = participantesData.participantes;

        // 2. Resetear todas las estadísticas a 0
        participantes.forEach(p => {
            p.partidos_jugados = 0;
            p.ganados = 0;
            p.empatados = 0;
            p.perdidos = 0;
            p.puntos = 0;
        });

        // 3. Leer TODOS los partidos
        const partidosPath = path.join(dataPath, torneoId, `partidos-${torneoId}.json`);

        // 3.1 Si no hay partidos, guardar y salir
        if (!fs.existsSync(partidosPath)) {
            await fsPromises.writeFile(
                participantesPath,
                JSON.stringify(participantesData, null, 2),
                'utf8'
            );
            return;
        }

        const partidosData = JSON.parse(await fsPromises.readFile(partidosPath, 'utf8'));
        const partidos = partidosData.partidos || [];

        // 4. Recalcular estadísticas partido por partido
        partidos.forEach(partido => {
            const p1 = participantes.find(p => p.id === partido.participante1_id);
            const p2 = participantes.find(p => p.id === partido.participante2_id);

            // Participante no encontrado (datos corruptos)
            if (!p1 || !p2) return;

            const res1 = parseInt(partido.resultado1) || 0;
            const res2 = parseInt(partido.resultado2) || 0;

            // Incrementar partidos jugados
            p1.partidos_jugados++;
            p2.partidos_jugados++;

            // Determinar resultado y actualizar stats
            if (res1 > res2) {
                // P1 ganó
                p1.ganados++;
                p1.puntos += 3;
                p2.perdidos++;
            } else if (res1 < res2) {
                // P2 ganó
                p2.ganados++;
                p2.puntos += 3;
                p1.perdidos++;
            } else {
                // Empate
                p1.empatados++;
                p2.empatados++;
                p1.puntos += 1;
                p2.puntos += 1;
            }
        });

        // 5. Guardar participantes con estadísticas actualizadas
        await fsPromises.writeFile(
            participantesPath,
            JSON.stringify(participantesData, null, 2),
            'utf8'
        );
    } catch (error) {
        console.error('Error al recalcular estadísticas completas:', error);
        throw error;
    }
}

//5.2 Rutas para servir imágenes

// 5.2.1 Imágenes comunes (banner, logos generales, etc.)
// GET /api/imagenes/Banner-fondo.png → data/images/Banner-fondo.png
app.use('/api/imagenes', express.static(path.join(dataPath, 'images')));

//5.3 Rutas para servir páginas HTML específicas
//5.3.1 Página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

//5.3.2 Catálogo de torneos
app.get('/torneosCatalogo', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneosCatalogo.html'));
});

//5.3.3 Vista de torneo individual
app.get('/torneoView', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneoView.html'));
});

//5.3.4 Página de contacto
app.get('/contacto', (req, res) => {
    res.sendFile(path.join(pagesPath, 'contacto.html'));
});

// 5.4. ARCHIVOS ESTÁTICOS (después de las rutas API)
app.use(express.static(path.join(__dirname, 'public')));

// 5.5 MANEJADOR DE ERRORES

//5.5.1 Manejador de errores genérico
app.use((err, req, res, next) => {
    console.error(err.stack);

    const statusCode = err.status || 500;
    const response = {
        error: err.message || 'Error interno del servidor',
        timestamp: new Date().toISOString()
    };

    res.status(statusCode).json(response);
});

// 5.6 CATCH-ALL
// Funciona como manejador para rutas no definidas.
app.use((req, res) => {
    // Si la ruta es de la API, responder con JSON 404
    if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Recurso no encontrado' });
    }

    // Para resto de rutas (SPA / páginas), reenviar al index.html
    return res.sendFile(path.join(pagesPath, 'index.html'));
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