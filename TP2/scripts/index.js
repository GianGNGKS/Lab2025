import { renderizarTablaTorneos, getTorneos } from "./torneos.js";
import { cargarComponentesComunes } from "./main.js";

async function main() {
    await cargarComponentesComunes();
    const listaTorneos = await getTorneos();

    if(listaTorneos){
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
    }
}

document.addEventListener('DOMContentLoaded', main);