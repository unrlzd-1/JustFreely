const { getCache, setCache } = require('../../../lib/cache');
const { getMovieMeta } = require('../../../lib/cinemeta');
const { searchMovie } = require('../../../lib/search');
const { getDownloadLinks } = require('../../../lib/links');
const { resolveHubcloudLinks } = require('../../../lib/hubcloud');

function formatQuality(title) {
  const lower = title.toLowerCase();
  let quality = 'HD';
  if (lower.includes('4k') || lower.includes('2160p')) quality = '4K UHD';
  if (lower.includes('1080p')) quality = '1080p';
  if (lower.includes('720p')) quality = '720p';
  if (lower.includes('480p')) quality = '480p';
  
  let hdr = '';
  if (lower.includes('dolby vision') || lower.includes('dv')) hdr = ' · DV';
  if (lower.includes('hdr10+') || lower.includes('hdr+')) hdr = ' · HDR10+';
  else if (lower.includes('hdr')) hdr = ' · HDR';
  
  return quality + hdr;
}

function extractSizeFromTitle(title) {
  // Try to extract size info
  const match = title.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
  if (match) return match[1];
  return '';
}

module.exports = async function handler(req, res) {
  // Set CORS header as required
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { config, type, id } = req.query;
    
    // Clean ID - remove .json extension
    const cleanId = id ? id.replace('.json', '') : '';
    const cleanType = type || 'movie';
    
    // Decode config if present
    let userConfig = {};
    if (config) {
      try {
        const decoded = Buffer.from(config, 'base64').toString('utf-8');
        userConfig = JSON.parse(decoded);
      } catch (err) {
        console.error('Failed to decode config:', err);
      }
    }
    
    // Check cache first - use config + ID key
    const cacheKey = `${config || ''}_${cleanType}_${cleanId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }
    
    // Get metadata from Cinemeta
    const meta = await getMovieMeta(cleanType, cleanId);
    if (!meta || !meta.title) {
      return res.json({ streams: [] });
    }
    
    // Search for the movie/series on 4khdhub
    const searchResult = await searchMovie(meta.title, meta.year);
    if (!searchResult) {
      return res.json({ streams: [] });
    }
    
    // Get download links from the movie/series page
    const downloadLinks = await getDownloadLinks(cleanType, cleanId, searchResult.href);
    if (!downloadLinks || downloadLinks.length === 0) {
      return res.json({ streams: [] });
    }
    
    // Resolve hubcloud links in parallel
    const resolvedLinks = await resolveHubcloudLinks(downloadLinks);
    if (!resolvedLinks || resolvedLinks.length === 0) {
      return res.json({ streams: [] });
    }
    
    // Format streams according to Stremio's structure
    const streams = resolvedLinks.map((link, index) => {
      const qualityInfo = formatQuality(link.title || link.originalTitle || '');
      const size = link.size || extractSizeFromTitle(link.title || link.originalTitle || '');
      
      let description = '4K UHD · HDR';
      if (size) {
        description = `4K UHD · HDR · ${size}`;
      }
      
      // Build name - combine tier/title info
      const name = `4KHDHub | ${qualityInfo}`;
      
      return {
        url: link.url,
        name: name,
        description: description,
        behaviorHints: {
          notWebReady: true,
          proxyHeaders: {
            request: {
              Referer: 'https://carnewz.site/'
            }
          }
        }
      };
    });
    
    const result = { streams };
    
    // Save to cache with appropriate TTL
    const ttl = cleanType === 'series' ? 7200 : 21600; // 2 hours for series, 6 hours for movies
    await setCache(cacheKey, result, ttl);
    
    return res.json(result);
  } catch (err) {
    console.error('Stream handler error:', err);
    return res.json({ streams: [] });
  }
};