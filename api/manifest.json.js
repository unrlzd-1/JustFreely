const { addonBuilder } = require('stremio-addon-sdk');

module.exports = function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
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
    res.status(500).json({ error: err.message, stack: err.stack });
  }
};
