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
                
                // Precios usualmente usan la clase andes-money-amount__fraction
                // o poly-price__current en la nueva UI de mercadolibre
                const priceEls = item.querySelectorAll('.andes-money-amount__fraction');
                const priceText = priceEls.length > 0 ? priceEls[0].innerText.trim() : '0';
                
                const linkEl = item.querySelector('a');
                const link = linkEl ? linkEl.href : '';
                
                const imgEl = item.querySelector('img');
                let imgUrl = '';
                if (imgEl) {
                    imgUrl = imgEl.getAttribute('data-src') || imgEl.getAttribute('src');
                }
                
                return {
                    title,
                    price: `$ ${priceText}`,
                    link,
                    image: imgUrl
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
