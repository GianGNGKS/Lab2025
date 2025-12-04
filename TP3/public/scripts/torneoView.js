import { renderizarTorneo, getParticipantes, getPartidos } from '/scripts/torneos.js';
import { cargarComponentesComunes } from '/scripts/main.js';
import {
    formatearFecha, generarColorAleatorio, mostrarClaveParticipante,
    confirmarAccion, solicitarTexto, mostrarError, mostrarExito
} from '/scripts/utilities.js';
import { cargarModal, abrirModalEditar } from '/scripts/modalTorneo.js';
import { cargarModalPartido, abrirModalEditarPartido, abrirModalCrearPartido } from '/scripts/modalPartido.js';

/**
 * @file Archivo dedicado a la carga y renderización de aspectos de un torneo en particular.
*/

let torneoActual = null;
let listaParticipantes;
let listaPartidos;

/**
 * Función principal que se ejecuta al cargar la página de la vista de un torneo.
 * Carga componentes comunes, obtiene el ID del torneo desde la URL, busca el torneo
 * y renderiza su información junto con la lista de participantes y edita el banner.
 */
async function main() {
    try {
        await cargarComponentesComunes();
        await cargarModal();
        await cargarModalPartido();

        const params = new URLSearchParams(window.location.search);
        const idURL = params.get('id');

        if (!idURL) {
            throw new Error('No se proporcionó ningún ID de torneo en la URL.');
        }

        //1. Obtiene la lista completa de torneos
        const response = await fetch(`/api/torneos/${idURL}`);

        if (!response.ok) {
            throw new Error(`Error al obtener el torneo: ${response.status}`);
        }

        torneoActual = await response.json();

        //2. Renderiza la información del torneo
        await editarBanner(torneoActual);
        renderizarTorneo('info-torneo-placeholder', torneoActual);

        //3. Obtiene participantes y partidos
        const [participantesData, partidosData] = await Promise.allSettled([
            getParticipantes(torneoActual.torneo_id),
            getPartidos(torneoActual.torneo_id)
        ]);

        //4. Procesa y renderiza los datos obtenidos, si existen
        if (participantesData.status === 'fulfilled' && participantesData.value?.participantes) {
            listaParticipantes = participantesData.value.participantes.map(p => ({
                ...p,
                color: generarColorAleatorio()
            }));
        } else {
            listaParticipantes = [];
        }

        if (partidosData.status === 'fulfilled' && partidosData.value?.partidos) {
            listaPartidos = partidosData.value.partidos;
        } else {
            listaPartidos = [];
        }

        renderizarParticipantes('info-participantes-placeholder', listaParticipantes);
        renderizarPartidos('info-partidos-placeholder', listaPartidos);

        //5.1 Activa la interacción si hay participantes
        if (listaParticipantes.length > 0) {
            activarInteraccionTablas();
        }

        //6. Activa la interacción en el header
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

    if (!container) return;

    const displayParticipantes = document.createElement('div');

    // 1. Define el HTML de la tabla de participantes
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

    // 2. Reemplaza el contenedor con la nueva tabla
    container.replaceWith(displayParticipantes);
    const tbody = displayParticipantes.querySelector('tbody');
    if (!dataParticipantes || dataParticipantes.length === 0) {
        tbody.innerHTML = '<tr class="fila-vacio"><td colspan="4">No hay participantes registrados en este torneo.</td></tr>';
        return;
    }

    //3. Ordena por puntos con orden descendente
    dataParticipantes.sort((a, b) => b.puntos - a.puntos);

    // 4. Llena la tabla con los datos de los participantes
    dataParticipantes.forEach(participante => {
        const row = document.createElement('tr');
        row.classList.add('fila-participante');
        row.dataset.participanteId = participante.id;
        row.innerHTML = `
                <td>
                <button class="navbar_link btn-elim-participante" style="display:none;">x</button>
                <span style="padding-left: 3em;"></span>
                <span class="color-participante" style="background-color: ${participante.color};"></span>
                <span class="tabla_texto">${participante.nombre}</span>
                </td>
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

    if (!container) return;

    const displayPartidos = document.createElement('div');
    displayPartidos.id = "info-partidos";

    const esAdmin = document.body.classList.contains('admin-view');

    // 1. Define el HTML de la tabla de partidos
    displayPartidos.innerHTML =
        `
            <div class="torneos_lista">
                <table class="tabla_torneos">
                    <thead class="tabla-liga-head">
                        <th>Fecha</th>
                        <th>Jugado en</th>
                        <th>Participante 1</th>
                        <th>Resultado</th>
                        <th>Participante 2</th>
                        <th class="col-acciones">Acciones</th>
                    </thead>
                    <tbody class="tabla-liga-body">
                    </tbody>
                </table>
            </div>
        `;

    container.replaceWith(displayPartidos);

    const tbody = displayPartidos.querySelector('tbody');

    if (!dataPartidos || dataPartidos.length === 0) {
        const colspan = esAdmin ? 6 : 5;
        tbody.innerHTML = `<tr class="fila-vacio"><td colspan="${colspan}">No hay partidos registrados para este torneo.</td></tr>`;
        return;
    }

    // 2. Llena la tabla con los datos de los partidos
    dataPartidos.forEach(partido => {
        const participante1 = procesarParticipante(partido.participante1_id);
        const participante2 = procesarParticipante(partido.participante2_id);

        const res1 = partido.resultado1 || 0;
        const res2 = partido.resultado2 || 0;
        const resultado = `${res1} - ${res2}`;

        const row = document.createElement('tr');
        row.classList.add('fila-partido');
        row.dataset.partidoId = partido.partido_id;
        row.dataset.p1Id = partido.participante1_id;
        row.dataset.p2Id = partido.participante2_id;

        row.innerHTML = `
                <td><span class="tabla_texto">${formatearFecha(partido.fecha)}</span></td>
                <td><span class="tabla_texto">${partido.jugado_en || 'N/A'}</span></td>
                <td>
                    <span class="color-participante" style="background-color: ${participante1.color};"></span>
                    <span class="tabla_texto">${participante1.nombre}</span>
                </td>
                <td><span class="tabla_texto resultado-partido">${resultado}</span></td>
                <td>
                    <span class="color-participante" style="background-color: ${participante2.color};"></span>
                    <span class="tabla_texto">${participante2.nombre}</span>
                </td>
                <td class="acciones-partido col-acciones">
                    <button class="btn-editar-partido" data-partido-id="${partido.partido_id}" style="display: none;">
                        ✏️
                    </button>
                    <button class="btn-eliminar-partido" data-partido-id="${partido.partido_id}" style="display: none;">
                        ❌
                    </button>
                </td>
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
    // 1. Actualiza el título del banner
    const nombreTorneo = torneo.nombre;
    const tituloBanner = document.getElementById(`banner_desc`);
    tituloBanner.classList.add(`banner_torneo_titulo`);
    tituloBanner.textContent = nombreTorneo;

    // 2. Actualiza la descripción del torneo
    const descTorneo = torneo.descripcion || "";
    const descBanner = document.getElementById(`torneo_desc`);
    descBanner.textContent = descTorneo;

    // 3. Actualiza la imagen de fondo del banner
    const bannerFondo = document.getElementById(`banner`);
    const imageUrl = torneo.portadaURL;
    bannerFondo.style.backgroundImage = `linear-gradient(to left, rgba(0,0,0,0.6), rgba(0,0,0,0.95)), url('${imageUrl}')`;
    bannerFondo.classList.add('cargado');
}

/**
 * Activa la interactividad entre las tablas de participantes y partidos.
 * Al hacer clic en un participante en la tabla de participantes, resalta los partidos en los que ha participado.
 * También permite desactivar el resaltado al hacer click fuera de las filas de participantes.
 * */
function activarInteraccionTablas() {
    const filasParticipantes = document.querySelectorAll('.fila-participante');
    const seccionPartidos = document.getElementById('info-partidos');

    if (filasParticipantes.length === 0) return;

    if (!seccionPartidos) return;

    // 1. Agrega el evento click a cada fila de participante
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
 * Si se ingresa una id de administrador válida, se muestran las opciones de edición del torneo.
 * Si se ingresa una id de usuario normal, se muestra la opción de darse de baja del torneo.
 */
async function activarInteracciónHeader() {
    //1. Selecciona el contenedor de opciones del header
    const headerOpciones = document.getElementById('header_torneo_opciones');
    if (!headerOpciones) return;

    //2. Crea el botón de ingreso de id y el botón de inscripción a torneo.
    const botonInscripcion = document.createElement('li');
    botonInscripcion.innerHTML = `<a href="#" class="navbar_link navbar_opciones_primario">📝 Inscribirse al Torneo</a>`
    headerOpciones.appendChild(botonInscripcion);

    const botonBajaTorneo = document.createElement('li');
    botonBajaTorneo.innerHTML = `<a href="#" class="navbar_link">❌ Darse de Baja</a>`;
    headerOpciones.appendChild(botonBajaTorneo);

    const botonIngresoId = document.createElement('li');
    botonIngresoId.innerHTML = `<a href="#" class="navbar_link navbar_opciones_primario">🔐 Opciones Torneo</a>`;
    headerOpciones.appendChild(botonIngresoId);


    const torneoId = torneoActual.torneo_id;
    const tokenExistente = sessionStorage.getItem(`torneo_${torneoId}_token`);

    if (tokenExistente) {
        const esValido = await verificarValidezToken(tokenExistente, torneoId);

        if (esValido) {
            mostrarOpcionesAdmin(headerOpciones, tokenExistente);
            return;
        } else {
            sessionStorage.removeItem(`torneo_${torneoId}_token`);
        }
    }

    //3. Agrega el evento click al botón, si no hay auto-login
    botonIngresoId.addEventListener('click', async (event) => {
        event.preventDefault();

        // 3.1 Pide la clave de administrador
        const adminKey = await solicitarTexto({
            title: '🔐 AUTENTICACIÓN',
            text: `Torneo: ${torneoActual.nombre}\n\nIngresa tu clave de administrador:`
        });

        if (!adminKey || adminKey.trim() === '') return;

        // 3.2 Verifica la clave con el servidor
        try {
            const torneoId = torneoActual.torneo_id;

            const response = await fetch(`/api/torneos/${torneoId}/auth/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_key: adminKey })
            });

            const resultado = await response.json();

            // 3.3 Determina el tipo de usuario según la respuesta
            if (response.ok && resultado.valid) {
                sessionStorage.setItem(`torneo_${torneoId}_token`, resultado.token);
                await mostrarExito(`✅ Autenticación exitosa.\n\nAhora podés editar "${torneoActual.nombre}".`);
                mostrarOpcionesAdmin(headerOpciones, resultado.token);
            }
        } catch (error) {
            await mostrarError('❌ Error al verificar credenciales. Por favor, intentá más tarde.');
        }
    });

    // 4. Inicializa el botón de inscripción al torneo
    botonInscripcion.addEventListener('click', (event) => {
        //4.1. Carga el prompt para ingresar datos de inscripción
        event.preventDefault();
        agregarParticipante();
    }
    );

    // 5. Inicializa el botón de baja del torneo
    botonBajaTorneo.addEventListener('click', async (event) => {
        //5.1 Carga el prompt para ingresar clave de participante
        event.preventDefault();
        const respuesta = await validarClaveParticipante();
        if (respuesta) {
            eliminarParticipante(respuesta);
        }
    });
}

async function validarClaveParticipante() {
    // 1. Pide la clave del participante
    const participanteKey = await solicitarTexto({
        title: `🔐 BAJA DE TORNEO`,
        text: `Torneo: ${torneoActual.nombre}. Por favor, ingresá la clave de participante:`
    });

    if (!participanteKey || participanteKey.trim() === '') return;

    //2. Valida la clave con el servidor
    const respuesta = await fetch(`/api/torneos/${torneoActual.torneo_id}/auth/participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_key: participanteKey })
    });

    if (!respuesta.ok) {
        await mostrarError('❌ Error en la verificación de la clave de participante. Por favor, intentá más tarde.');
        return false;
    }

    const resultado = await respuesta.json();

    if (resultado.valid) {
        return resultado.participante_id;
    } else {
        mostrarError(`❌ Clave de participante inválida. No se puede procesar la baja.`);
        return false;
    }
}


/**
 * Verifica si un token JWT sigue siendo válido.
 * @param {string} token - Token JWT a verificar
 * @param {string} torneoId - ID del torneo
 * @returns {Promise<boolean>}
 */
async function verificarValidezToken(token, torneoId) {
    try {
        // 1. Decodifica el token para verificar la expiración
        const payload = JSON.parse(atob(token.split('.')[1]));

        // 2. Verifica si el token expiró
        const ahora = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < ahora) {
            return false;
        }

        // 3. Verifica que el token corresponda a este torneo
        if (payload.torneo_id !== torneoId) {
            return false;
        }
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Muestra las opciones de administrador (SIN verificación de clave).
 * @param {HTMLElement} id_contenedor - Contenedor donde se mostrarán las opciones
 * @param {string} token - Token JWT ya validado
 */
function mostrarOpcionesAdmin(id_contenedor, token) {
    // 1. Verifica que haya un token
    if (!token) return;

    document.body.classList.add('admin-view');

    // 2. Limpia contenedor
    id_contenedor.innerHTML = '';

    // 3. Crea opciones de admin
    const opcionesAdmin = document.createElement('ul');
    opcionesAdmin.classList.add('navbar_links');
    opcionesAdmin.innerHTML = `
        <li>
            <a href="#" id="btn-header-editar" class="navbar_link navbar_opciones_primario">
                ✏️ Editar Torneo
            </a>
        </li>
        <li>
            <a href="#" id="btn-header-agregar-participante" class="navbar_link navbar_opciones_primario">
                ⛹️ Agregar Participante
            </a>
        </li>
        <li>
            <a href="#" id="btn-header-crear-partido" class="navbar_link navbar_opciones_primario">
                ⚽ Crear Partido
            </a>
        </li>
        <li>
            <a href="#" id="btn-header-eliminar" class="navbar_link">
                🗑️ Eliminar Torneo
            </a>
        </li>
        <li>
            <a href="#" id="btn-header-cerrar-sesion" class="navbar_link">
                🚪 Cerrar Sesión Admin
            </a>
        </li>
    `;

    id_contenedor.replaceWith(opcionesAdmin);

    // 4. Vincula eventos a los botones
    setTimeout(() => {
        const btnEditar = document.getElementById('btn-header-editar');
        const btnAddParticipante = document.getElementById('btn-header-agregar-participante');
        const btnCrearPartido = document.getElementById('btn-header-crear-partido');
        const btnEliminarTorneo = document.getElementById('btn-header-eliminar');
        const btnCerrarSesion = document.getElementById('btn-header-cerrar-sesion');

        if (btnEditar) {
            btnEditar.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalEditar(torneoActual);
            });
        }

        if (btnAddParticipante) {
            btnAddParticipante.addEventListener('click', (e) => {
                e.preventDefault();
                agregarParticipante();
            });
        }

        if (btnCrearPartido) {
            btnCrearPartido.addEventListener('click', (e) => {
                e.preventDefault();
                abrirModalCrearPartido(torneoActual.torneo_id, listaParticipantes);
            });
        }

        if (btnEliminarTorneo) {
            btnEliminarTorneo.addEventListener('click', (e) => {
                e.preventDefault();
                eliminarTorneo();
            });
        }

        if (btnCerrarSesion) {
            btnCerrarSesion.addEventListener('click', (e) => {
                e.preventDefault();
                cerrarSesionAdmin();
            });
        }

        activarBotonesEditarPartido();

        // 5. Activa todos los botones de eliminación de participantes
        const btnsElimParticipante = document.querySelectorAll('.btn-elim-participante');
        btnsElimParticipante.forEach(btn => {
            // 5.1 Muestra botón
            btn.style.display = 'inline-block';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // 5.2 Obtiene la fila padre (tr)
                const fila = btn.closest('tr.fila-participante');

                if (!fila) return; 
                // 5.3 Obtiene el ID del dataset
                const participanteId = fila.dataset.participanteId;

                if (!participanteId) return;

                // 5.4 Llama a la función de eliminación
                eliminarParticipante(participanteId);
            });
        });
    }, 50);
}

/**
 * Activa los botones de editar partido en la tabla (solo para admins).
 */
function activarBotonesEditarPartido() {
    const btnsEditar = document.querySelectorAll('.btn-editar-partido');
    const btnsEliminar = document.querySelectorAll('.btn-eliminar-partido');

    btnsEditar.forEach(btn => {
        // 1. Muestra botón
        btn.style.display = 'inline-block';

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const partidoId = btn.dataset.partidoId;
            const partido = listaPartidos.find(p => p.partido_id === partidoId);

            if (!partido) {
                mostrarError('❌ Error: Partido no encontrado');
                return;
            }
            abrirModalEditarPartido(torneoActual.torneo_id, partido, listaParticipantes);
        });
    });

    btnsEliminar.forEach(btn => {
        // 2. MUestra botón
        btn.style.display = 'inline-block';
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();

            const partidoId = btn.dataset.partidoId;

            const confirmar = await confirmarAccion({
                title: `❌ ¿Eliminar este partido?`,
                text: `⚠️ Esta acción es irreversible.`
            });

            if (!confirmar) {
                return;
            }

            try {
                const token = sessionStorage.getItem(`torneo_${torneoActual.torneo_id}_token`);
                const response = await fetch(
                    `/api/torneos/${torneoActual.torneo_id}/partidos/${partidoId}`,
                    {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Error al eliminar partido');
                }

                await mostrarExito('✅ Partido eliminado correctamente. Recargando la página...');
                location.reload();
            } catch (error) {
                await mostrarError(`❌ Error al eliminar partido: ${error.message}`);
                return;
            }
        });
    });
}

