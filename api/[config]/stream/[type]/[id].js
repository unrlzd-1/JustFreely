const { getCache, setCache } = require('../../../../lib/cache');
const { getMovieMeta } = require('../../../../lib/cinemeta');
const { searchMovie } = require('../../../../lib/search');
const { getDownloadLinks } = require('../../../../lib/links');
const { resolveHubcloudLinks } = require('../../../../lib/hubcloud');

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
  const match = title.match(/(\d+(?:\.\d+)?\s*(?:GB|MB|TB))/i);
  if (match) return match[1];
  return '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { config, type, id } = req.query;
    const cleanId = id ? id.replace('.json', '') : '';
    const cleanType = type || 'movie';
    const cacheKey = `${config || ''}_${cleanType}_${cleanId}`;
    try {
      const cached = await getCache(cacheKey);
      if (cached) return res.json(cached);
    } catch (e) {
      console.error('Cache get error:', e);
    }
    const meta = await getMovieMeta(cleanType, cleanId);
    if (!meta || !meta.title) return res.json({ streams: [] });
    const searchResult = await searchMovie(meta.title, meta.year);
    if (!searchResult) return res.json({ streams: [] });
    const downloadLinks = await getDownloadLinks(cleanType, cleanId, searchResult.href);
    if (!downloadLinks || downloadLinks.length === 0) return res.json({ streams: [] });
    const resolvedLinks = await resolveHubcloudLinks(downloadLinks);
    if (!resolvedLinks || resolvedLinks.length === 0) return res.json({ streams: [] });
    const streams = resolvedLinks.map((link) => {
      const qualityInfo = formatQuality(link.title || link.originalTitle || '');
      const size = link.size || extractSizeFromTitle(link.title || link.originalTitle || '');
      let description = '4K UHD · HDR';
      if (size) description = `4K UHD · HDR · ${size}`;
      return {
        url: link.url,
        name: `4KHDHub | ${qualityInfo}`,
        description,
        behaviorHints: { notWebReady: true, proxyHeaders: { request: { Referer: 'https://carnewz.site/' } } }
      };
    });
    const result = { streams };
    const ttl = cleanType === 'series' ? 7200 : 21600;
    try { await setCache(cacheKey, result, ttl); } catch (e) { console.error('Cache set error:', e); }
    return res.json(result);
  } catch (err) {
    console.error('Stream handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
