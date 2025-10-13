import { cargarComponentesComunes } from "./main.js";
import { getTorneos, renderizarTablaTorneos } from "./torneos.js";

let listaTorneos = []

async function main() {
    await Promise.all([cargarComponentesComunes()]);

    listaTorneos = await getTorneos() || [];

    if (listaTorneos) {
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
    }

    inicializarFiltros();
}

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