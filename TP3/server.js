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

// 4. MIDDLEWARE Y RUTAS
// 4.1 Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(publicPath));

// 4.2 API: obtener lista de torneos (lee d:/.../TP3/data/torneos.json dentro del proyecto)
const torneosDataPath = path.join(__dirname, 'data', 'torneos.json');
app.get('/api/torneos', (req, res) => {
    try {
        const data = fs.readFileSync(torneosDataPath, 'utf8');
        const torneos = JSON.parse(data);
        res.json(torneos);
    } catch (error) {
        console.error("Error al leer el archivo de torneos:", error);
        res.status(500).send('Error interno del servidor');
    }
});

// 4.3 Rutas específicas para páginas dentro de public/pages
app.get('/', (req, res) => {
    res.sendFile(path.join(pagesPath, 'index.html'));
});

// 4.4 servir cualquier archivo html dentro de public/pages vía /pages/<name>.html
app.get('/:page', (req, res, next) => {
    const pageFile = path.join(pagesPath, req.params.page);
    if (fs.existsSync(pageFile)) {
        return res.sendFile(pageFile);
    }
    next();
});

// 4.5Servir imágenes desde /data/images
app.use('/data/images', express.static(path.join(__dirname, 'data', 'images')));

// 4.6 evitar errores 404 en rutas no definidas para HTML
app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.accepts('html')) {
        return res.sendFile(path.join(pagesPath, 'index.html'));
    }
    next();
});

// 5. INICIAR SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});