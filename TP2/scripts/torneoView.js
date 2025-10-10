import { getTorneos } from './api.js';
import { renderizarTorneo } from './torneos.js';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);

    const idURL = params.get('id');


    const listaTorneos = await getTorneos();

    if (listaTorneos) {
        const torneoEncontrado = listaTorneos.find(torneo => torneo.torneo_id == idURL);

        if (torneoEncontrado) {
            renderizarTorneo('info-torneo-placeholder',torneoEncontrado);
        } else {
            console.error('Err: No se encontró ningún torneo.')
        }
    }
})

