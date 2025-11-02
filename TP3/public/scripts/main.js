
/**
 * @file Archivo encargado de cargar los componentes repetidos.
 */

/**
 * Función que obtiene un componente HTML mediante su url y lo renderiza en la etiqueta con la ID objetivo.
 * @param {*} url - Path del componente a cargar.
 * @param {*} elementId - ID del elemento HTML objetivo.
 */
async function cargarComponente(url, elementId) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error al cargar ${url}`);
    const data = await response.text();
    const element = document.getElementById(elementId);
    if (element) element.innerHTML = data;
}

/**
 * Carga los componentes comunes de la página (header, banner y footer) en sus respectivos placeholders.
 * Utiliza Promise.all para realizar las cargas en paralelo.
 * @returns {*} Una promesa que se resuelve cuando todos los componentes han sido cargados.
 */
export function cargarComponentesComunes() {
    return Promise.all([
        cargarComponente("../components/header.html", "header-placeholder"),
        cargarComponente("../components/banner.html", "banner-placeholder"),
        cargarComponente("../components/footer.html", "footer-placeholder")
    ]);
}