import { renderizarTorneo, getTorneos, getParticipantes, getPartidos } from './torneos.js';
import { cargarComponentesComunes } from './main.js';

/**
 * @file Archivo dedicado a la carga y renderización de aspectos de un torneo en particular.
 */

let listaParticipantes = [];
let listaPartidos = [];

/**
 * Función principal que se ejecuta al cargar la página de la vista de un torneo.
 * Carga componentes comunes, obtiene el ID del torneo desde la URL, busca el torneo
 * y renderiza su información junto con la lista de participantes y edita el banner.
 */
async function main() {
    await Promise.all([cargarComponentesComunes()]);

    const params = new URLSearchParams(window.location.search);
    const idURL = params.get('id');
    const listaTorneos = await getTorneos();

    if (!listaTorneos) {
        return;
    }

    const torneoEncontrado = listaTorneos.find(torneo => torneo.torneo_id == idURL);

    if (!torneoEncontrado) {
        console.error('Err: No se encontró ningún torneo.');
        return;
    }

    renderizarTorneo('info-torneo-placeholder', torneoEncontrado);
    await editarBanner(torneoEncontrado);

    listaParticipantes = await getParticipantes(torneoEncontrado.torneo_id);
    console.log(listaParticipantes);
    if (!listaParticipantes) {
        return;
    }

    renderizarParticipantes('id-participantes-placeholder', listaParticipantes.participantes);

    
    listaPartidos = await getPartidos(torneoEncontrado.torneo_id);
    if (!listaPartidos) {
        return;
    }
    renderizarPartidos('info-partidos-placeholder', listaPartidos.partidos);
    
}

/**
 * Renderiza la tabla de participantes de un torneo en un contenedor específico.
 * @param {string} idContainer - El ID del elemento contenedor donde se renderizará la tabla.
 * @param {Array<Object>} dataParticipantes - Un array de objetos, donde cada objeto representa un participante.
 */
async function renderizarParticipantes(idContainer, dataParticipantes) {
    const container = document.getElementById(`info-participantes-placeholder`);

    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }
    const displayParticipantes = document.createElement('div');

    displayParticipantes.innerHTML =
        `
            <div class="torneos_lista">
                <table class="tabla_torneos">
                    <thead class="tabla-liga-head">
                        <th>Equipo</th>
                        <th>Partidos jugados</th>
                        <th>Record(G-E-P)</th>
                    </thead>
                    <tbody class="tabla-liga-body">
                        </tbody>
                    </table>
                </div>
            </div>
            `;
    const tbody = displayParticipantes.querySelector('tbody');
    container.replaceWith(displayParticipantes);

    if (dataParticipantes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hay participantes inscriptos todavía.</td></tr>';
        return;
    }

    dataParticipantes.forEach(participante => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td><span class="tabla_texto">${participante.nombre}</span></td>
                <td><span class="tabla_texto">${participante.partidos_jugados}</span></td>
                <td><span class="tabla_texto">
                ${participante.ganados}-
                ${participante.empatados}-
                ${participante.perdidos}</span></td>
            `
        tbody.appendChild(row);
    });
}

async function renderizarPartidos(idContainer, dataPartidos) {
    const container = document.getElementById(`info-partidos-placeholder`);

    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }

    const displayPartidos = document.createElement('div');

    displayPartidos.innerHTML =
        `
            <div class="torneos_lista">
                <table class="tabla_torneos">
                    <thead class="tabla-liga-head">
                        <th>Fecha</th>
                        <th>Jornada</th>
                        <th>Equipo 1</th>
                        <th>Resultado</th>
                        <th>Equipo 2</th>
                    </thead>
                    <tbody class="tabla-liga-body">
                    </tbody>
                    </table>
                </div>
            </div>
            `;
    const tbody = displayPartidos.querySelector('tbody');
    container.replaceWith(displayPartidos);

    if (dataPartidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">No hay partidos jugados .</td></tr>';
        return;
    }

    dataPartidos.forEach(partido => {
        const row = document.createElement('tr');
        row.innerHTML = `
                <td><span class="tabla_texto">${partido.fecha}</span></td>
                <td><span class="tabla_texto">${partido.jornada}</span></td>
                <td><span class="tabla_texto">${procesarNombreEquipo(partido.p1_id)}</span></td>
                <td><span class="tabla_texto">${partido.res1} - ${partido.res2}</span></td>
                <td><span class="tabla_texto">${procesarNombreEquipo(partido.p2_id)}</span></td>
            `
        tbody.appendChild(row);
    });
}

function procesarNombreEquipo(equipo_id) {
    const equipo = listaParticipantes.participantes.find(participante => participante.id === equipo_id);
    return equipo ? equipo.nombre : "Desconocido";
}

/**
 * Actualiza el banner de la página con la información específica del torneo.
 * Modifica el título y la imagen de fondo del banner.
 * @param {Object} torneo - El objeto del torneo que contiene el nombre y la URL de la portada.
 */
async function editarBanner(torneo) {
    const nombreTorneo = torneo.nombre;
    const tituloBanner = document.getElementById(`banner_desc`);
    tituloBanner.classList.add(`banner_torneo_titulo`);
    tituloBanner.textContent = nombreTorneo;

    const bannerFondo = document.getElementById(`banner`);
    const imageUrl = torneo.portadaURL || `https://picsum.photos/1200/400?random=${torneo.id}`;
    bannerFondo.style.backgroundImage = `linear-gradient(to left, rgba(0,0,0,0.6), rgba(0,0,0,0.95)), url('${imageUrl}')`;
}

document.addEventListener('DOMContentLoaded', main)