// Agrega a un participante a un torneo.
async function agregarParticipante() {
    // 1. Verifica que haya un torneo cargado
    if (!torneoActual) {
        await mostrarError('❌ No hay torneo cargado');
        return;
    }
    // 2. Verifica si hay plazas disponibles
    if (listaParticipantes.length >= torneoActual.nro_participantes) {
        await mostrarError('❌ No hay plazas disponibles para nuevos participantes en este torneo.');
        return;
    }

    // 3. Pide el nombre del participante
    const nombreParticipante = await solicitarTexto(
        {
            title: '➕ Inscribir participante',
            text: `Torneo: ${torneoActual.nombre}. Por favor, ingresá el nombre del participante:`,
            inputPlaceholder: 'Nombre del participante...'
        }
    );

    if (!nombreParticipante || nombreParticipante === '') {
        return;
    }

    // 4. Invoca el endpoint para agregar participante
    try {
        const torneoId = torneoActual.torneo_id;
        const bodyData = JSON.stringify({ nombre: nombreParticipante });

        const response = await fetch(
            `/api/torneos/${torneoId}/participantes`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: bodyData
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al agregar participante');
        }

        const resultado = await response.json();

        // 5. Muestra la clave
        await mostrarClaveParticipante(resultado.nombre, resultado.participante_key);

        await mostrarExito('✅ Participante agregado con éxito. Recargando la página...');
        location.reload();

    } catch (error) {
        await mostrarError(`❌ Error: ${error.message}`);
    }

}


