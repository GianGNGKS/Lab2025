import { cargarComponentesComunes } from "./main.js";
import { getTorneos, renderizarTablaTorneos } from "./torneos.js";

/**
 * @file Archivo dedicado a la sección catálogo de torneos. 
 * Gestiona la carga, filtrado y renderizado de la lista de torneos.
 */

/**
 * Almacena la lista completa de torneos obtenida de la fuente de datos.
 * Se utiliza como caché para evitar peticiones repetidas al aplicar filtros.
 * @type {Array<Object>}
 */
let listaTorneos = []

/**
 * Función principal que se ejecuta al cargar la página del catálogo.
 * Carga los componentes comunes, obtiene la lista de torneos,
 * renderiza la tabla inicial y configura los filtros.
 */
async function main() {
    await Promise.all([cargarComponentesComunes()]);

    listaTorneos = await getTorneos() || [];

    if (listaTorneos) {
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
    }

    inicializarFiltros();
}

/**
 * Configura los listeners de eventos para los controles del formulario de filtros.
 * Llama a `aplicarFiltros` cada vez que un valor de filtro cambia o el formulario se resetea.
 */
function inicializarFiltros() {
    const form = document.getElementById(`torneo_filtro`);
    const inputTexto = document.getElementById(`filtro_texto`);
    const selectDisciplina = document.getElementById(`filtro_disciplina`);
    const selectEstado = document.getElementById(`filtro_estado`);

    inputTexto.addEventListener('input', aplicarFiltros);
    selectDisciplina.addEventListener('change', aplicarFiltros);
    selectEstado.addEventListener('change', aplicarFiltros);

    form.addEventListener('reset', () => {
        setTimeout(() => aplicarFiltros(), 0);
    })
}

/**
 * Obtiene los valores actuales de los filtros, filtra la lista de torneos
 * según esos criterios y vuelve a renderizar la tabla con los resultados.
 */
function aplicarFiltros() {
    const filtroTexto = document.getElementById('filtro_texto').value.toLowerCase();
    const filtroDisciplina = document.getElementById('filtro_disciplina').value;
    const filtroEstado = document.getElementById('filtro_estado').value;

    let torneosFiltrados = listaTorneos;

    if (filtroDisciplina) {
        torneosFiltrados = torneosFiltrados.filter(torneo => torneo.disciplina === filtroDisciplina);
    }

    if (filtroEstado) {
        torneosFiltrados = torneosFiltrados.filter(torneo => torneo.estado === parseInt(filtroEstado));
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

    renderizarTablaTorneos('tabla-torneos-placeholder', torneosFiltrados);
}

document.addEventListener('DOMContentLoaded', main);