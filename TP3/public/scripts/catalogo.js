import { cargarComponentesComunes } from "/scripts/main.js";
import { getTorneos, renderizarTablaTorneos } from "/scripts/torneos.js";
import { cargarModal, abrirModalCrear } from "/scripts/modalTorneo.js";

/**
 * @file Scripts para la página de catálogo de torneos con paginación y creación de torneos.
 */

// Almacena la lista completa de torneos obtenida de la fuente de datos.
let listaTorneos = []
// Indica si la lista completa de torneos ya ha sido cargada para filtrado.
let torneosCompletosCargados = false;
// Almacena la información de paginación actual.
let paginacionActual = null;

// Número de torneos a mostrar por página.
const torneosPorPagina = 5;

/**
 * Función principal que se ejecuta al cargar la página.
 * Carga componentes comunes, inicializa la tabla de torneos,
 * y configura los filtros y la paginación.
 */
async function main() {
    // 1. Cargar componentes comunes y modal
    await Promise.all([cargarComponentesComunes(), cargarModal()]);

    // 2. Configurar botón de crear torneo
    const btnCrear = document.getElementById('btn-crear-torneo');
    if (btnCrear) {
        btnCrear.addEventListener('click', () => {
            abrirModalCrear();
        });
    }

    // 3. Renderizar tabla vacía inicialmente
    renderizarTablaTorneos('tabla-torneos-placeholder', []);

    // 4. Cargar primera página de torneos
    await cargarPrimeraPagina();

    // 5. Configurar filtros y paginación
    document.querySelector('main').classList.add('fade-in');
    inicializarFiltros();
    inicializarPaginacion();
}

/**
 * Carga la primera página de torneos desde la API y actualiza la tabla.
 */
async function cargarPrimeraPagina() {
    try {
        //1. Solicitar la primera página de torneos
        const response = await fetch(`/api/torneos-limitados?index=1&limite=${torneosPorPagina}`);

        if (!response.ok) {
            throw new Error('Error al cargar torneos');
        }

        //2. Procesar la respuesta y actualizar la tabla
        const resultado = await response.json();
        listaTorneos = resultado.data;
        console.log(listaTorneos);
        paginacionActual = resultado.paginacion;

        // 3. Reemplaza la tabla vacía con los torneos cargados
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
        //4. Actualizar controles de paginación
        actualizarControlesPaginacion();

    } catch (error) {
        console.error('Error al cargar la primera página:', error);
    }
}

/**
 * Carga todos los torneos desde la API para permitir el filtrado completo.
 */
async function cargarTodosLosTorneos() {
    // Si ya se cargaron todos los torneos, no hacer nada
    if (torneosCompletosCargados) return;


    try {
        // 1. Solicitar todos los torneos
        const response = await fetch('/api/torneos');

        if (!response.ok) {
            throw new Error('Error al cargar los torneos');
        }

        // 2. Procesar la respuesta y almacenar la lista completa
        listaTorneos = await response.json();
        torneosCompletosCargados = true;
    } catch (error) {
        console.error('Error al cargar todos los torneos:', error);
        throw error;
    }
}

/**
 * Inicializa los filtros de búsqueda y sus eventos.
 */
function inicializarFiltros() {
    // 1. Configurar listeners de eventos para los controles del formulario de filtros
    const form = document.getElementById(`torneo_filtro`);
    const inputTexto = document.getElementById(`filtro_texto`);
    const selectDisciplina = document.getElementById(`filtro_disciplina`);
    const selectEstado = document.getElementById(`filtro_estado`);

    // 2. Agregar eventos para aplicar filtros al cambiar valores
    inputTexto.addEventListener('input', aplicarFiltros);
    selectDisciplina.addEventListener('change', aplicarFiltros);
    selectEstado.addEventListener('change', aplicarFiltros);

    // 3. Manejar el evento de reseteo del formulario
    form.addEventListener('reset', () => {
        setTimeout(async () => {
            torneosCompletosCargados = false;
            await cargarPrimeraPagina();
        }, 0);
    });
}

/**
 * Inicializa los controles de paginación y sus eventos.
 */
function inicializarPaginacion() {
    // 1. Configurar listeners de eventos para los botones de paginación
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');

    // 2. Agregar eventos para cambiar de página
    if (btnAnterior) {
        btnAnterior.addEventListener('click', () => cargarPagina('anterior'));
    }

    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => cargarPagina('siguiente'));
    }
}
/**
 * Carga una página específica de torneos según si es 'siguiente' o 'anterior'.
 * @param {string} direccion - Dirección de la página a cargar ('siguiente' o 'anterior'). 
 */
