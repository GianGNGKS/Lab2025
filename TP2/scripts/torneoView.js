import { renderizarTorneo, getParticipantes, getPartidos } from './torneos.js';
import { cargarComponentesComunes } from './main.js';
import { formatearFecha, generarColorAleatorio } from './utilities.js';
/**
 * @file Archivo dedicado a la carga y renderización de aspectos de un torneo en particular.
 */

// Almacena la lista de participantes del torneo actual.
let listaParticipantes = [];

/**
 * Función principal que se ejecuta al cargar la página de la vista de un torneo.
 * Carga componentes comunes, obtiene el ID del torneo desde la URL, busca el torneo
 * y renderiza su información junto con la lista de participantes y edita el banner.
 */
async function main() {
    await Promise.all([cargarComponentesComunes()]);

    const params = new URLSearchParams(window.location.search);
    const idURL = params.get('id');
    const listaTorneos = await fetch('/api/torneos').then(res => res.json());

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
    
    const dataParticipantes = await getParticipantes(torneoEncontrado.torneo_id);
    const participantesParaRenderizar = dataParticipantes && dataParticipantes.participantes ? dataParticipantes.participantes : [];
    if (participantesParaRenderizar) {
        listaParticipantes = participantesParaRenderizar.map(p => ({
            ...p, color: generarColorAleatorio()
        }));
    }
    renderizarParticipantes('id-participantes-placeholder', listaParticipantes);
    
    const dataPartidos = await getPartidos(torneoEncontrado.torneo_id);
    const partidosParaRenderizar = dataPartidos && dataPartidos.partidos ? dataPartidos.partidos : [];
    renderizarPartidos('info-partidos-placeholder', partidosParaRenderizar);
    
    document.querySelector('main').classList.add('fade-in');
    activarInteraccionTablas();
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
                        <th>Puntos</th>
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
        tbody.innerHTML = '<tr><td colspan="4">No hay participantes registrados en este torneo.</td></tr>';
        return;
    }

    dataParticipantes.forEach(participante => {
        const row = document.createElement('tr');
        row.classList.add('fila-participante');
        row.dataset.participanteId = participante.id;
        row.innerHTML = `
                <td><span class="color-participante" style="background-color: ${participante.color};"></span>
                <span class="tabla_texto">${participante.nombre}</span></td>
                <td><span class="tabla_texto">${participante.partidos_jugados}</span></td>
                <td><span class="tabla_texto">
                ${participante.ganados}-
                ${participante.empatados}-
                ${participante.perdidos}</span></td>
                <td><span class="tabla_texto">${participante.puntos}</span></td>
            `
        tbody.appendChild(row);
    });
}

/**
 * Renderiza la tabla de partidos de un torneo en un contenedor específico.
 * @param {String} idContainer - El ID del elemento contenedor donde se renderizará la tabla. 
 * @param {Array<Object>} dataPartidos - Un array de objetos, donde cada objeto representa un partido.
 * @returns 
 */
async function renderizarPartidos(idContainer, dataPartidos) {
    const container = document.getElementById(`info-partidos-placeholder`);

    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }

    const displayPartidos = document.createElement('div');
    displayPartidos.id = "info-partidos";

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
        tbody.innerHTML = '<tr><td colspan="5">No hay partidos registrados para este torneo.</td></tr>';
        return;
    }

    dataPartidos.forEach(partido => {
        const participante1 = procesarParticipante(partido.p1_id);
        const participante2 = procesarParticipante(partido.p2_id);
        const resultado = (partido.res1 !== null && partido.res2 !== null) ? `${partido.res1} - ${partido.res2}` : 'vs';

        const row = document.createElement('tr');
        row.classList.add('fila-partido');
        row.dataset.p1Id = partido.p1_id;
        row.dataset.p2Id = partido.p2_id;


        row.innerHTML = `
                <td><span class="tabla_texto">${formatearFecha(partido.fecha)}</span></td>
                <td><span class="tabla_texto">${partido.jornada}</span></td>
                <td><span class="color-participante" style="background-color: ${participante1.color};"></span>
                <span class="tabla_texto">${participante1.nombre}</span></td>
                <td><span class="tabla_texto">${resultado}</span></td>
                <td><span class="color-participante" style="background-color: ${participante2.color};"></span>
                <span class="tabla_texto">${participante2.nombre}</span></td>
            `
        tbody.appendChild(row);
    });
}

