const express = require('express');
const { chromium } = require('playwright');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));

app.get('/api/search', async (req, res) => {
    const keyword = req.query.q;
    
    if (!keyword) {
        return res.status(400).json({ error: 'Falta la palabra clave para la búsqueda' });
    }

    let browser = null;
    try {
        console.log(`Iniciando búsqueda para: ${keyword}`);
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext({
             userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
             viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();
        
        const searchUrl = `https://listado.mercadolibre.com.ar/${encodeURIComponent(keyword)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        
        try {
            await page.waitForSelector('.ui-search-layout__item', { timeout: 5000 });
        } catch (e) {
            console.log('No se encontraron items (o cambió el selector o la página está vacía).');
        }

        const results = await page.evaluate(() => {
            const items = Array.from(document.querySelectorAll('.ui-search-layout__item, .poly-card'));
            
            const selectedItems = items.slice(0, 20);
            
            return selectedItems.map(item => {
                const titleEl = item.querySelector('h2') || item.querySelector('h3');
                const title = titleEl ? titleEl.innerText.trim() : 'Sin título';
                
                // Precio Original (si existe rebaja)
                const originalPriceEls = item.querySelectorAll('.andes-money-amount--previous .andes-money-amount__fraction, s .andes-money-amount__fraction');
                const originalPriceText = originalPriceEls.length > 0 ? originalPriceEls[0].innerText.trim() : null;
                const originalPrice = originalPriceText ? `$ ${originalPriceText}` : null;

                // Precio final actual
                const currentPriceSelectors = item.querySelectorAll('.poly-price__current .andes-money-amount__fraction, .ui-search-price__second-line .andes-money-amount__fraction');
                let priceText = '0';
                if (currentPriceSelectors.length > 0) {
                    priceText = currentPriceSelectors[0].innerText.trim();
                } else {
                    const priceEls = Array.from(item.querySelectorAll('.andes-money-amount__fraction'));
                    const mainPrices = priceEls.filter(el => !el.closest('.andes-money-amount--previous') && !el.closest('s'));
                    priceText = mainPrices.length > 0 ? mainPrices[0].innerText.trim() : '0';
                }
                
                const linkEl = item.querySelector('a');
                const link = linkEl ? linkEl.href : '';
                
                const imgEl = item.querySelector('img');
                let imgUrl = '';
                if (imgEl) {
                    imgUrl = imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                }

                // Financiación (cuotas)
                let installments = '';
                const instEl = item.querySelector('.poly-component__installments, .ui-search-item__group__element.ui-search-installments, [class*="installments"]');
                if (instEl) {
                    installments = instEl.innerText.trim();
                } else {
                    const allTexts = Array.from(item.querySelectorAll('span, p, div'));
                    const cuotas = allTexts.find(s => s.innerText && s.innerText.toLowerCase().includes('cuotas') && s.children.length === 0);
                    if (cuotas) {
                        installments = cuotas.innerText.trim();
                    }
                }
                installments = installments.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

                // Estado de Envío (Gratis / Full)
                const shippingEl = item.querySelector('.poly-component__shipping, .ui-search-item__fulfillment');
                const hasFull = item.querySelector('svg.ui-search-icon--full') !== null || !!item.querySelector('.ui-search-icon--full') || item.innerHTML.includes('icon-full');
                let shippingStatus = '';
                if (shippingEl && shippingEl.innerText.toLowerCase().includes('gratis')) {
                    shippingStatus = 'Envío Gratis';
                }
                if (hasFull) {
                    shippingStatus = shippingStatus ? shippingStatus + ' ⚡ Full' : '⚡ Full';
                }
                
                return {
                    title,
                    price: `$ ${priceText}`,
                    originalPrice,
                    link,
                    image: imgUrl,
                    installments,
                    shippingStatus
                };
            });
        });

        await browser.close();
        browser = null;

        res.json({ results });
    } catch (error) {
        console.error('Error durante el scraping:', error);
        if (browser) {
            await browser.close();
        }
        res.status(500).json({ error: 'Error al obtener los datos. Intente nuevamente.' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
