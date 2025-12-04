import { renderizarTablaTorneos } from "/scripts/torneos.js";
import { cargarComponentesComunes } from "/scripts/main.js";

/**
 * @file Archivo principal para las páginas estándar, como index.html.
 * Se encarga de cargar componentes comunes y mostrar una lista inicial de torneos.
 */

/**
 * Función principal que se ejecuta al cargar la página.
 * Carga los componentes comunes (header, banner, footer) y luego
 * obtiene y renderiza la lista de torneos.
 */
async function main() {
    await cargarComponentesComunes();
    document.querySelector('main').classList.add('fade-in');
    const listaTorneos = await fetch('/api/torneos').then(res => res.json());

    if(listaTorneos){
        await renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos.slice(0, 3));
    }
}

document.addEventListener('DOMContentLoaded', main);