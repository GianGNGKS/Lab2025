
function cargarComponente(url, elementId) {
    return fetch(url)
        .then(response => {
            if (!response.ok) throw new Error(`Error al cargar ${url}`);
            return response.text();
        })
        .then(data => {
            const element = document.getElementById(elementId);
            if (element) element.innerHTML = data;
        });
}

export function cargarComponentesComunes() {
    return Promise.all([
        cargarComponente("../components/header.html", "header-placeholder"),
        cargarComponente("../components/banner.html", "banner-placeholder"),
        cargarComponente("../components/footer.html", "footer-placeholder")
    ]);
}