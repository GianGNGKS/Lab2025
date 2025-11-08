/**
 * @file Archivo encargado de manejar la obtención y renderización de datos relacionados a torneos.
 */

import { getDisplayInfo, formatearFecha } from './utilities.js';

/**
 * Obtiene la lista completa de torneos desde la API del servidor.
 * @returns {Promise<Array>} Array de objetos de torneos.
 */
export async function getTorneos() {
    try {
        const response = await fetch('/api/torneos');

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al obtener torneos:', error);
        return null;
    }
}

/**
 * Obtiene datos relacionados a un torneo específico (participantes, partidos, etc.).
 * @param {string} recurso - El tipo de recurso a obtener ('participantes', 'partidos', etc.).
 * @param {string} torneo_id - El ID del torneo para el cual se obtendrán los datos.
 * @returns {Promise} Una promesa que se resuelve con el objeto de datos, o null si ocurre un error.
 */
async function getDatosTorneo(recurso, torneo_id) {
    try {
        const response = await fetch(`/api/torneos/${torneo_id}/${recurso}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`No se pudieron obtener los ${recurso} de ${torneo_id}`, error);
        return null;
    }
}

/**
 * Obtiene la lista de participantes de un torneo específico.
 * @param {string} torneo_id - El ID del torneo.
 * @returns {Promise<Array>} Array de participantes.
 */
export async function getParticipantes(torneo_id) {
    return getDatosTorneo(`participantes`, torneo_id);
}

/**
 * Obtiene la lista de partidos de un torneo específico.
 * @param {string} torneo_id - El ID del torneo.
 * @returns {Promise<Array>} Array de partidos.
 */
export async function getPartidos(torneo_id) {
    return getDatosTorneo(`partidos`, torneo_id);
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
        console.error(`No se encontró el contenedor con ID: ${idContainer}`);
        return;
    }

    const respuesta = await fetch('/components/tablaTorneos.html');
    if (!respuesta.ok) {
        console.error(`Error al cargar el componente de tabla de torneos: ${respuesta.statusText}`);
        return;
    }

    const tablaHTML = await respuesta.text();
    container.innerHTML = tablaHTML;

    const tbody = container.querySelector('tbody');
    if (dataTorneos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">No hay torneos para mostrar.</td></tr>';
        return;
    }

    dataTorneos.forEach(torneo => {
        const row = document.createElement('tr');
        const disciplina = getDisplayInfo('disciplina', torneo.disciplina);
        const estado = getDisplayInfo('estado', torneo.estado);

        row.dataset.id = torneo.torneo_id;
        row.className = 'tabla_fila';
        row.innerHTML =
            `
            <td><img src="${torneo.portadaURL}" alt="'Portada miniatura del torneo.'" class="tabla_portada"></td>
            <td><span class="tabla_texto">${torneo.nombre}</span></td>
            <td><span class="tabla_texto">${disciplina.nombreDisplay}</span></td>
            <td><span class="tabla_texto">${torneo.nro_participantes}</span></td>
            <td>
                <ul class="tabla_tags_lista">
                    ${torneo.tags.map(tag => `<li class="tabla_tag">${tag}</li>`).join('')}
                </ul>
            </td>
            <td><span class="tabla_texto">${torneo.formato}</span></td>
            <td><span class="tabla_estado ${estado.className}">${estado.nombreDisplay}</span></td>`
        row.addEventListener('click', () => {
            window.location.href = `/torneoView/?id=${torneo.torneo_id}`;
        });

        tbody.appendChild(row);
    });
}


/**
 * Renderiza la información completa de un torneo específico.
 * @param {string} idContainer - El ID del contenedor donde renderizar.
 * @param {Object} torneo - Objeto con los datos del torneo.
 */
export async function renderizarTorneo(idContainer, dataTorneo) {
    const container = document.getElementById(idContainer);
    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    } else {
        const nombreDisciplina = getDisplayInfo('disciplina', dataTorneo.disciplina).nombreDisplay;
        const datosEstado = getDisplayInfo('estado', dataTorneo.estado);

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
                <h3 class="info_torneo_detalles"><span class="tabla_estado ${datosEstado.className}">${datosEstado.nombreDisplay}</span></h3>
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