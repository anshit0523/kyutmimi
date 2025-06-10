const express = require('express');
const cheerio = require('cheerio');
const axios = require('axios');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Scraping endpoint
app.post('/api/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Default selectors that work with most news sites
    const selectors = {
      article: 'article, .article, .post, .story, .news-item, [class*="article"], [class*="story"], .entry',
      title: 'h1, h2, h3, .title, .headline, [class*="title"], [class*="headline"], .entry-title',
      summary: 'p, .summary, .excerpt, .description, [class*="summary"], [class*="excerpt"], .entry-summary',
      link: 'a',
      time: 'time, .date, .timestamp, [class*="date"], [class*="time"], .published'
    };
    
    // Fetch the webpage
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
      timeout: 15000,
      maxRedirects: 5
    });
    
    // Load HTML into Cheerio
    const $ = cheerio.load(response.data);
    const articles = [];
    
    // Extract articles
    $(selectors.article).each((index, element) => {
      if (index >= 25) return false; // Limit to 25 articles
      
      const $el = $(element);
      
      // Extract title
      const titleEl = $el.find(selectors.title).first();
      const title = titleEl.text().trim();
      
      // Extract summary
      const summaryEl = $el.find(selectors.summary).first();
      let summary = summaryEl.text().trim();
      
      // If no summary found, try getting first paragraph
      if (!summary) {
        summary = $el.find('p').first().text().trim();
      }
      
      // Extract link
      const linkEl = $el.find(selectors.link).first();
      let link = linkEl.attr('href');
      
      // Make relative URLs absolute
      if (link && !link.startsWith('http')) {
        const baseUrl = new URL(url);
        link = new URL(link, baseUrl.origin).href;
      }
      
      // Extract time
      const timeEl = $el.find(selectors.time).first();
      const timeText = timeEl.text().trim() || timeEl.attr('datetime');
      
      // Only add if we have a meaningful title
      if (title && title.length > 15 && title.length < 200) {
        articles.push({
          id: articles.length + 1,
          title: title,
          summary: summary.length > 300 ? summary.substring(0, 300) + '...' : summary || 'No summary available',
          source: new URL(url).hostname.replace('www.', ''),
          publishedAt: parseTimeString(timeText) || new Date().toISOString(),
          url: link || url,
          category: determineCategory(title + ' ' + summary),
          readTime: `${Math.max(1, Math.ceil((summary || title).length / 200))} min read`
        });
      }
    });
    
    // Remove duplicates based on title similarity
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => 
        a.title.toLowerCase().substring(0, 50) === article.title.toLowerCase().substring(0, 50)
      )
    );
    
    res.json({ 
      articles: uniqueArticles.slice(0, 20),
      total: uniqueArticles.length,
      source: new URL(url).hostname
    });
    
  } catch (error) {
    console.error('Scraping error:', error.message);
    res.status(500).json({ 
      error: 'Failed to scrape website',
      details: error.message 
    });
  }
});

// Helper function to parse time strings
function parseTimeString(timeStr) {
  if (!timeStr) return null;
  
  const now = new Date();
  const lowerTime = timeStr.toLowerCase();
  
  // Handle relative times
  if (lowerTime.includes('hour') || lowerTime.includes('hr')) {
    const hours = parseInt(lowerTime.match(/\d+/)?.[0] || '1');
    return new Date(now.getTime() - hours * 60 * 60 * 1000).toISOString();
  }
  
  if (lowerTime.includes('minute') || lowerTime.includes('min')) {
    const minutes = parseInt(lowerTime.match(/\d+/)?.[0] || '30');
    return new Date(now.getTime() - minutes * 60 * 1000).toISOString();
  }
  
  if (lowerTime.includes('day')) {
    const days = parseInt(lowerTime.match(/\d+/)?.[0] || '1');
    return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
  }
  
  // Try parsing as standard date
  const parsed = new Date(timeStr);
  return parsed.toString() !== 'Invalid Date' ? parsed.toISOString() : null;
}

// Helper function to determine category
function determineCategory(content) {
  const lower = content.toLowerCase();
  
  if (/(tech|ai|software|computer|digital|cyber|robot|algorithm)/.test(lower)) return 'Technology';
  if (/(health|medical|doctor|hospital|disease|vaccine|medicine)/.test(lower)) return 'Health';
  if (/(business|economy|market|finance|stock|trade|company)/.test(lower)) return 'Business';
  if (/(sport|football|soccer|basketball|tennis|game|match)/.test(lower)) return 'Sports';
  if (/(politic|government|election|vote|president|minister)/.test(lower)) return 'Politics';
  if (/(climate|environment|green|carbon|pollution|energy)/.test(lower)) return 'World';
  
  return 'General';
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'News scraper API is running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 News scraper backend running on http://localhost:${PORT}`);
  console.log(`📝 API endpoint: http://localhost:${PORT}/api/scrape`);
});