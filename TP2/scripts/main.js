function cargarComponent(url, elementId) {
    fetch(url)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Error al cargar el componente: ${response.statusText}`
                );
            }
            return response.text();
        })
        .then((data) => {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = data;
            } else {
                console.error(`El elemento con id '${elementId}' no fue encontrado.`);
            }
        })
        .catch((error) => {
            console.error("Hubo un problema con la operación fetch:", error);
        });
}

document.addEventListener("DOMContentLoaded", () => {
    cargarComponent("../components/header.html", "header-placeholder");
    cargarComponent("../components/banner.html", "banner-placeholder");
    cargarComponent("../components/footer.html", "footer-placeholder");
});
