const axios = require('axios');
const cheerio = require('cheerio');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

function cleanText(value, limit) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text.length) return null;
  return limit ? text.substring(0, limit) : text;
}

async function fetch(url) {
  const { data: html } = await axios.get(url, {
    headers: { 'User-Agent': USER_AGENT },
    timeout: 10000,
  });

  const $ = cheerio.load(html);

  const h1 =
    $('meta[property="og:title"]').attr('content') ||
    $('title').text() ||
    $('h1').first().text() ||
    null;

  const h2 =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content') ||
    $('h2').first().text() ||
    null;

  const bg =
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="image"]').attr('content') ||
    $('img').first().attr('src') ||
    null;

  return {
    h1: cleanText(h1, 120),
    h2: cleanText(h2, 220),
    bg: cleanText(bg),
  };
}

module.exports = {
  fetch,
};
