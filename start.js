const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const readline = require("readline");
const { exec } = require("child_process");

// Interface para entrada no terminal
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Digite o link da notícia: ", async (url) => {
  try {
    const { data: html } = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(html);

    const meta = {
      h1: $('meta[property="og:title"]').attr("content") || null,
      h2: $('meta[property="og:description"]').attr("content") || null,
      bg: $('meta[property="og:image"]').attr("content") || null,
    };

    // Lê o arquivo data.json existente
    const filePath = "./input/data.json";
    const rawData = fs.readFileSync(filePath, "utf-8");
    const jsonData = JSON.parse(rawData);

    // Atualiza os campos h1, h2 e bg do primeiro objeto
    if (jsonData.length > 0) {
      jsonData[0].h1 = meta.h1;
      jsonData[0].h2 = meta.h2;
      jsonData[0].bg = meta.bg;
    }

    // Salva de volta no arquivo
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");

    console.log("✅ Arquivo data.json atualizado com sucesso!");

    // Executa o generate.js
    exec("node generate.js", (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Erro ao rodar generate.js: ${error.message}`);
        return;
      }
      if (stderr) {
        console.error(`⚠️ Erro: ${stderr}`);
        return;
      }
      console.log(`📜 Saída do generate.js:\n${stdout}`);
    });

  } catch (err) {
    console.error("❌ Erro ao buscar a página:", err.message);
  } finally {
    rl.close(); // Fecha a interface
  }
});
