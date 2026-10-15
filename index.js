module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    name: '4KHDHub Stremio Addon',
    description: 'Use with Stremio: Configure with filters in the URL path as base64-encoded JSON',
    usage: 'https://your-domain.com/api/[base64-config]/manifest.json',
    example: 'https://your-domain.com/api/eyJmaWx0ZXJzIjp7fX0=/manifest.json'
  });
};