// ! FALTA ARREGLAR ALGUNOS ERRORES JIJOOOOO
// ! Lo básico funciona, pero hay detalles que mejorar


// 1. IMPORTS
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.url}`);
    next(); // * Permite continuar a la siguiente función middleware o ruta
});

//4.1 Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

//4.2 MIddleware para servir archivos estáticos
// Sirve automáticamente archivos en public/
//EJ: /styles/main.css → public/styles/main.css
app.use(express.static(publicPath));

//5. RUTAS
// 5.1 Rutas GET
//5.1.1 API: obtener lista completa de torneos
app.get('/api/torneos', async (req, res) => {
    try {
        const filePath = path.join(dataPath, 'torneos.json');

        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo no encontrado' });
        }
        const data = fs.readFileSync(filePath, 'utf8');
        const torneos = JSON.parse(data);

        // Verificar si hay datos (! separar para claridad)
        if (!torneos || torneos.length === 0) {
            throw new Error('No hay torneos en torneos.json');
        }

        // Validar el formato
        if (!Array.isArray(torneos)) {
            throw new Error('Formato inválido: se esperaba un array de torneos');
        }

        // Enviar datos de torneos como JSON
        res.json(torneos);
    } catch (error) {
        console.error("! Error al leer torneos.json:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//5.1.2 API: obtener datos específicos de un torneo
app.get('/api/torneos/:id', (req, res) => {
    try {
        const id = req.params.id;

        // 1. Leer el archivo principal de torneos
        const filePath = path.join(dataPath, 'torneos.json');

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Archivo de torneos no encontrado' });
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const torneos = JSON.parse(data);

        // 2. Buscar el torneo por ID
        const torneo = torneos.find(t => t.torneo_id === id);

        if (!torneo) {
            return res.status(404).json({ error: 'Torneo no encontrado' });
        }

        // 3. Enviar datos del torneo como JSON
        res.json(torneo);

    } catch (error) {
        console.error(`Error al leer datos del torneo ${req.params.id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//5.1.3 obtener recursos específicos de un torneo (participantes, partidos, etc.)
app.get('/api/torneos/:id/:recurso', (req, res) => {
    try {
        // Leer el archivo específico del recurso solicitado
        const { id, recurso } = req.params;
        const fileName = `${recurso}-${id}.json`;
        const filePath = path.join(dataPath, id, fileName);

        // Verificar si el archivo existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }

        // Validar el recurso solicitado (no es array)
        if (Array.isArray(recurso)) {
            return res.status(400).json({ error: 'Recurso inválido' });
        }


        const data = fs.readFileSync(filePath, 'utf8');
        const recursoData = JSON.parse(data);

        res.json(recursoData);
    } catch (error) {
        console.error(`Error al leer ${req.params.recurso} del torneo ${req.params.id}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

//5.2 Rutas para servir imágenes

// 5.2.1 Imágenes comunes (banner, logos generales, etc.)
// GET /imagenes/Banner-fondo.png → data/images/Banner-fondo.png
app.use('/imagenes', express.static(path.join(dataPath, 'images')));

// 5.2.2 Imágenes específicas de torneos
app.get('/imagenes/torneos/:id/:archivo', (req, res) => {
    try {
        const { id, archivo } = req.params;

        // Validación de seguridad
        if (id.includes('..') || archivo.includes('..')) {
            return res.status(400).send('Ruta inválida');
        }

        const imagePath = path.join(dataPath, id, archivo);

        if (!fs.existsSync(imagePath)) {
            return res.status(404).send('Imagen no encontrada');
        }

        res.sendFile(imagePath);
    } catch (error) {
        console.error("Error al servir la imagen:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
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

//5.3.3 Página de contacto
app.get('/contacto', (req, res) => {
    res.sendFile(path.join(pagesPath, 'contacto.html'));
});

//5.4 Ruta comodín (fallback SPA) para otras páginas HTML
app.use((req, res, next) => {
    // Solo para peticiones GET
    if (req.method !== 'GET') {
        return next();
    }
    
    // Solo si el cliente acepta HTML
    if (req.accepts('html')) {
        return res.sendFile(path.join(pagesPath, 'index.html'));
    }
    
    // Si no es HTML, 404
    res.status(404).json({ error: 'Recurso no encontrado' });
});


// 6. INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✓ Archivos públicos en: ${publicPath}`);
    console.log(`✓ Archivos de datos en: ${dataPath}`);
    console.log(`✓ Páginas HTML en: ${pagesPath}`);
    console.log(`\n✓ Presiona Ctrl+C para detener el servidor`);
    
});