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


///////////////////////////
// MODALES DE SWEETALERT2
///////////////////////////

/**
 * Muestra un modal con la clave de administrador después de crear un torneo.
 * @param {string} nombreTorneo - Nombre del torneo creado
 * @param {string} adminKey - Clave de administrador
 * @returns {Promise<void>}
 */
export async function mostrarClaveAdministrador(nombreTorneo, adminKey) {
    await Swal.fire({
        title: `🎉 Torneo "${nombreTorneo}" creado`,
        html: mostrarClaveHTML(adminKey, 'Administrador'),
        icon: 'success',
        confirmButtonText: '✅ Ya guardé mi clave',
        allowOutsideClick: false,
        allowEscapeKey: false,
        width: '650px',
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            confirmButton: 'modal-btn modal-btn-primario',
            actions: 'modal-acciones'
        }
    });
}

/**
 * Muestra un modal con la clave de participante después de inscribirse.
 * @param {string} nombreParticipante - Nombre del participante
 * @param {string} participanteKey - Clave de participante
 * @returns {Promise<void>}
 */
export async function mostrarClaveParticipante(nombreParticipante, participanteKey) {
    await Swal.fire({
        title: `🎉 ¡Bienvenido, ${nombreParticipante}!`,
        html: mostrarClaveHTML(participanteKey, 'Participante'),
        icon: 'success',
        confirmButtonText: '✅ Ya guardé mi clave',
        allowOutsideClick: false,
        allowEscapeKey: false,
        width: '650px',
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            confirmButton: 'modal-btn modal-btn-primario',
            actions: 'modal-acciones'
        }
    });
}

/**
 * Genera el HTML para mostrar una clave con botón de copiar.
 * @param {string} clave - La clave a mostrar
 * @param {string} tipoClave - Tipo de clave ('Administrador' o 'Participante')
 * @returns {string} HTML formateado
 */
function mostrarClaveHTML(clave, tipoClave) {
    return `
        <div class="modal-campo">
            <label class="modal-label">🔑 Clave de ${tipoClave}</label>
            <div style="display: flex; gap: 1rem; align-items: center;">
                <input 
                    type="text" 
                    class="modal-input" 
                    value="${clave}" 
                    readonly 
                    style="flex: 1; user-select: all; font-family: 'Courier New', monospace; font-weight: bold;">
                <button 
                    type="button"
                    class="modal-btn modal-btn-primario"
                    onclick="copiarClave('${clave}', this)"
                    style="flex: 0 0 auto; padding: 0.85rem 1.5rem;">
                    📋 Copiar
                </button>
            </div>
            <p class="modal-ayuda" style="color: #fbbf24; margin-top: 1rem; font-style: normal;">
                <strong>⚠️ IMPORTANTE:</strong> Ésta clave se muestra <strong>UNA SOLA VEZ</strong>.<br>
                Guardala en un lugar seguro antes de continuar.
            </p>
        </div>
    `;
}

/**
 * Función global para copiar clave al portapapeles.
 * Se llama desde el botón en el HTML generado.
 * @param {string} clave - Clave a copiar
 * @param {HTMLElement} boton - Elemento del botón
 */
window.copiarClave = async function (clave, boton) {
    try {
        await navigator.clipboard.writeText(clave);
        const textoOriginal = boton.innerHTML;
        boton.innerHTML = '✅ Copiado';
        setTimeout(() => {
            boton.innerHTML = textoOriginal;
        }, 2000);
    } catch (error) {
        console.error('Error al copiar:', error);
        boton.innerHTML = '❌ Error';

        setTimeout(() => {
            boton.innerHTML = '📋 Copiar';
        }, 2000);
    }
};

/**
 * Muestra un modal de confirmación para acciones destructivas.
 * @param {Object} options - Opciones de configuración
 * @param {string} options.title - Título del modal
 * @param {string} options.text - Texto descriptivo
 * @param {string} options.confirmText - Texto del botón de confirmar, por defecto 'Confirmar'
 * @param {string} options.cancelText - Texto del botón de cancelar, por defecto 'Cancelar'
 * @returns {Promise<boolean>} true si confirmó, false si canceló
 */
export async function confirmarAccion({ title, text, confirmText = 'Confirmar', cancelText = 'Cancelar' }) {
    const result = await Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: cancelText,
        reverseButtons: true,
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            confirmButton: 'modal-btn modal-btn-primario',
            cancelButton: 'modal-btn modal-btn-secundario',
            actions: 'modal-acciones'
        }
    });

    return result.isConfirmed;
}

/**
 * Muestra un prompt para ingresar texto con validación.
 * @param {Object} options - Opciones de configuración
 * @param {string} options.title - Título del prompt
 * @param {string} options.text - Texto descriptivo
 * @param {string} options.inputPlaceholder - Placeholder del input
 * @param {string} options.valorEsperado - Valor que debe coincidir (opcional)
 * @returns {Promise<string|null>} Valor ingresado o null si canceló
 */
export async function solicitarTexto({ title, text, inputPlaceholder, valorEsperado = null }) {
    const result = await Swal.fire({
        title: title,
        html: text,
        input: 'text',
        inputPlaceholder: inputPlaceholder,
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            input: 'modal-input',
            confirmButton: 'modal-btn modal-btn-primario',
            cancelButton: 'modal-btn modal-btn-secundario',
            actions: 'modal-acciones'
        },
        inputValidator: (value) => {
            if (!value) {
                return 'Este campo es obligatorio';
            }
            if (valorEsperado && value !== valorEsperado) {
                return 'El valor ingresado no coincide';
            }
        }
    });

    return result.isConfirmed ? result.value : null;
}

/**
 * Muestra una notificación toast en la esquina de la página.
 * @param {Object} options - Opciones de configuración
 * @param {string} options.icon - 'success' | 'error' | 'warning' | 'info'
 * @param {string} options.title - Título del toast
 * @param {number} options.timer - Duración en ms (por defecto 3000)
 */
export function mostrarToast({ icon, title, timer = 3000 }) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: timer,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: icon,
        title: title
    });
}

/**
 * Muestra un mensaje de error formateado.
 * @param {string} mensaje - Mensaje de error
 */
export async function mostrarError(mensaje) {
    await Swal.fire({
        title: '❌ Error',
        text: mensaje,
        icon: 'error',
        confirmButtonText: 'Entendido',
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            confirmButton: 'modal-btn modal-btn-secundario',
            actions: 'modal-acciones'
        }
    });
}

/**
 * Muestra un mensaje de éxito simple.
 * @param {string} mensaje - Mensaje de éxito
 */
export async function mostrarExito(mensaje) {
    await Swal.fire({
        title: '✅ Éxito',
        text: mensaje,
        icon: 'success',
        confirmButtonText: 'Continuar',
        timer: 2000,
        timerProgressBar: true,
        customClass: {
            popup: 'modal-contenido',
            title: 'modal-titulo',
            htmlContainer: 'modal-body',
            confirmButton: 'modal-btn modal-btn-primario',
            actions: 'modal-acciones'
        }
    });
}