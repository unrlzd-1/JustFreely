const axios = require('axios');
const cheerio = require('cheerio');

function normalizeTitle(title) {
  return title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
}

function calculateScore(movieTitle, movieYear, candidateTitle, candidateYear) {
  let score = 0;
  const normMovieTitle = normalizeTitle(movieTitle);
  const normCandidateTitle = normalizeTitle(candidateTitle);
  
  // Exact title match
  if (normMovieTitle === normCandidateTitle) {
    score += 20;
  } else if (normMovieTitle.includes(normCandidateTitle) || normCandidateTitle.includes(normMovieTitle)) {
    // Titles contain each other
    if (normMovieTitle.length > 0 && normCandidateTitle.length > 0) {
      if (normMovieTitle.includes(normCandidateTitle) && normCandidateTitle.includes(normMovieTitle)) {
        score += 10;
      } else {
        // One-way containment
        score += 5;
      }
    }
  }
  
  // Year matching
  if (candidateYear && movieYear) {
    const candYear = parseInt(candidateYear);
    const movYear = parseInt(movieYear);
    if (candYear === movYear) {
      score += 10;
    } else {
      score -= 5;
    }
  }
  
  return score;
}

async function searchMovie(title, year) {
  try {
    const searchQuery = encodeURIComponent(`${title} ${year}`);
    const url = `https://4khdhub.link/?s=${searchQuery}`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://4khdhub.link/',
        'Connection': 'keep-alive'
      },
      timeout: 15000
    });
    
    const $ = cheerio.load(response.data);
    let bestCandidate = null;
    let bestScore = -Infinity;
    
    // Loop through every a.movie-card
    $('a.movie-card').each((i, el) => {
      const href = $(el).attr('href');
      const titleElem = $(el).find('h3.movie-card-title');
      const name = titleElem.text().trim();
      const metaElem = $(el).find('p.movie-card-meta');
      const metaText = metaElem.text().trim();
      const candidateYear = metaText.substring(0, 4);
      
      if (!href || !name) return;
      
      const score = calculateScore(title, year, name, candidateYear);
      
      if (score > bestScore) {
        bestScore = score;
        bestCandidate = {
          href,
          title: name,
          year: candidateYear,
          score
        };
      }
    });
    
    // If final score is below 10, return null
    if (bestScore < 10 || !bestCandidate) {
      return null;
    }
    
    return bestCandidate;
  } catch (err) {
    console.error('Search error:', err.message);
    return null;
  }
}

module.exports = { searchMovie };