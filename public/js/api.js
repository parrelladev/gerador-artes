(function (global) {
  const manifestCache = {};

  async function loadManifest(template, page = 'index') {
    const cacheKey = `${template}/${page}`;
    if (manifestCache[cacheKey]) {
      return manifestCache[cacheKey];
    }

    const response = await fetch(`/api/templates/${template}/${page}`);
    if (!response.ok) {
      throw new Error('Template nÇœo encontrado');
    }

    const data = await response.json();
    manifestCache[cacheKey] = data;
    return data;
  }

  async function downloadGeneratedArtwork(arte) {
    let attempt = 0;
    const maxRetries = 5;

    // Tenta serializar a geraÇõÇœo quando o servidor estiver ocupado (BUSY/409)
    // com um backoff simples entre as tentativas.
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const response = await fetch('/api/generate/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ arte }),
      });

      if (response.status === 409 && attempt < maxRetries) {
        attempt += 1;
        const delay = 1500 * attempt;
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, delay));
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!response.ok) {
        let message = 'Erro ao gerar arte';
        try {
          // eslint-disable-next-line no-await-in-loop
          const errorBody = await response.json();
          if (errorBody && errorBody.detail) {
            message = errorBody.detail;
          }
        } catch (e) {
          // Ignora falha ao ler corpo de erro
        }
        throw new Error(message);
      }

      // eslint-disable-next-line no-await-in-loop
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'arte.png';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      return;
    }
  }

  async function extractNewsData(url) {
    try {
      const response = await fetch('/api/news/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        throw new Error('Erro ao extrair dados da notÇðcia');
      }

      return await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao extrair dados:', error);
      return {};
    }
  }

  global.Api = {
    loadManifest,
    downloadGeneratedArtwork,
    extractNewsData,
  };
})(window);