async function cargarPagina(direccion) {
    if (!paginacionActual) return;

    let nuevoIndice;

    // 1. Calcular el nuevo índice según la dirección
    if (direccion === 'siguiente') {
        if (paginacionActual.indice_solicitado + paginacionActual.limite > paginacionActual.total_torneos) {
            return;
        }
        nuevoIndice = paginacionActual.indice_solicitado + paginacionActual.limite;
    } else {
        if (paginacionActual.indice_solicitado === 1) {
            return;
        }
        nuevoIndice = Math.max(1, paginacionActual.indice_solicitado - paginacionActual.limite);
    }

    try {
        // 2. Solicitar la nueva página de torneos
        const response = await fetch(`/api/torneos-limitados?index=${nuevoIndice}&limite=${paginacionActual.limite}`);

        if (!response.ok) {
            throw new Error('Error al cargar página');
        }

        // 3. Procesar la respuesta y actualizar la tabla
        const resultado = await response.json();
        listaTorneos = resultado.data;
        paginacionActual = resultado.paginacion;

        // 4. Reemplaza la tabla con los nuevos torneos cargados
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
        actualizarControlesPaginacion();

    } catch (error) {
        console.error('Error al cambiar de página:', error);
    }
}

/**
 * Actualiza el estado de los controles de paginación según la página actual.
 */
function actualizarControlesPaginacion() {
    // 1. Obtener referencias a los controles de paginación
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');
    const indicadorPagina = document.getElementById('indicador-pagina');

    if (!paginacionActual) return;

    // 2. Calcular y mostrar la información de la página actual
    const paginaActual = Math.ceil(paginacionActual.indice_solicitado / paginacionActual.limite);
    const totalPaginas = Math.ceil(paginacionActual.total_torneos / paginacionActual.limite);

    if (indicadorPagina) {
        indicadorPagina.textContent = `Página ${paginaActual} de ${totalPaginas}`;
    }

    if (btnAnterior) {
        btnAnterior.disabled = paginacionActual.indice_solicitado === 1;
    }

    if (btnSiguiente) {
        btnSiguiente.disabled =
            paginacionActual.indice_solicitado + paginacionActual.limite > paginacionActual.total_torneos;
    }
}

/**
 * Aplica los filtros seleccionados y actualiza la tabla de torneos.
 */
async function aplicarFiltros() {
    // 1. Obtener los valores actuales de los filtros
    const filtroTexto = document.getElementById('filtro_texto').value.toLowerCase();
    const filtroDisciplina = document.getElementById('filtro_disciplina').value;
    const filtroEstado = document.getElementById('filtro_estado').value;

    // 2. Determinar si hay filtros activos
    const hayFiltrosActivos = filtroTexto || filtroDisciplina || filtroEstado;

    // 3. Si hay filtros activos, cargar todos los torneos para filtrar
    if (hayFiltrosActivos) {
        await cargarTodosLosTorneos();
        ocultarControlesPaginacion();
    } else {
        mostrarControlesPaginacion();
        await cargarPrimeraPagina();
        return;
    }

    let torneosFiltrados = listaTorneos;

    // 4. Aplicar los filtros uno por uno
    if (filtroDisciplina) {
        torneosFiltrados = torneosFiltrados.filter(torneo =>
            torneo.disciplina === filtroDisciplina
        );
    }

    if (filtroEstado) {
        torneosFiltrados = torneosFiltrados.filter(torneo =>
            torneo.estado === parseInt(filtroEstado)
        );
    }

    if (filtroTexto) {
        torneosFiltrados = torneosFiltrados.filter(torneo => {
            const nombre = torneo.nombre.toLowerCase();
            const organizador = torneo.organizador.toLowerCase();
            const tags = torneo.tags.join(' ').toLowerCase();

            return nombre.includes(filtroTexto) ||
                organizador.includes(filtroTexto) ||
                tags.includes(filtroTexto);
        });
    }

    // 5. Reemplaza la tabla completa con los resultados filtrados
    renderizarTablaTorneos('tabla-torneos-placeholder', torneosFiltrados);
}

function ocultarControlesPaginacion() {
    //1. Ocultar los controles de paginación
    const controlesPaginacion = document.getElementById('controles-paginacion');
    if (controlesPaginacion) {
        controlesPaginacion.style.display = 'none';
    }
}

function mostrarControlesPaginacion() {
    //1. Mostrar los controles de paginación
    const controlesPaginacion = document.getElementById('controles-paginacion');
    if (controlesPaginacion) {
        controlesPaginacion.style.display = 'flex';
    }
}

// Ejecutar la función principal al cargar el DOM
document.addEventListener('DOMContentLoaded', main);