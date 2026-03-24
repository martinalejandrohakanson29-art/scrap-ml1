document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const loadingEl = document.getElementById('loading');
    const errorEl = document.getElementById('error');
    const resultsTableBody = document.getElementById('resultsTableBody');
    const thPrecio = document.getElementById('thPrecio');
    const sortIndicator = document.getElementById('sortIndicator');

    let allResults = [];
    let sortOrder = null; // null | 'asc' | 'desc'

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    thPrecio.addEventListener('click', () => {
        if (allResults.length === 0) return;
        if (sortOrder === 'asc') {
            sortOrder = 'desc';
        } else {
            sortOrder = 'asc';
        }
        sortIndicator.textContent = sortOrder === 'asc' ? '↑' : '↓';
        const sorted = [...allResults].sort((a, b) => {
            const pa = parsePrice(a.price);
            const pb = parsePrice(b.price);
            return sortOrder === 'asc' ? pa - pb : pb - pa;
        });
        renderResults(sorted);
    });

    async function performSearch() {
        const keyword = searchInput.value.trim();
        if (!keyword) return;

        // Reset state
        errorEl.classList.add('hidden');
        resultsTableBody.innerHTML = '';
        loadingEl.classList.remove('hidden');
        allResults = [];
        sortOrder = null;
        sortIndicator.textContent = '';

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(keyword)}`);
            const data = await response.json();

            loadingEl.classList.add('hidden');

            if (!response.ok) {
                showError(data.error || 'Error al obtener los datos. Intente nuevamente.');
                return;
            }

            if (!data.results || data.results.length === 0) {
                showError('No se encontraron resultados para esta búsqueda');
                return;
            }

            allResults = data.results;
            renderResults(allResults);
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

    // Convierte "$ 1.234.567" o "$ 1.234,56" a número
    function parsePrice(priceStr) {
        if (!priceStr) return 0;
        const clean = priceStr
            .replace('$', '')
            .trim()
            .replace(/\./g, '')   // quita separadores de miles (punto en AR)
            .replace(',', '.');   // convierte coma decimal a punto
        return parseFloat(clean) || 0;
    }

    function renderResults(results) {
        resultsTableBody.innerHTML = '';
        results.forEach(item => {
            const tr = document.createElement('tr');

            const imgData = item.image
                ? `<img src="${item.image}" alt="Imagen del producto" loading="lazy" class="thumb">`
                : '<div class="no-img">Sin Imagen</div>';

            const originalPriceHtml = item.originalPrice
                ? `<div class="original-price">${item.originalPrice}</div>`
                : '';

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
                <td class="col-seller">${item.seller === 'Publicidad' ? '<span class="seller-ad">Publicidad</span>' : (item.seller || '-')}</td>
            `;

            resultsTableBody.appendChild(tr);
        });
    }
});
