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
const publicPath = path.join(__dirname, 'public');
const pagesPath = path.join(publicPath, 'pages');
const dataPath = path.join(__dirname, 'data');

// 4. LOGGING MIDDLEWARE (para debugging)
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// 5. MIDDLEWARE Y RUTAS
// 5.1 Servir archivos estáticos desde 'public' (scripts, styles, components)
app.use(express.static(publicPath));

// 5.2 Servir imágenes comunes desde /data/images
app.use('/data/images', express.static(path.join(dataPath, 'images')));

// 5.3 API: obtener lista completa de torneos ! ROTO
app.get('/api/torneos', (req, res) => {
    try {
        const filePath = path.join(dataPath, 'torneos.json');
        const data = fs.readFileSync(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error("Error al leer torneos.json:", error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 5.4 API: obtener datos específicos de un torneo (participantes, partidos, etc.) ! ROTO
app.get('/data/:id/:recurso', (req, res) => {
    try {
        const { id, recurso } = req.params;
        const fileName = `${recurso}-${id}.json`;
        const filePath = path.join(dataPath, id, fileName);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Recurso no encontrado' });
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);
        console.log(`Enviando datos de ${recurso} para el torneo ${id}`);
        console.log(`Ruta del archivo: ${filePath}`);
        console.log(jsonData);
        
        res.json(jsonData);
    } catch (error) {
        console.error(`Error al leer ${req.params.recurso}:`, error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 5.5 Servir imágenes específicas de torneos desde /data/:torneoId/:imagen ! ROTO
app.get('/data/:torneoId/:imagen', (req, res) => {
    const { torneoId, imagen } = req.params;
    
    if (torneoId.includes('..') || imagen.includes('..')) {
        return res.status(400).send('Ruta inválida');
    }
    
    const imagePath = path.join(dataPath, torneoId, imagen);
    
    if (fs.existsSync(imagePath)) {
        return res.sendFile(imagePath);
    }
    
    res.status(404).send('Imagen no encontrada');
});

// 5.6 Ruta principal - index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

// 5.7 Rutas específicas para páginas HTML
app.get('/torneosCatalogo', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneosCatalogo.html'));
});

app.get('/torneoView.html', (req, res) => {
    res.sendFile(path.join(pagesPath, 'torneoView.html'));
});

app.get('/contacto', (req, res) => {
    res.sendFile(path.join(pagesPath, 'contacto.html'));
});

// 5.8 Ruta comodín para otras páginas HTML (mantener compatibilidad)
app.get('/:page.html', (req, res, next) => {
    const pageFile = path.join(pagesPath, `${req.params.page}.html`);
    
    if (fs.existsSync(pageFile)) {
        return res.sendFile(pageFile);
    }
    
    next();
});

// 5.9 Fallback SPA (para navegación sin recargar)
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();

    if (req.accepts('html')) {
        return res.sendFile(path.join(pagesPath, 'index.html'));
    }
    
    res.status(404).send('Recurso no encontrado');
});

// 6. INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`✓ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`✓ Archivos estáticos desde: ${publicPath}`);
    console.log(`✓ Datos desde: ${dataPath}`);
});