/**
 * Cierra la sesión de administrador.
 */
async function cerrarSesionAdmin() {
    const confirmar = await confirmarAccion({
        title: '¿Cerrar sesión de administrador?\n\n',
        text: 'Tendrás que volver a ingresar tu clave para editar el torneo.'
    });

    if (confirmar) {
        const torneoId = torneoActual.torneo_id;
        sessionStorage.removeItem(`torneo_${torneoId}_token`);
        document.body.classList.remove('admin-view');
        await mostrarExito('✅ Sesión de administrador cerrada. Recargando la página...');
        location.reload();
    }
}

/**
 * Elimina un participante del torneo después de confirmación.
 * @param {string} participanteId - ID del participante a eliminar
 */
async function eliminarParticipante(participanteId) {
    // 1. Busca el participante en la lista
    const participante = listaParticipantes.find(p => p.id === participanteId);

    if (!participante) {
        mostrarError('❌ Participante no encontrado.');
        return;
    }

    // 2. Confirmación
    const confirmar = await confirmarAccion({
        title: '⚠️ ¿Eliminar participante?',
        text: `Estás a punto de eliminar a "${participante.nombre}" del torneo.`
    });

    if (!confirmar) {
        return;
    }

    try {
        // 3. Llama al endpoint DELETE     
        const response = await fetch(
            `/api/torneos/${torneoActual.torneo_id}/participantes/${participanteId}`,
            {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar participante');
        }
        
        // 4. Muestra mensaje de éxito
        await mostrarExito(`✅ Participante "${participante.nombre}" eliminado con éxito.`);
        location.reload();

    } catch (error) {
        mostrarError(`❌ Error: ${error.message}`);
    }
}

/**
 * Elimina el torneo actual después de confirmar con el administrador.
 */
async function eliminarTorneo() {
    // 1. Verifica que haya un torneo cargado
    if (!torneoActual) {
        mostrarError('❌ No hay torneo cargado');
        return;
    }

    // 2. Confirmación 1
    const confirmacion1 = await confirmarAccion({
        title: `❌ ¿Eliminar el torneo "${torneoActual.nombre}"?`,
        text: `⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE.`
    });

    if (!confirmacion1) return;

    // 3. Confirmación 2: escribir el nombre
    const confirmacion2 = await solicitarTexto({
        title: `Confirmar eliminación`,
        text: `Escribí el nombre del torneo para confirmar su eliminación:`
    });

    if (confirmacion2 !== torneoActual.nombre) {
        await mostrarError('❌ Nombre no coincide. Eliminación cancelada.');
        return;
    }

    try {
        const token = sessionStorage.getItem(`torneo_${torneoActual.torneo_id}_token`);

        if (!token) {
            throw new Error('No tenés autorización. Autenticate primero.');
        }

        const response = await fetch(`/api/torneos/${torneoActual.torneo_id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar el torneo');
        }

        const resultado = await response.json();
        sessionStorage.removeItem(`torneo_${torneoActual.torneo_id}_token`);

        await mostrarExito(
            `✅ ${resultado.message}\n\n` +
            `Redirigiendo al catálogo.`
        );

        setTimeout(() => {
            window.location.href = '/torneosCatalogo';
        }, 1000);

    } catch (error) {
        mostrarError(`❌ Error: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', main);