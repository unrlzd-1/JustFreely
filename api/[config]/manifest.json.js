const { addonBuilder } = require('stremio-addon-sdk');

module.exports = function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    const config = req.query?.config;
    let userConfig = {};
    if (config) {
      try {
        const decoded = Buffer.from(config, 'base64').toString('utf-8');
        userConfig = JSON.parse(decoded);
      } catch (err) {
        console.error('Failed to decode config:', err);
      }
    }
    
    const builder = new addonBuilder({
      id: 'org.4khdhub.stremio-addon',
      version: '1.0.0',
      name: '4KHDHub Addon',
      description: 'Stremio addon for 4KHDHub streaming links',
      resources: ['stream'],
      types: ['movie', 'series'],
      idPrefixes: ['tt'],
      catalogs: [],
      behaviorHints: {
        configurable: true,
        configurationRequired: false
      }
    });
    
    const addonInterface = builder.getInterface();
    res.json(addonInterface.manifest);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
};
