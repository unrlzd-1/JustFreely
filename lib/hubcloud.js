const axios = require('axios');
const cheerio = require('cheerio');

async function resolveHubcloudLink(hubcloudUrl) {
  try {
    // 1. Fetch the hubcloud page to read the <title> tag and the a#download href
    const page1 = await axios.get(hubcloudUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': 'https://4khdhub.link/'
      },
      timeout: 20000,
      maxRedirects: 5
    });
    
    const $1 = cheerio.load(page1.data);
    const title = $1('title').text().trim();
    const downloadLink = $1('a#download').attr('href');
    
    if (!downloadLink) {
      return null;
    }
    
    // 2. Follow the gamerxyt link which redirects to carnewz.site/...
    const page2 = await axios.get(downloadLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Referer': hubcloudUrl
      },
      timeout: 20000,
      maxRedirects: 10,
      validateStatus: () => true
    });
    
    // Get the final HTML after redirects (axios follows redirects by default)
    const $2 = cheerio.load(page2.data);
    let finalUrl = null;
    
    // 3. Extract either Layout A (a#fsl) or Layout B (pixel.hubcloud.cx 10Gbps link)
    // Layout A
    const fslLink = $2('a#fsl').attr('href');
    if (fslLink) {
      finalUrl = fslLink;
    }
    
    // Layout B: pixel.hubcloud.cx 10Gbps link
    if (!finalUrl) {
      $2('a').each((i, el) => {
        const href = $2(el).attr('href');
        if (href && href.includes('pixel.hubcloud.cx')) {
          finalUrl = href;
          return false;
        }
      });
    }
    
    // Also try other patterns if needed
    if (!finalUrl) {
      $2('a').each((i, el) => {
        const href = $2(el).attr('href');
        if (href && (href.includes('.mp4') || href.includes('.mkv') || href.includes('cdn') || href.includes('drive'))) {
          finalUrl = href;
          return false;
        }
      });
    }
    
    if (!finalUrl) {
      return null;
    }
    
    return {
      url: finalUrl,
      title: title
    };
  } catch (err) {
    console.error('Hubcloud resolution error:', err.message);
    return null;
  }
}

async function resolveHubcloudLinks(links) {
  // Process each extracted hubcloud link in parallel using Promise.all
  const results = await Promise.all(
    links.map(async (link) => {
      const resolved = await resolveHubcloudLink(link.url);
      if (resolved) {
        return {
          ...resolved,
          originalTitle: link.title,
          size: link.size
        };
      }
      return null;
    })
  );
  
  return results.filter((r) => r !== null);
}

module.exports = { resolveHubcloudLink, resolveHubcloudLinks };