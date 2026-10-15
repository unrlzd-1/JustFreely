const axios = require('axios');

async function getMovieMeta(type, id) {
  try {
    const cleanId = id.replace('.json', '');
    const response = await axios.get(
      `https://v3-cinemeta.strem.io/meta/${type}/${cleanId}.json`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );
    
    const meta = response.data?.meta;
    if (!meta) return null;
    
    return {
      title: meta.name,
      year: meta.year
    };
  } catch (err) {
    console.error('Cinemeta fetch error:', err.message);
    return null;
  }
}

module.exports = { getMovieMeta };