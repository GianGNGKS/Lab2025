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

        //1. Obtiene la lista completa de torneos
        const listaTorneos = await getTorneos();

        if (!listaTorneos || listaTorneos.length === 0) {
            throw new Error('No se pudieron obtener los torneos');
        }

        //2. Busca el torneo con el ID proporcionado
        torneoActual = listaTorneos.find(torneo => torneo.torneo_id == idURL);

        if (!torneoActual) {
            throw new Error(`No se encontró el torneo con ID: ${idURL}`);
        }

        //3. Renderiza la información del torneo
        renderizarTorneo('info-torneo-placeholder', torneoActual);
        await editarBanner(torneoActual);

        //4. Obtiene participantes y partidos
        const [participantesData, partidosData] = await Promise.allSettled([
            getParticipantes(torneoActual.torneo_id),
            getPartidos(torneoActual.torneo_id)
        ]);

        //5. Procesa y renderiza los datos obtenidos, si existen
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

        //5.1 Activa interacciones si hay participantes
        if (listaParticipantes.length > 0) {
            activarInteraccionTablas();
        }

        //6. Activa interacción en el header, como editar o eliminar torneo
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

    // 3. Llena la tabla con los datos de los participantes
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

    if (!container) {
        console.error(`Contenedor con id '${idContainer}' no encontrado.`);
        return;
    }

    const displayPartidos = document.createElement('div');
    displayPartidos.id = "info-partidos";

    // 1. Define el HTML de la tabla de partidos
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

    // 2. Llena la tabla con los datos de los partidos
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
 * Obtiene la id del header y actiiva un botón con 2 futuras opciones.
 * Si se ingresa una id de administrador, se muestran las opciones de editar y eliminar torneo. Además
 * de la edición de partidos y participantes (pendiente de implementar).
 * Si se ingresa una id de usuario normal, se muestra la opción de darse de baja del torneo.
 * @returns 
 */
