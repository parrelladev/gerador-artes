const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const data = JSON.parse(fs.readFileSync('./input/data.json', 'utf-8'));
  const templatePath = 'templates/index.html';
  const templateURL = 'file://' + path.resolve(templatePath);
  const outputDir = './output';

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350 });

  for (let i = 0; i < data.length; i++) {
    const { h1, h2, bg, logo } = data[i];
    await page.goto(templateURL);

    const bgPath = bg.startsWith('http') ? bg : 'file://' + path.resolve('./input/' + bg + '.png');
    const logoPath = logo.startsWith('http') ? logo : 'file://' + path.resolve('./input/' + logo + '.png');

    await page.evaluate(({ h1, h2, bgPath, logoPath }) => {
      document.getElementById('title').textContent = h1;
      document.getElementById('subtitle').textContent = h2;
      document.getElementById('bg').src = bgPath;
      document.getElementById('logo').src = logoPath;
    }, { h1, h2, bgPath, logoPath });

    // Aguarda o carregamento de imagens e fontes
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => img.onload = img.onerror = resolve);
      }));
    });

    const outputFilePath = path.join(outputDir, `arte_${i + 1}.png`);
    await page.screenshot({ path: outputFilePath });
    console.log(`✅ Imagem salva: ${outputFilePath}`);
  }

  await browser.close();
})();