/**
 * Busca un participante por su ID en la lista global y devuelve su información.
 * @param {string} equipo_id - El ID del participante a buscar.
 * @returns {object} El objeto del participante (incluyendo nombre y color).
 */
function procesarParticipante(equipo_id) {
    const equipo = listaParticipantes.find(participante => participante.id === equipo_id);
    return equipo ? { nombre: equipo.nombre, color: equipo.color } : { nombre: "Desconocido", color: "#999" };
}

/**
 * Actualiza el banner de la página con la información específica del torneo.
 * Modifica el título, la descripción y la imagen de fondo del banner.
 * @param {Object} torneo - El objeto del torneo que contiene el nombre y la URL de la portada.
 */
async function editarBanner(torneo) {
    const nombreTorneo = torneo.nombre;
    const tituloBanner = document.getElementById(`banner_desc`);
    tituloBanner.classList.add(`banner_torneo_titulo`);
    tituloBanner.textContent = nombreTorneo;

    const descTorneo = torneo.descripcion || "";
    const descBanner = document.getElementById(`torneo_desc`);
    descBanner.textContent = descTorneo;

    const bannerFondo = document.getElementById(`banner`);
    const imageUrl = torneo.portadaURL || `https://picsum.photos/1200/400?random=${torneo.id}`;
    bannerFondo.style.backgroundImage = `linear-gradient(to left, rgba(0,0,0,0.6), rgba(0,0,0,0.95)), url('${imageUrl}')`;
}
/**
 * Activa la interactividad entre las tablas de participantes y partidos.
 * Al hacer clic en un participante en la tabla de participantes, resalta los partidos en los que ha participado.
 * También permite desactivar el resaltado al hacer click fuera de las filas de participantes.
 * */
function activarInteraccionTablas() {
    const filasParticipantes = document.querySelectorAll('.fila-participante');
    const seccionPartidos = document.getElementById('info-partidos');

    if (filasParticipantes.length === 0) {
        console.error("No se encontraron filas de participantes ('.fila-participante').");
        return;
    }

    if (!seccionPartidos) {
        console.error("No se encontró la sección de partidos (id='info-partidos').");
        return;
    }

    filasParticipantes.forEach(fila => {
        fila.addEventListener('click', (event) => {
            event.stopPropagation();
            const participanteId = fila.dataset.participanteId;

            document.querySelectorAll('.fila-partido.highlight').forEach(el => el.classList.remove('highlight'));

            if (seccionPartidos) {
                seccionPartidos.scrollIntoView({ behavior: 'smooth' });
            }

            const filasAResaltar = obtenerFilasPartidoPorParticipante(participanteId);
            filasAResaltar.forEach(f => f.classList.add('highlight'));
        });
    });
}

/**
 * Devuelve una lista de filas de partidos donde el participante está presente como p1 o p2.
 * @param {string} participanteId - El ID del participante.
 * @returns {NodeListOf<Element>} Lista de filas de partidos.
 */
function obtenerFilasPartidoPorParticipante(participanteId) {
    return document.querySelectorAll(
        `.fila-partido[data-p1-id="${participanteId}"], .fila-partido[data-p2-id="${participanteId}"]`
    );
}

// Busca todas las filas que actualmente están resaltadas.
// Si encuentra alguna, les quita la clase 'highlight'.
document.addEventListener('click', () => {
    const filasResaltadas = document.querySelectorAll('.fila-partido.highlight');

    if (filasResaltadas.length > 0) {
        filasResaltadas.forEach(f => f.classList.remove('highlight'));
    }
});


document.addEventListener('DOMContentLoaded', main);