async function activarInteracciónHeader() {
    //1. Selecciona el contenedor de opciones del header
    const headerOpciones = document.getElementById('header_torneo_opciones');
    if (!headerOpciones) {
        console.error("No se encontró el contenedor de opciones del header.");
        return;
    }

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
        console.log('Token encontrado en sessionStorage. Verificando validez...');

        const esValido = await verificarValidezToken(tokenExistente, torneoId);

        if (esValido) {
            console.log('Auto-login: Token válido. Mostrando opciones de admin...');
            mostrarOpcionesAdmin(headerOpciones, tokenExistente);
            return;
        } else {
            console.log('Token expirado o inválido. Eliminando de sessionStorage...');
            sessionStorage.removeItem(`torneo_${torneoId}_token`);
        }
    }

    //3. Agrega el evento click al botón (solo si no hay auto-login)
    botonIngresoId.addEventListener('click', async (event) => {
        event.preventDefault();

        // 3.1 Pide la clave de administrador
        const adminKey = prompt(
            `🔐 AUTENTICACIÓN\n\n` +
            `Torneo: ${torneoActual.nombre}\n\n` +
            `Ingresa tu clave de administrador:`
        );

        if (!adminKey || adminKey.trim() === '') {
            console.log('Autenticación cancelada');
            return;
        }

        // 3.2 Verifica la clave con el servidor
        try {
            const torneoId = torneoActual.torneo_id;
            console.log(`Verificando clave para torneo ${torneoId}...`);

            const response = await fetch(`/api/torneos/${torneoId}/verificar-key-admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_key: adminKey })
            });

            const resultado = await response.json();

            // 3.3 Determina tipo de usuario según la respuesta
            if (response.ok && resultado.valid) {
                console.log('Usuario autenticado como ADMIN');

                sessionStorage.setItem(`torneo_${torneoId}_token`, resultado.token);

                alert(`✅ Autenticación exitosa\n\nAhora podés editar tu torneo.`);

                mostrarOpcionesAdmin(headerOpciones, resultado.token);
            }
        } catch (error) {
            console.error('Error al verificar credenciales:', error);
            alert(`❌ Error de conexión\n\n${error.message}`);
        }
    });

    // 4. Inicializa botón de inscripción al torneo
    botonInscripcion.addEventListener('click', (event) => {
        //4.1. Carga el prompt para ingresar datos de inscripción
        event.preventDefault();
        agregarParticipante();
    }
    );

    botonBajaTorneo.addEventListener('click', async (event) => {
        //5. Carga el prompt para ingresar clave de participante
        event.preventDefault();
        const respuesta = await validarClaveParticipante();
        if (respuesta) {
            eliminarParticipante(respuesta);
        }
    });
}

async function validarClaveParticipante() {
    // 1. Pedi la clave del participante
    const participanteKey = prompt(
        `🔐 BAJA DE TORNEO\n\n` +
        `Torneo: ${torneoActual.nombre}\n\n` +
        `Ingresá tu clave de participante:`
    );

    if (!participanteKey || participanteKey.trim() === '') {
        console.log('Baja cancelada');
        return;
    }

    //2. Validar la clave con el servidor
    const respuesta = await fetch(`/api/torneos/${torneoActual.torneo_id}/verificar-key-participante`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participante_key: participanteKey })
    });

    if (!respuesta.ok) {
        console.log('Error en la verificación de la clave de participante');
        alert(`❌ Error en la verificación de la clave de participante.`);
        return false;
    }

    const resultado = await respuesta.json();
    console.log('Resultado de la verificación de clave de participante:', resultado);

    if (resultado.valid) {
        console.log(`Clave de participante válida: ${resultado.participante_id}`);
        return resultado.participante_id;
    } else {
        console.log('Clave de participante inválida');
        alert(`❌ Clave de participante inválida. No se puede procesar la baja.`);
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
        // Decodificar el token para verificar expiración (sin validar firma)
        const payload = JSON.parse(atob(token.split('.')[1]));

        // Verificar si el token expiró
        const ahora = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < ahora) {
            console.log('Token expirado');
            return false;
        }

        // Verificar que el token corresponda a este torneo
        if (payload.torneo_id !== torneoId) {
            console.log('Token no corresponde a este torneo');
            return false;
        }

        console.log('Token válido (verificación local)');
        return true;

    } catch (error) {
        console.error('Error al verificar token:', error);
        return false;
    }
}

/**
 * Muestra las opciones de administrador (SIN verificación de clave).
 * @param {HTMLElement} id_contenedor - Contenedor donde se mostrarán las opciones
 * @param {string} token - Token JWT ya validado
 */
function mostrarOpcionesAdmin(id_contenedor, token) {
    // Verificar que tenemos el token
    if (!token) {
        console.error('No se proporcionó token. No se pueden mostrar opciones de admin.');
        return;
    }

    // Limpiar contenedor
    id_contenedor.innerHTML = '';

    // Crear opciones de admin
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
            <a href="#" id="btn-header-editar-partidos" class="navbar_link navbar_opciones_primario">
                ⚽ Editar Partidos
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

    // Vincular eventos después de un tick
    setTimeout(() => {
        const btnEditar = document.getElementById('btn-header-editar');
        const btnAddParticipante = document.getElementById('btn-header-agregar-participante');
        //const btnEditarPartidos = document.getElementById('btn-header-editar-partidos');
        const btnEliminar = document.getElementById('btn-header-eliminar');
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

        if (btnEliminar) {
            btnEliminar.addEventListener('click', (e) => {
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

        // Activar todos los botones de eliminación de participantes
        const btnsElimParticipante = document.querySelectorAll('.btn-elim-participante');
        btnsElimParticipante.forEach(btn => {
            // Mostrar botón
            btn.style.display = 'inline-block';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Obtener la fila padre (tr)
                const fila = btn.closest('tr.fila-participante');

                if (!fila) {
                    console.error('No se encontró la fila padre del botón');
                    return;
                }
                // Obtener el ID del dataset
                const participanteId = fila.dataset.participanteId;

                if (!participanteId) {
                    console.error('No se encontró el ID del participante en la fila');
                    return;
                }

                console.log(`ID del participante a eliminar: ${participanteId}`);

                // Llamar a la función de eliminación
                eliminarParticipante(participanteId);
            });
        });
        console.log('Opciones de admin activadas');
    }, 50);
}

// Agrega a un participante a un torneo.
async function agregarParticipante() {
    // Verificar que haya un torneo cargado
    if (!torneoActual) {
        console.log('No hay torneo cargado');
        alert('❌ No hay torneo cargado');
        return;
    }
    // Verificar si hay plazas disponibles
    if (listaParticipantes.length >= torneoActual.nro_participantes) {
        console.log('No hay plazas disponibles para nuevos participantes en este torneo.');
        alert('❌ No hay plazas disponibles para nuevos participantes en este torneo.');
        return;
    }

    //1. Pedir nombre del participante
    const nombreParticipante = prompt(
        `➕ AGREGAR NUEVO PARTICIPANTE\n\n` +
        `Ingresá el nombre del participante:`
    ).trim();

    if (!nombreParticipante || nombreParticipante === '') {
        console.log('Agregar participante cancelado');
        alert('❌ Operación cancelada. No se agregó ningún participante.');
        return;
    }

    //2. Llamar a ruta '/api/torneos/:id/participantes' (POST) para implementar participante.
    try {
        const torneoId = torneoActual.torneo_id;
        console.log(`Agregando participante "${nombreParticipante}" al torneo ${torneoId}...`);
        const bodyData = JSON.stringify({ nombre: nombreParticipante });
        console.log('Datos enviados:', bodyData);

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
        console.log('Respuesta:', resultado);

        //3. Mostrar clave y mensaje de éxtio
        alert(
            `🎉 ¡Inscripción exitosa!\n\n` +
            `Participante: ${resultado.nombre}\n` +
            `ID: ${resultado.participante_id}\n\n` +
            `🔑 TU CLAVE DE PARTICIPANTE:\n\n` +
            `${resultado.participante_key}\n\n` +
            `⚠️ IMPORTANTE:\n` +
            `• Ésta clave se muestra UNA SOLA VEZ\n` +
            `• Copiala AHORA (Ctrl+C), sin ella NO podrás editar tu participación\n` +
            `• Guardala en un lugar seguro`
        );

        const copiado = confirm(
            `¿Copiaste tu clave?\n\n` +
            `${resultado.participante_key}\n\n` +
            `Click OK si ya la guardaste\n` +
            `Click CANCELAR para verla de nuevo`
        );

        if (!copiado) {
            prompt(
                `Por favor, copiá tu clave de participante:`,
                resultado.participante_key
            );
        }

        alert(`✅ Ya estás inscrito en el torneo.\n\nLa página se recargará.`);
        location.reload();

    } catch (error) {
        console.error('Error al agregar participante:', error);
        alert(`❌ Error: ${error.message}`);
    }

}


/**
 * Cierra la sesión de administrador.
 */
function cerrarSesionAdmin() {
    const confirmar = confirm(
        '¿Cerrar sesión de administrador?\n\n' +
        'Tendrás que volver a ingresar tu clave para editar el torneo.'
    );

    if (confirmar) {
        const torneoId = torneoActual.torneo_id;
        sessionStorage.removeItem(`torneo_${torneoId}_token`);
        console.log('Sesión de admin cerrada.');
        alert('✅ Sesión cerrada. Recargando la página.');
        location.reload();
    }
}

/**
 * Elimina un participante del torneo después de confirmación.
 * @param {string} participanteId - ID del participante a eliminar
 */
async function eliminarParticipante(participanteId) {
    // 1. Buscar el participante en la lista
    console.log(`Eliminando participante con ID: ${participanteId}`);
    const participante = listaParticipantes.find(p => p.id === participanteId);

    if (!participante) {
        alert('❌ Participante no encontrado.');
        return;
    }
    console.log("Participante encontrado:", participante);

    // 2. Confirmación
    const confirmar = confirm(
        `❌ ¿Eliminar al participante "${participante.nombre}"?\n\n` +
        `⚠️ Esta acción es irreversible.`
    );

    if (!confirmar) {
        console.log('Eliminación cancelada.');
        return;
    }

    try {
        // 3. Llamar al endpoint DELETE     
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

        const resultado = await response.json();
        console.log('Respuesta:', resultado);

        // 5. Mostrar mensaje de éxito
        alert(`✅ Participante "${participante.nombre}" eliminado con éxito.`);
        location.reload();

    } catch (error) {
        console.error('Error al eliminar participante:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

/**
 * Elimina el torneo actual después de confirmar con el administrador.
 */
async function eliminarTorneo() {
    if (!torneoActual) {
        alert('❌ No hay torneo cargado');
        return;
    }

    // Confirmación 1
    const confirmacion1 = confirm(
        `❌ ¿Eliminar el torneo "${torneoActual.nombre}"?\n\n` +
        `⚠️ ADVERTENCIA: Esta acción es IRREVERSIBLE.\n` +
        `Se eliminarán todos los datos del torneo.`
    );

    if (!confirmacion1) {
        console.log('Eliminación cancelada');
        return;
    }

    // Confirmación 2: escribir el nombre
    const confirmacion2 = prompt(
        `Para confirmar, escribe el nombre exacto del torneo:\n\n` +
        `"${torneoActual.nombre}"`
    );

    if (confirmacion2 !== torneoActual.nombre) {
        alert('❌ Nombre no coincide. Eliminación cancelada.');
        return;
    }

    try {
        console.log(`Eliminando torneo ID: ${torneoActual.torneo_id}`);
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
        console.log('Respuesta:', resultado);
        sessionStorage.removeItem(`torneo_${torneoActual.torneo_id}_token`);

        alert(
            `✅ ${resultado.message}\n\n` +
            `Redirigiendo al catálogo.`
        );

        setTimeout(() => {
            window.location.href = '/torneosCatalogo';
        }, 1000);

    } catch (error) {
        console.error('Error al eliminar torneo:', error);
        alert(`❌ Error: ${error.message}`);
    }
}

document.addEventListener('DOMContentLoaded', main);