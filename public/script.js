document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsTableBody = document.getElementById('resultsTableBody');

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
        resultsTableBody.innerHTML = '';
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
        resultsTableBody.innerHTML = '';
        results.forEach(item => {
            const tr = document.createElement('tr');
            
            const imgData = item.image ? `<img src="${item.image}" alt="Imagen del producto" loading="lazy" class="thumb">` : '<div class="no-img">Sin Imagen</div>';

            const originalPriceHtml = item.originalPrice ? `<div class="original-price">${item.originalPrice}</div>` : '';
            
            tr.innerHTML = `
                <td class="col-thumb">${imgData}</td>
                <td class="col-product">
                    <a href="${item.link}" target="_blank" class="product-link">
                        ${item.title}
                    </a>
                </td>
                <td class="col-price">
                    ${originalPriceHtml}
                    <div class="current-price">${item.price}</div>
                </td>
                <td class="col-installments">${item.installments || '-'}</td>
                <td class="col-shipping">
                    ${item.shippingStatus ? `<span class="shipping-badge">${item.shippingStatus}</span>` : '-'}
                </td>
            `;

            resultsTableBody.appendChild(tr);
        });
    }
});
