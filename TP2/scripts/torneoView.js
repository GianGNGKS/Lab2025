import { renderizarTorneo, getTorneos, getParticipantes } from './torneos.js';
import { cargarComponentesComunes } from './main.js';

/**
 * @file Archivo dedicado a la carga y renderización de aspectos de un torneo en particular.
 */

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

    if (listaTorneos) {
        const torneoEncontrado = listaTorneos.find(torneo => torneo.torneo_id == idURL);

        if (torneoEncontrado) {
            renderizarTorneo('info-torneo-placeholder', torneoEncontrado);
            await editarBanner(torneoEncontrado);

            const participantesTorneo = await getParticipantes(torneoEncontrado.torneo_id);
            if (participantesTorneo) {
                renderizarParticipantes('id-participantes-placeholder', participantesTorneo.participantes);
            }
        } else {
            console.error('Err: No se encontró ningún torneo.')
        }
    }
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
    } else {
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