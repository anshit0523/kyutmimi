import React, { useState, useMemo } from 'react';
import { Search, Calendar, ExternalLink, TrendingUp, Globe, Clock, Tag, AlertCircle, Link2 } from 'lucide-react';

const NewsScraper = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [customUrl, setCustomUrl] = useState('');
  const [scrapingConfig, setScrapingConfig] = useState({
    articleSelector: 'article, .article, .post, .story',
    titleSelector: 'h1, h2, h3, .title, .headline',
    summarySelector: 'p, .summary, .excerpt, .description',
    linkSelector: 'a',
    timeSelector: 'time, .date, .timestamp'
  });

  // Backend API endpoint (you would need to implement this)
  const BACKEND_API = 'http://localhost:3001/api/scrape';

  const handleSearch = async () => {
    if (!customUrl) {
      setError('Please enter a news website URL to scrape');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      // Send request to your Node.js backend
      const response = await fetch(BACKEND_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: customUrl,
          selectors: scrapingConfig
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.articles && data.articles.length > 0) {
        setArticles(data.articles);
      } else {
        setError('No articles found. Try adjusting the CSS selectors.');
      }
    } catch (err) {
      console.error('Scraping error:', err);
      setError('Failed to scrape news articles. Make sure your backend server is running.');
    } finally {
      setLoading(false);
    }
  };



  const filteredAndSortedArticles = useMemo(() => {
    let filtered = articles.filter(article => {
      if (!searchTerm.trim()) return true;
      
      const searchLower = searchTerm.toLowerCase().trim();
      const titleLower = article.title.toLowerCase();
      
      // Check if title starts with the search term
      return titleLower.startsWith(searchLower);
    });

    if (sortBy === 'date') {
      filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    } else if (sortBy === 'source') {
      filtered.sort((a, b) => a.source.localeCompare(b.source));
    }

    return filtered;
  }, [articles, searchTerm, sortBy]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      Technology: 'primary',
      World: 'success',
      Health: 'danger',
      Business: 'warning',
      Sports: 'info',
      Politics: 'secondary',
      General: 'dark'
    };
    return colors[category] || 'secondary';
  };

  return (
    <>
      {/* Bootstrap CSS */}
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css" 
        rel="stylesheet" 
      />
      
      <div className="min-vh-100" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
        <div className="container py-5">
          {/* Header */}
          <div className="text-center mb-5">
            <h1 className="display-4 fw-bold text-white mb-3">
              <Globe className="me-3" size={48} />
              Universal News Scraper
            </h1>
            <p className="lead text-white-50">
              Scrape news from any website using custom CSS selectors and Cheerio
            </p>
          </div>

          {/* URL Input Section */}
          <div className="card shadow-lg mb-4">
            <div className="card-body p-4">
              <h5 className="card-title mb-3">
                <Link2 className="me-2" size={20} />
                Website URL
              </h5>
              <div className="row g-3">
                <div className="col-md-8">
                  <input
                    type="url"
                    className="form-control form-control-lg"
                    placeholder="Enter news website URL (e.g., https://www.bbc.com/news)"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    className="btn btn-primary btn-lg w-100"
                    onClick={handleSearch}
                    disabled={loading || !customUrl}
                  >
                    {loading ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Scraping...
                      </>
                    ) : (
                      <>
                        <Search className="me-2" size={20} />
                        Scrape News
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="card shadow-lg mb-5">
            <div className="card-body p-4">
              <div className="row g-3">
                {/* Search Input */}
                <div className="col-md-8">
                  <div className="input-group">
                    <span className="input-group-text">
                      <Search size={20} />
                    </span>
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      placeholder="Search articles..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* Sort By */}
                <div className="col-md-4">
                  <select
                    className="form-select form-select-lg"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="date">Date</option>
                    <option value="source">Source</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-warning d-flex align-items-center mb-4" role="alert">
              <AlertCircle className="me-2" size={20} />
              <div>
                <strong>Notice:</strong> {error}
              </div>
            </div>
          )}

          {/* Results Stats */}
          {filteredAndSortedArticles.length > 0 && (
            <div className="card mb-4">
              <div className="card-body py-3">
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="mb-0">
                      <TrendingUp className="me-2" size={20} />
                      Found {filteredAndSortedArticles.length} articles
                    </h5>
                  </div>
                  <div className="col-md-6 text-md-end">
                    <small className="text-muted">
                      <Clock className="me-1" size={16} />
                      Last scraped: {new Date().toLocaleTimeString()}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Articles Grid */}
          <div className="row">
            {filteredAndSortedArticles.map((article) => (
              <div key={article.id} className="col-lg-6 col-xl-4 mb-4">
                <div className="card h-100 shadow-sm hover-shadow">
                  <div className="card-body d-flex flex-column">
                    {/* Category Badge */}
                    <div className="mb-3">
                      <span className={`badge bg-${getCategoryColor(article.category)} me-2`}>
                        <Tag size={14} className="me-1" />
                        {article.category}
                      </span>
                      <small className="text-muted">{article.readTime}</small>
                    </div>

                    {/* Title */}
                    <h5 className="card-title fw-bold mb-3 flex-grow-1">
                      {article.title}
                    </h5>

                    {/* Summary */}
                    <p className="card-text text-muted mb-3 flex-grow-1">
                      {article.summary}
                    </p>

                    {/* Footer */}
                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <small className="text-muted d-block">
                            <strong>{article.source}</strong>
                          </small>
                          <small className="text-muted">
                            <Calendar size={14} className="me-1" />
                            {formatDate(article.publishedAt)}
                          </small>
                        </div>
                      </div>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary w-100"
                      >
                        <ExternalLink size={16} className="me-2" />
                        Read Full Article
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* No Results */}
          {!loading && filteredAndSortedArticles.length === 0 && articles.length > 0 && (
            <div className="text-center py-5">
              <div className="card">
                <div className="card-body py-5">
                  <h4 className="text-muted mb-3">No articles found</h4>
                  <p className="text-muted">
                    Try adjusting your search terms to find more articles.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && articles.length === 0 && (
            <div className="text-center py-5">
              <div className="card">
                <div className="card-body py-5">
                  <Globe size={64} className="text-muted mb-4" />
                  <h4 className="text-muted mb-3">Ready to scrape any news website</h4>
                  <p className="text-muted">
                    Enter any news website URL and customize the CSS selectors to start scraping articles.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom CSS for hover effects */}
      <style jsx>{`
        .hover-shadow {
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .hover-shadow:hover {
          box-shadow: 0 8px 25px rgba(0,0,0,0.15) !important;
          transform: translateY(-2px);
        }
        .card {
          transition: transform 0.2s ease;
        }
      `}</style>
    </>
  );
};

export default NewsScraper;