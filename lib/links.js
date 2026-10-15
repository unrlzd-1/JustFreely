const axios = require('axios');
const cheerio = require('cheerio');

function parseSeriesId(id) {
  // Series ID format: tt1234567:1:2 (season:episode)
  const cleanId = id.replace('.json', '');
  const parts = cleanId.split(':');
  if (parts.length === 3) {
    const season = parseInt(parts[1]).toString().padStart(2, '0');
    const episode = parseInt(parts[2]).toString().padStart(2, '0');
    return `S${season}E${episode}`;
  }
  return null;
}

async function getDownloadLinks(type, id, pageUrl) {
  try {
    const response = await axios.get(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://4khdhub.link/'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    const links = [];
    
    if (type === 'movie') {
      // Loop through every a.btn element
      $('a.btn').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        
        if (href && href.includes('hubcloud.foo/drive')) {
          if (text.includes('hubcloud') && !text.includes('hubdrive')) {
            links.push({
              url: href,
              title: $(el).text().trim()
            });
          }
        }
      });
    } else if (type === 'series') {
      const episodeTag = parseSeriesId(id);
      if (!episodeTag) return links;
      
      // Loop through .episode-item groups
      $('.episode-item').each((i, epEl) => {
        const epTitle = $(epEl).find('h3.episode-title').text().toLowerCase();
        // Also check if episode tag matches in title
        if (epTitle.includes(episodeTag.toLowerCase())) {
          $(epEl).find('.episode-download-item').each((j, dlEl) => {
            const fileTitle = $(dlEl).find('.episode-file-title').text().toLowerCase();
            const badgeSize = $(dlEl).find('.badge-size').text().trim();
            
            // Match episode-file-title against requested episode tag
            if (fileTitle.includes(episodeTag.toLowerCase())) {
              $(dlEl).find('a').each((k, aEl) => {
                const href = $(aEl).attr('href');
                const linkText = $(aEl).text().toLowerCase();
                if (href && href.includes('hubcloud.foo/drive')) {
                  if (linkText.includes('hubcloud') && !linkText.includes('hubdrive')) {
                    links.push({
                      url: href,
                      title: $(aEl).text().trim(),
                      size: badgeSize
                    });
                  }
                }
              });
            }
          });
        }
      });
      
      // If no matches found by episode title grouping, do broader search
      if (links.length === 0) {
        $('.episode-download-item').each((i, dlEl) => {
          const fileTitle = $(dlEl).find('.episode-file-title').text().toLowerCase();
          const badgeSize = $(dlEl).find('.badge-size').text().trim();
          
          if (fileTitle.includes(episodeTag.toLowerCase())) {
            $(dlEl).find('a').each((j, aEl) => {
              const href = $(aEl).attr('href');
              const linkText = $(aEl).text().toLowerCase();
              if (href && href.includes('hubcloud.foo/drive')) {
                if (linkText.includes('hubcloud') && !linkText.includes('hubdrive')) {
                  links.push({
                    url: href,
                    title: $(aEl).text().trim(),
                    size: badgeSize
                  });
                }
              }
            });
          }
        });
      }
    }
    
    return links;
  } catch (err) {
    console.error('Get download links error:', err.message);
    return [];
  }
}

module.exports = { getDownloadLinks };