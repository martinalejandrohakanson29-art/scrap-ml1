document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsGrid = document.getElementById('resultsGrid');

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    async function performSearch() {
        const keyword = searchInput.value.trim();
        if (!keyword) return;

        // Reset state
        errorEl.classList.add('hidden');
        resultsGrid.innerHTML = '';
        loadingEl.classList.remove('hidden');

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
            const data = await response.json();

            loadingEl.classList.add('hidden');

            if (!response.ok) {
                // If the scraper failed
                showError(data.error || 'Error al obtener los datos. Intente nuevamente.');
                return;
            }

            if (!data.results || data.results.length === 0) {
                showError('No se encontraron resultados para esta búsqueda');
                return;
            }

            renderResults(data.results);
        } catch (error) {
            loadingEl.classList.add('hidden');
            showError('Error al obtener los datos. Intente nuevamente.');
            console.error(error);
        }
    }

    function showError(message) {
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    function renderResults(results) {
        resultsGrid.innerHTML = '';
        results.forEach(item => {
            const card = document.createElement('div');
            card.className = 'card';
            
            const imgData = item.image ? `<img src="${item.image}" alt="Imagen del producto" loading="lazy">` : '<div style="height:100%; display:flex; align-items:center;">Sin Imagen</div>';

            card.innerHTML = `
                <div class="card-img-container">
                    ${imgData}
                </div>
                <div class="card-content">
                    <h2>${item.title}</h2>
                    <div class="price">${item.price}</div>
                    <a href="${item.link}" target="_blank" class="card-btn">Ver producto</a>
                </div>
            `;
            resultsGrid.appendChild(card);
        });
    }
});
