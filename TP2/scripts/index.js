import { renderizarTablaTorneos, getTorneos } from "./torneos.js";
import { cargarComponentesComunes } from "./main.js";

/**
 * @file Archivo principal para la página de inicio (index.html).
 * Se encarga de cargar componentes comunes y mostrar una lista inicial de torneos.
 */

/**
 * Función principal que se ejecuta al cargar la página.
 * Carga los componentes comunes (header, banner, footer) y luego
 * obtiene y renderiza la lista de torneos.
 */
async function main() {
    await cargarComponentesComunes();
    const listaTorneos = await getTorneos();

    if(listaTorneos){
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos.slice(0, 3));
    }
}

document.addEventListener('DOMContentLoaded', main);