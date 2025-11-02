import { encontrarDisciplinaJSON, encontrarEstadoJSON, formatearFecha } from "./utilities.js";

/**
 * @file Archivo encargado de manejar la obtención y renderización de datos relacionados a torneos.
 */

/**
 * Obtiene la lista completa de torneos.
 * Primero intenta recuperar los datos desde localStorage para mejorar el rendimiento.
 * Si no están en caché, los obtiene desde el archivo JSON y los guarda en localStorage.
 * @returns {Promise} Una promesa que se resuelve con un array de objetos de torneos, o null si ocurre un error.
 */
export async function getTorneos() {
    try {
        const response = await fetch('/api/torneos');
        if (!response.ok) {
            throw new Error(`Error al conectar con la API: ${response.statusText}`);
        }
        const data = await response.json();
        return data;

    } catch (error) {
        console.error("No se pudieron obtener los torneos:", error);
        return null;
    }
}

/**
 * Obtiene datos relacionados a un torneo específico (participantes, partidos, etc.).
 * Utiliza un sistema de caché en localStorage para evitar peticiones repetidas.
 * @param {string} recurso - El tipo de recurso a obtener ('participantes', 'partidos', etc.).
 * @param {string} torneo_id - El ID del torneo para el cual se obtendrán los datos.
 * @returns {Promise} Una promesa que se resuelve con el objeto de datos, o null si ocurre un error.
 */
async function getDatosTorneo(recurso, torneo_id) {
    try {
        const response = await fetch(`/data/${recurso}-${torneo_id}.json`);
        if (!response.ok) {
            throw new Error(`Error al cargar el archivo: ${response.statusText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`No se pudieron obtener los ${recurso} del torneo ${torneo_id}:`, error);
        return null;
    }
}

/**
 * Obtiene la lista de participantes para un torneo específico.
 * @param {string} torneo_id - El ID del torneo.
 * @returns {Promise} Una promesa que se resuelve con el objeto de participantes, o null si ocurre un error.
 */
export async function getParticipantes(torneo_id) {
    return getDatosTorneo('participantes', torneo_id);
}

/**
 * Obtiene la lista de partidos para un torneo específico.
 * @param {string} torneo_id - El ID del torneo.
 * @returns {Promise} Una promesa que se resuelve con el objeto de partidos, o null si ocurre un error.
 */
export async function getPartidos(torneo_id) {
    return getDatosTorneo('partidos', torneo_id);
}

/**
 * Renderiza una tabla de torneos en un contenedor específico.
 * Carga el componente de la tabla y lo puebla con los datos de los torneos proporcionados.
 * @param {string} idContainer - El ID del elemento contenedor donde se renderizará la tabla.
 * @param {Array<Object>} dataTorneos - Un array de objetos de torneos para mostrar en la tabla.
 */
export async function renderizarTablaTorneos(idContainer, dataTorneos) {
    const container = document.getElementById(idContainer);
    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }

    const respuesta = await fetch('/components/tablaTorneos.html');
    if (!respuesta.ok) {
        console.error(`No se pudo cargar el componente de la tabla.`);
        return;
    }

    const tablaHTML = await respuesta.text();
    container.innerHTML = tablaHTML;

    const tbody = container.querySelector('tbody');
    if (dataTorneos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hay torneos para mostrar.</td></tr>';
        return;
    }

    dataTorneos.forEach(torneo => {
        const { nombreDisciplina, datosEstado } = procesarInfoTorneo(torneo);

        const row = document.createElement('tr');
        row.innerHTML =
            `
            <td><img src="${torneo.portadaURL}" alt="'Portada miniatura del torneo.'" class="tabla_portada"></td>
            <td><span class="tabla_texto">${torneo.nombre}</span></td>
            <td><span class="tabla_texto">${nombreDisciplina}</span></td>
            <td><span class="tabla_texto">${torneo.nro_participantes}</span></td>
            <td>
                <ul class="tabla_tags_lista">
                    ${torneo.tags.map(tag => `<li class="tabla_tag">${tag}</li>`).join('')}
                </ul>
            </td>
            <td><span class="tabla_texto">${torneo.formato}</span></td>
            <td><span class="tabla_estado ${datosEstado.className}">${datosEstado.text}</span></td>
            <td><a class="tabla_btn_explorar" href="torneoView.html?id=${torneo.torneo_id}">Ver más</a></td>`
        tbody.appendChild(row);
    });
}

/**
 * Renderiza la vista detallada de un único torneo en un contenedor.
 * @param {string} idContainer - El ID del elemento que será reemplazado por la vista de detalles.
 * @param {Object} dataTorneo - El objeto del torneo a renderizar.
 */
export async function renderizarTorneo(idContainer, dataTorneo) {
    const container = document.getElementById(idContainer);
    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    } else {
        const { nombreDisciplina, datosEstado } = procesarInfoTorneo(dataTorneo);

        const displayTorneo = document.createElement('div');
        displayTorneo.classList.add('info_grid');
        displayTorneo.innerHTML =
            `
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Disciplina</h2>
                <h3 class="info_torneo_detalles">${nombreDisciplina}</h3>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Formato</h2>
                <h3 class="info_torneo_detalles">${dataTorneo.formato}</h3>
                    </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Estado</h2>
                <h3 class="info_torneo_detalles"><span class="tabla_estado ${datosEstado.className}">${datosEstado.text}</span></h3>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Nro. Participantes</h2>
                <h3 class="info_torneo_detalles">${dataTorneo.nro_participantes}</h3>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Organizador</h2>
                <h3 class="info_torneo_detalles">${dataTorneo.organizador}</h3>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Premio</h2>
                <h3 class="info_torneo_detalles">${dataTorneo.premio}</h3>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Fechas</h2>
                <p class="info_torneo_detalles">
                ${dataTorneo.fecha_inicio ? formatearFecha(dataTorneo.fecha_inicio) : 'Fecha inicial sin determinar'}
                <br>-<br>
                ${dataTorneo.fecha_fin ? formatearFecha(dataTorneo.fecha_fin) : 'Fecha final sin determinar'}
                </p>
            </div>
            <div class="info_torneo_container">
                <h2 class="info_torneo_titulo">Tags</h2>
                <ul class="tabla_tags_lista">
                    ${dataTorneo.tags.map(tag => `<li class="tabla_tag">${tag}</li>`).join('')}
                </ul>
            </div>
        `;
        container.replaceWith(displayTorneo);
    }
}

/**
 * Procesa los datos brutos de un torneo para obtener valores listos para mostrar.
 * @param {Object} torneo - El objeto del torneo a procesar.
 * @returns {{nombreDisciplina: string, datosEstado: {text: string, className: string}}} Un objeto con el nombre de la disciplina y los datos del estado listos para ser renderizados.
 */
function procesarInfoTorneo(torneo) {
    const infoDisciplina = encontrarDisciplinaJSON(torneo.disciplina);
    const nombreDisciplina = infoDisciplina ? infoDisciplina.nombreDisplay : torneo.disciplina;
    const infoEstado = encontrarEstadoJSON(torneo.estado);

    const datosEstado = infoEstado
        ? { text: infoEstado.nombreDisplay, className: infoEstado.className }
        : { text: 'Desconocido', className: '' };

    return { nombreDisciplina, datosEstado };
}

