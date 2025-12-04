import { cargarComponentesComunes } from "/scripts/main.js";
import { renderizarTablaTorneos } from "/scripts/torneos.js";
import { cargarModal, abrirModalCrear } from "/scripts/modalTorneo.js";
import { mostrarToast } from "/scripts/utilities.js";

/**
 * @file Scripts para la página de catálogo de torneos con paginación y creación de torneos.
 */

let listaTorneos = []
let torneosCompletosCargados = false;
let paginacionActual = null;
const torneosPorPagina = 5;

/**
 * Función principal que se ejecuta al cargar la página.
 * Carga componentes comunes, inicializa la tabla de torneos,
 * y configura los filtros y la paginación.
 */
async function main() {
    // 1. Carga componentes comunes y modal
    await Promise.all([cargarComponentesComunes(), cargarModal()]);

    // 2. Configura el botón de crear torneo
    const btnCrear = document.getElementById('btn-crear-torneo');
    if (btnCrear) {
        btnCrear.addEventListener('click', () => {
            abrirModalCrear();
        });
    }

    // 3. Renderiza la tabla vacía inicialmente
    renderizarTablaTorneos('tabla-torneos-placeholder', []);

    // 4. Carga la primera página de torneos
    await cargarPrimeraPagina();

    // 5. Configura filtros y paginación
    document.querySelector('main').classList.add('fade-in');
    inicializarFiltros();
    inicializarPaginacion();
}

/**
 * Carga la primera página de torneos desde la API y actualiza la tabla.
 */
async function cargarPrimeraPagina() {
    try {
        //1. Solicita la primera página de torneos
        const response = await fetch(`/api/torneos-limitados?index=1&limite=${torneosPorPagina}`);

        if (!response.ok) {
            throw new Error('Error al cargar torneos');
        }

        //2. Procesa la respuesta y actualizar la tabla
        const resultado = await response.json();
        listaTorneos = resultado.data;
        paginacionActual = resultado.paginacion;

        // 3. Reemplaza la tabla vacía con los torneos cargados
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
        //4. Actualiza controles de paginación
        actualizarControlesPaginacion();
    } catch (error) {
        await mostrarToast({
            icon: 'error',
            title: 'Error al cargar torneos',
            message: 'Error al cargar la primera página:', error
        })
    }
}

/**
 * Carga todos los torneos desde la API para permitir el filtrado completo.
 */
async function cargarTodosLosTorneos() {
    // Si ya se cargaron todos los torneos, no hace nada
    if (torneosCompletosCargados) return;

    try {
        // 1. Solicita todos los torneos
        const response = await fetch(`/api/torneos`);

        if (!response.ok) {
            throw new Error('Error al cargar los torneos');
        }

        // 2. Procesa la respuesta y almacena la lista completa
        listaTorneos = await response.json();
        torneosCompletosCargados = true;
    } catch (error) {
        await mostrarToast({
            icon: 'error',
            title: 'Error al cargar torneos',
            message: 'Error al cargar todos los torneos:', error
        })
        return;
    }
}

/**
 * Inicializa los filtros de búsqueda y sus eventos.
 */
function inicializarFiltros() {
    // 1. Configura listeners de eventos para los controles del formulario de filtros
    const form = document.getElementById(`torneo_filtro`);
    const inputTexto = document.getElementById(`filtro_texto`);
    const selectDisciplina = document.getElementById(`filtro_disciplina`);
    const selectEstado = document.getElementById(`filtro_estado`);

    // 2. Agrega eventos para aplicar filtros al cambiar valores
    inputTexto.addEventListener('input', aplicarFiltros);
    selectDisciplina.addEventListener('change', aplicarFiltros);
    selectEstado.addEventListener('change', aplicarFiltros);

    // 3. Maneja el reinicio del formulario
    form.addEventListener('reset', () => {
        setTimeout(async () => {
            torneosCompletosCargados = false;
            mostrarControlesPaginacion();
            await cargarPrimeraPagina();
        }, 0);
    });
}

/**
 * Inicializa los controles de paginación y sus eventos.
 */
function inicializarPaginacion() {
    // 1. Configura listeners de eventos para los botones de paginación
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');

    // 2. Agrega eventos para cambiar de página
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
        const response = await fetch(`/api/torneos-limitados?index=${nuevoIndice}&limite=${paginacionActual.limite}`);

        if (!response.ok) {

            throw new Error('Error al cargar página');
        }

        const resultado = await response.json();
        listaTorneos = resultado.data;
        paginacionActual = resultado.paginacion;

        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
        actualizarControlesPaginacion();
    } catch (error) {
        await mostrarToast({
            icon: 'error',
            title: 'Error al cargar torneos',
            message: 'Error al cambiar de página:', error
        })
    }
}

/**
 * Actualiza el estado de los controles de paginación según la página actual.
 */
function actualizarControlesPaginacion() {
    // 1. Obtiene referencias a los controles de paginación
    const btnAnterior = document.getElementById('btn-pagina-anterior');
    const btnSiguiente = document.getElementById('btn-pagina-siguiente');
    const indicadorPagina = document.getElementById('indicador-pagina');

    if (!paginacionActual) return;

    // 2. Calcula y muestra la información de la página actual
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
    // 1. Obtiene los valores actuales de los filtros
    const filtroTexto = document.getElementById('filtro_texto').value.toLowerCase();
    const filtroDisciplina = document.getElementById('filtro_disciplina').value;
    const filtroEstado = document.getElementById('filtro_estado').value;

    // 2. Determina si hay filtros activos
    const hayFiltrosActivos = filtroTexto || filtroDisciplina || filtroEstado;

    // 3. Si los hay, carga todos los torneos para filtrar
    if (hayFiltrosActivos) {
        await cargarTodosLosTorneos();
        ocultarControlesPaginacion();
    } else {
        mostrarControlesPaginacion();
        await cargarPrimeraPagina();
        return;
    }

    let torneosFiltrados = listaTorneos;

    // 4. Aplica los filtros uno por uno
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

/**
 * Oculta los controles de paginación.
 */
function ocultarControlesPaginacion() {
    const controlesPaginacion = document.getElementById('controles-paginacion');
    if (controlesPaginacion) {
        controlesPaginacion.style.display = 'none';
    }
}
/**
 * Muestra los controles de paginación
 */
function mostrarControlesPaginacion() {
    const controlesPaginacion = document.getElementById('controles-paginacion');
    if (controlesPaginacion) {
        controlesPaginacion.style.display = 'flex';
    }
}

// Ejecuta la función principal al cargar el DOM
document.addEventListener('DOMContentLoaded', main);