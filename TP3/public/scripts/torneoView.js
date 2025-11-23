import { renderizarTorneo, getTorneos, getParticipantes, getPartidos } from '/scripts/torneos.js';
import { cargarComponentesComunes } from '/scripts/main.js';
import { formatearFecha, generarColorAleatorio } from '/scripts/utilities.js';
import { cargarModal, abrirModalEditar } from '/scripts/modalTorneo.js';

/**
 * @file Archivo dedicado a la carga y renderización de aspectos de un torneo en particular.
 */


/** * Almacena el torneo actualmente visualizado en la página.
 * @type {Object|null}
 */
let torneoActual = null;
let listaParticipantes;
let listaPartidos;

/**
 * Función principal que se ejecuta al cargar la página de la vista de un torneo.
 * Carga componentes comunes, obtiene el ID del torneo desde la URL, busca el torneo
 * y renderiza su información junto con la lista de participantes y edita el banner.
 */
/**
 * Función principal que se ejecuta al cargar la página de la vista de un torneo.
 */
async function main() {
    try {
        await cargarComponentesComunes();
        await cargarModal();

        const params = new URLSearchParams(window.location.search);
        const idURL = params.get('id');

        if (!idURL) {
            throw new Error('No se proporcionó ningún ID de torneo en la URL.');
        }

        //1. Obtener la lista completa de torneos
        const listaTorneos = await getTorneos();

        if (!listaTorneos || listaTorneos.length === 0) {
            throw new Error('No se pudieron obtener los torneos');
        }

        //2. Buscar el torneo con el ID proporcionado
        torneoActual = listaTorneos.find(torneo => torneo.torneo_id == idURL);

        if (!torneoActual) {
            throw new Error(`No se encontró el torneo con ID: ${idURL}`);
        }

        //3. Renderizar la información del torneo
        renderizarTorneo('info-torneo-placeholder', torneoActual);
        await editarBanner(torneoActual);

        //4. Obtener participantes y partidos
        const [participantesData, partidosData] = await Promise.allSettled([
            getParticipantes(torneoActual.torneo_id),
            getPartidos(torneoActual.torneo_id)
        ]);

        //5. Procesar y renderizar los datos obtenidos si existen
        if (participantesData.status === 'fulfilled' && participantesData.value?.participantes) {
            listaParticipantes = participantesData.value.participantes.map(p => ({
                ...p,
                color: generarColorAleatorio()
            }));
        } else {
            console.warn('No se pudieron cargar participantes:', participantesData.reason);
            listaParticipantes = [];
        }

        if (partidosData.status === 'fulfilled' && partidosData.value?.partidos) {
            listaPartidos = partidosData.value.partidos;
        } else {
            console.warn('No se pudieron cargar partidos:', partidosData.reason);
            listaPartidos = [];
        }

        renderizarParticipantes('info-participantes-placeholder', listaParticipantes);
        renderizarPartidos('info-partidos-placeholder', listaPartidos);

        //5.1 Activar interacciones si hay participantes
        if (listaParticipantes.length > 0) {
            activarInteraccionTablas();
        }

        //7. Activar interacción en el header, como editar o eliminar torneo
        activarInteracciónHeader();
        document.querySelector('main')?.classList.add('fade-in');
    } catch (error) {
        console.error('Error crítico:', error);
    }
}

/**
 * Renderiza la tabla de participantes de un torneo en un contenedor específico.
 * @param {string} idContainer - El ID del elemento contenedor donde se renderizará la tabla.
 * @param {Array<Object>} dataParticipantes - Un array de objetos, donde cada objeto representa un participante.
 */
