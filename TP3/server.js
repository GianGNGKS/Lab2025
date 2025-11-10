// ! FALTA ARREGLAR ALGUNOS ERRORES JIJOOOOO
// ! Lo básico funciona, pero hay detalles que mejorar


// 1. IMPORTS
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
//import helmet from 'helmet';
//import rateLimit from 'express-rate-limit';

// 2. CONFIGURACIÓN BÁSICA 
const app = express();
const PORT = 4000;

// 3. PATHS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 3.1 Paths importantes
const publicPath = path.join(__dirname, 'public');
const dataPath = path.join(__dirname, 'data');
const pagesPath = path.join(publicPath, 'pages');

//4. MIDDLEWARE (ANTES DE RUTAS)
//4.1 Seguridad básica con Helmet
//app.use(helmet());

//4.2 Limitar tasa de peticiones (Rate Limiting)
// const apiLimiter = rateLimit({
//     windowMs: 15 * 60 * 1000, // 15 minutos
//     max: 100,
//     message: { error: 'Demasiadas peticiones, intenta más tarde' }
// });
// app.use('/api/', apiLimiter);

//4.3 Logging simple de peticiones
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next(); // * Permite continuar a la siguiente función middleware o ruta
});

//4.4 Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

//4.5 Middleware para servir archivos estáticos
//EJ: /styles/main.css → public/styles/main.css
app.use(express.static(publicPath));

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

        // Validación basica
        if (!nuevoTorneo || typeof nuevoTorneo !== 'object') {
            return res.status(400).json({ error: 'Datos de torneo inválidos' });
        }

        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);

        //generar ID simple único no usado (para simplicidad)
        let nuevoId;
        do {
            nuevoId = `${Math.floor(Math.random() * 10000)}`;
        } while (torneos.some(t => t.torneo_id === nuevoId));

        nuevoTorneo.torneo_id = nuevoId;
        torneos.push(nuevoTorneo);
        await fsPromises.writeFile(filePath, JSON.stringify(torneos, null, 2), 'utf8');

        res.status(201).json({ message: 'Torneo creado', torneo_id: nuevoId });
    } catch (error) {
        next(error);
    }
});

// II. Actualizar torneo existente
app.put('/api/torneos', async (req, res, next) => {
    try {
        const { id } = req.params;
        const datosActualizados = req.body;

        if (!datosActualizados || typeof datosActualizados !== 'object') {
            return res.status(400).json({ error: 'Datos de torneo inválidos' });
        }

        const filePath = path.join(dataPath, 'torneos.json');
        const data = await fsPromises.readFile(filePath, 'utf8');
        const torneos = JSON.parse(data);
        const indice = torneos.findIndex(t => t.torneo_id === id);

        if (indice === -1) {
            return res.status(404).json({ error: 'Torneo no encontrado', torneo_id: id });
        }

        torneos[indice] = { ...torneos[indice], ...datosActualizados, torneo_id: id };
        await fsPromises.writeFile(filePath, JSON.stringify(torneos, null, 2), 'utf8');

        res.json({ message: 'Torneo actualizado', torneo_id: id });
    } catch (error) {
        next(error);
    }
});

// III. Eliminar torneo
app.delete('/api/torneos/:id', async (req, res, next) => {
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
            message: 'Torneo eliminado exitosamente',
            torneo_id: id,
            nombre: torneoEliminado.nombre
        });

    } catch (error) {
        next(error);
    }
});

// CRUD de participantes y partidos podría implementarse de manera similar,
// primero, pero se omite por motivos de testing y simplicidad.


//5.2 Rutas para servir imágenes

// 5.2.1 Imágenes comunes (banner, logos generales, etc.)
// GET /imagenes/Banner-fondo.png → data/images/Banner-fondo.png
app.use('/imagenes', express.static(path.join(dataPath, 'images')));

// 5.2.2 Imágenes específicas de torneos
app.get('/imagenes/torneos/:id/:archivo', (req, res, next) => {
    try {
        const { id, archivo } = req.params;

        // Validación de seguridad
        if (id.includes('..') || archivo.includes('..')) {
            return res.status(400).send('Ruta inválida');
        }

        // Validar extensión de archivo
        const extValidas = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];
        const ext = path.extname(archivo).toLowerCase();
        if (!extValidas.includes(ext)) {
            return res.status(400).send('Formato de imagen inválido');
        }

        const imagePath = path.join(dataPath, id, archivo);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).send('Imagen no encontrada');
        }

        res.sendFile(imagePath);
    } catch (error) {
        next(error);
    }
});

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

app.get('/torneoEdit', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneoEdit.html'));
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
    console.log(`\n✓ Presiona Ctrl+C para detener el servidor`);
});