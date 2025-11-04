/**
 * @file Contiene constantes y funciones de utilidad para el manejo de datos de la aplicación.
 */

/**
 * Objeto inmutable que define las formatos de disciplinas disponibles de los torneos.
 * Cada disciplina tiene una clave, un valor para JSON y un nombre para mostrar en la web.
 * @type {Object<string, {key: string, valorJSON: string, nombreDisplay: string}>}
 */
export const DISCIPLINAS = Object.freeze({
    FUTBOL: {
        key: 'FUTBOL',
        valorJSON: 'futbol',
        nombreDisplay: 'Fútbol'
    },
    COUNTER_STRIKE: {
        key: 'COUNTER_STRIKE',
        valorJSON: 'counter_strike_2',
        nombreDisplay: 'Counter-Strike 2'
    },
    VOLLEY: {
        key: 'VOLLEY',
        valorJSON: 'volley',
        nombreDisplay: 'Volley'
    },
    LEAGUE_OF_LEGENDS: {
        key: 'LEAGUE_OF_LEGENDS',
        valorJSON: 'league_of_legends',
        nombreDisplay: 'League of Legends'
    },
    BASKET: {
        key: 'BASKET',
        valorJSON: 'basket',
        nombreDisplay: 'Basket'
    }
});

/**
 * Busca y devuelve el objeto de una disciplina a partir de su valor JSON.
 * @param {string} valorJSON - El valor obtenido del JSON a buscar.
 * @returns {{key: string, valorJSON: string, nombreDisplay: string}|undefined} El objeto de la disciplina si se encuentra, o undefined si no.
 */
function encontrarDisciplinaJSON(valorJSON) {
    return Object.values(DISCIPLINAS).find(d => d.valorJSON === valorJSON);
}

/**
 * Objeto inmutable que define los posibles estados de un torneo.
 * Cada estado tiene un valor numérico para JSON, un nombre para mostrar y una clase CSS asociada.
 * @type {Object<string, {valorJSON: number, nombreDisplay: string, className: string}>}
 */
export const ESTADO_TORNEO = Object.freeze({
    NOT_STARTED: {
        valorJSON: 0,
        nombreDisplay: 'Sin comenzar',
        className: 'estado-sin-comenzar'
    },
    IN_PROGRESS: {
        valorJSON: 1,
        nombreDisplay: 'En curso',
        className: 'estado-en-curso'
    },
    FINISHED: {
        valorJSON: 2,
        nombreDisplay: 'Finalizado',
        className: 'estado-finalizado'
    }
});

/**
 * Busca y devuelve el objeto de un estado de torneo a partir de su valor JSON.
 * @param {number} valorJSON - El valor obtenido del JSON a buscar.
 * @returns {{valorJSON: number, nombreDisplay: string, className: string}|undefined} El objeto del estado si se encuentra, o undefined si no.
 */
function encontrarEstadoJSON(valorJSON) {
    return Object.values(ESTADO_TORNEO).find(s => s.valorJSON === valorJSON);
}

export function getDisplayInfo(tipo, valorJSON) {
    const desconocido = { text: 'Desconocido', className: '' };
    if (tipo === 'disciplina') {
        const disciplina = encontrarDisciplinaJSON(valorJSON);
        return disciplina ? disciplina : desconocido;
    } else if (tipo === 'estado') {
        const estado = encontrarEstadoJSON(valorJSON);
        return estado ? estado : desconocido;
    }
    return desconocido;
}

/**
 * Función para procesar y formatear la fecha en un formato legible.
 * @param {string} fechaStr - La fecha en formato YYYY-MM-DD.
 * @returns {string} La fecha formateada en DD/MM/YYYY.
 */
export function formatearFecha(fechaStr) {
    const fecha = new Date(fechaStr);
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

/**
 * Genera un color hexadecimal aleatorio y vibrante.
 * @returns {string} Un color en formato RGB hexadecimal (e.g., #A1B2C3).
 */
export function generarColorAleatorio() {
    return `rgb(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)})`;
}