async function renderizarParticipantes(idContainer, dataParticipantes) {
    const container = document.getElementById(idContainer);

    if (!container) {
        console.error(`No se encontró el contenedor: ${idContainer}`);
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
        `;

    container.replaceWith(displayParticipantes);
    const tbody = displayParticipantes.querySelector('tbody');
    if (!dataParticipantes || dataParticipantes.length === 0) {
        tbody.innerHTML = '<tr class="fila-vacio"><td colspan="4">No hay participantes registrados en este torneo.</td></tr>';
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
            `;
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
        `;

    container.replaceWith(displayPartidos);

    const tbody = displayPartidos.querySelector('tbody');

    if (!dataPartidos || dataPartidos.length === 0) {
        tbody.innerHTML = '<tr class="fila-vacio"><td colspan="5">No hay partidos registrados para este torneo.</td></tr>';
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
            `;
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

/**
 * Función que activa la interacción en el header del torneo.
 * Obtiene la id del header y actiiva un botón con 2 futuras opciones.
 * Si se ingresa una id de administrador, se muestran las opciones de editar y eliminar torneo. Además
 * de la edición de partidos y participantes (pendiente de implementar).
 * Si se ingresa una id de usuario normal, se muestra la opción de darse de baja del torneo.
 * @returns 
 */
async function activarInteracciónHeader() {

    //1. Seleccionar el contenedor de opciones del header
    const headerOpciones = document.getElementById('header_torneo_opciones');
    if (!headerOpciones) {
        console.error("No se encontró el contenedor de opciones del header (id='header_torneo_opciones').");
        return;
    }
    //2. Crear el botón de ingreso de id
    const botonIngresoId = document.createElement('li');
    botonIngresoId.innerHTML = `<a href="#" class="navbar_link navbar_opciones_primario">🔐 Opciones Torneo</a>`;
    headerOpciones.appendChild(botonIngresoId);

    //3. Agregar el evento click al botón, temporalmente se pedirá la id por prompt
    let idIngresada = null;
    botonIngresoId.addEventListener('click', (event) => {
        event.preventDefault();
        idIngresada = prompt("Ingrese su ID para ver las opciones disponibles del torneo:");

        if (!idIngresada || idIngresada.trim() === '') {
            console.log('Operación cancelada o ID vacía');
            return;
        }

        const esAdmin = true;

        if (esAdmin) {
            mostrarOpcionesAdmin(headerOpciones);
        } else {
            //mostrarOpcionesParticipante(headerOpciones);
        }
    });
}
/**
 * Muestra las opciones de administrador (editar y eliminar torneo) en el header.
 * @param {*} id_contenedor 
 */
function mostrarOpcionesAdmin(id_contenedor) {
    // Función que activa los botones pertenecientes al modo de administrador, editar y eliminar
    id_contenedor.innerHTML = ``;

    const opcionesAdmin = document.createElement('ul');
    opcionesAdmin.classList.add('navbar_links');
    opcionesAdmin.innerHTML = `
        <li><a href="#" class="navbar_link navbar_opciones_primario" id="btn-header-editar">Editar Torneo</a></li>
        <li><a href="#" class="navbar_link navbar_opciones_secundario" id="btn-header-eliminar">Eliminar Torneo</a></li>
    `;
    id_contenedor.replaceWith(opcionesAdmin);

    //Se inicializan los eventos luego de agregar al DOM
    setTimeout(() => {
        const btnEditar = document.getElementById('btn-header-editar');
        const btnEliminar = document.getElementById('btn-header-eliminar');

        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalEditar(torneoActual);
            });
        }

        if (btnEliminar) {
            btnEliminar.addEventListener('click', (e) => {
                e.preventDefault();
                eliminarTorneo();
            });
        }
    }, 50);
}

/**
 * Elimina el torneo actual después de confirmar con el usuario.
 * TODO: Implementar verificación por ID de administrador, no por nombre del torneo.
 */
async function eliminarTorneo() {
    if (!torneoActual) {
        alert('No hay torneo cargado');
        return;
    }

    const confirmacion1 = confirm(
        `¿Estás seguro de eliminar el torneo "${torneoActual.nombre}"?\n` +
        `ADVERTENCIA: Esta acción es IRREVERSIBLE.`
    );

    if (!confirmacion1) return;

    const confirmacion2 = prompt(
        `Para confirmar, escribir el nombre del torneo:\n"${torneoActual.nombre}"`
    );

    if (confirmacion2 !== torneoActual.nombre) {
        alert('Nombre no coincide. Eliminación cancelada.');
        return;
    }

    try {
        console.log(`Eliminando torneo ID: ${torneoActual.torneo_id}`);

        // Llamada a la API para eliminar el torneo
        const response = await fetch(`/api/torneos/${torneoActual.torneo_id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar el torneo');
        }

        const resultado = await response.json();
        console.log('Respuesta:', resultado);

        alert(`${resultado.message}\n\nEliminado con éxito. Redirigiendo a catálogo.`);

        setTimeout(() => {
            window.location.href = '/torneosCatalogo';
        }, 1000);

    } catch (error) {
        console.error('Error:', error);
        alert(`Error: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', main);