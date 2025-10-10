import { renderizarTablaTorneos } from "./torneos.js";
import { getTorneos } from "./api.js";

document.addEventListener('DOMContentLoaded', async () => {
    const listaTorneos = await getTorneos();

    if(listaTorneos){
        renderizarTablaTorneos('tabla-torneos-placeholder', listaTorneos);
    }
})