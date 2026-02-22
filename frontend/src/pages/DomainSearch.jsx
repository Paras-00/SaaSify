import { Check, DollarSign, Filter, Loader2, Search, ShoppingCart, X } from 'lucide-react';
import { useState } from 'react';

import cartService from '../services/cartService';
import { domainService } from '../services/domainService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const POPULAR_TLDS = ['.com', '.net', '.org', '.io', '.co', '.app', '.dev', '.ai'];

export default function DomainSearch() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedTlds, setSelectedTlds] = useState(POPULAR_TLDS);
  const [showFilters, setShowFilters] = useState(false);
  const [addingToCart, setAddingToCart] = useState({});

  const handleSearch = async (e) => {
    e?.preventDefault();

    if (!searchQuery.trim()) {
      toast.error('Please enter a domain name');
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);

      const response = await domainService.searchDomains({
        query: searchQuery.trim().toLowerCase(),
        tlds: selectedTlds, // Pass array directly, axios will serialize it properly
        checkAvailability: true,
        maxResults: 20,
      });

      setSearchResults(response.data.results || []);

      if (response.data.results?.length === 0) {
        toast.error('No domains found for your search');
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search domains');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTldToggle = (tld) => {
    setSelectedTlds(prev =>
      prev.includes(tld)
        ? prev.filter(t => t !== tld)
        : [...prev, tld]
    );
  };

  const handleAddToCart = async (domain) => {
    try {
      setAddingToCart(prev => ({ ...prev, [domain.domain]: true }));

      // Extract TLD from domain name
      const domainName = domain.domain;
      const tld = domainName.substring(domainName.lastIndexOf('.')).toLowerCase();

      await cartService.addToCart({
        type: 'domain',
        itemId: domainName,
        name: domainName,
        price: domain.price > 0 ? domain.price : 9.99, // Ensure positive price, fallback if 0
        period: 1, // years
        quantity: 1,
        currency: 'USD',
        metadata: {
          domain: domainName,
          tld: tld,
          privacy: true,
          autoRenew: true,
        }
      });

      toast.success('Added to cart!');

      // Update the result to show it's in cart
      setSearchResults(prev =>
        prev.map(result =>
          result.domain === domain.domain
            ? { ...result, inCart: true }
            : result
        )
      );
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingToCart(prev => ({ ...prev, [domain.domain]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-brand-black py-20 font-sans">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-serif font-medium text-brand-text-primary mb-6">
            Find Your <span className="text-brand-green">Perfect Domain</span>
          </h1>
          <p className="text-xl text-brand-text-secondary max-w-2xl mx-auto">
            Search millions of domains and register yours instantly. Start building your digital presence today.
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-8 mb-12 relative overflow-hidden">
          {/* Ambient Glow */}
          {/* Background effect removed */}

          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 relative z-10">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 text-brand-text-secondary" size={24} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter domain name (e.g., mybusiness)"
                className="w-full pl-16 pr-6 py-5 bg-white border-2 border-brand-gray/40 rounded-xl text-brand-text-primary placeholder-brand-text-secondary focus:ring-2 focus:ring-brand-green/50 focus:border-brand-green/50 transition-all text-lg"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-5 bg-brand-green text-white rounded-xl hover:bg-brand-green-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 min-w-[160px] font-bold text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={24} />
                  Searching...
                </>
              ) : (
                <>
                  <Search size={24} />
                  Search
                </>
              )}
            </button>
          </form>

          {/* TLD Filters */}
          <div className="mt-8 relative z-10">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 text-brand-text-secondary hover:text-white transition-colors mb-4"
            >
              <Filter size={18} />
              <span className="font-medium text-sm tracking-wide">FILTER BY EXTENSION ({selectedTlds.length} SELECTED)</span>
            </button>

            {showFilters && (
              <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                {POPULAR_TLDS.map((tld) => (
                  <button
                    key={tld}
                    onClick={() => handleTldToggle(tld)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedTlds.includes(tld)
                      ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                      : 'bg-brand-gray/5 text-brand-text-secondary border-brand-gray/20 hover:border-brand-green/30 hover:text-brand-text-primary'
                      }`}
                  >
                    {tld}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search Results */}
        {loading && (
          <div className="text-center py-20">
            <Loader2 className="animate-spin h-12 w-12 text-brand-green mx-auto mb-6" />
            <p className="text-brand-text-secondary text-lg">Searching the registry...</p>
          </div>
        )}

        {!loading && hasSearched && searchResults.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-16 text-center">
            <div className="text-brand-text-secondary mb-6">
              <Search size={64} className="mx-auto" />
            </div>
            <h3 className="text-2xl font-serif font-medium text-brand-text-primary mb-3">
              No results found
            </h3>
            <p className="text-brand-text-secondary text-lg">
              Try searching with different keywords or extensions
            </p>
          </div>
        )}

        {!loading && searchResults.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-serif font-medium text-brand-text-primary">
                Results <span className="text-brand-text-secondary text-xl font-sans ml-2">({searchResults.length} found)</span>
              </h2>
              <button
                onClick={() => navigate('/dashboard/cart')}
                className="flex items-center gap-2 text-brand-green hover:text-brand-green/80 font-medium transition-colors"
              >
                <ShoppingCart size={20} />
                View Cart
              </button>
            </div>

            <div className="space-y-4">
              {searchResults.map((result) => (
                <DomainResultCard
                  key={result.domain}
                  domain={result}
                  onAddToCart={handleAddToCart}
                  isAddingToCart={addingToCart[result.domain]}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasSearched && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-300 p-16 text-center">
            <div className="text-brand-green mb-8">
              <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto border border-brand-green/20">
                <Search size={40} />
              </div>
            </div>
            <h3 className="text-3xl font-serif font-medium text-brand-text-primary mb-4">
              Start Your Domain Search
            </h3>
            <p className="text-brand-text-secondary text-lg mb-10 max-w-md mx-auto">
              Enter a domain name or keyword above to find your perfect web address.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['mybusiness', 'techstartup', 'designstudio'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setTimeout(() => handleSearch(), 100);
                  }}
                  className="px-6 py-3 bg-brand-gray/5 text-brand-text-secondary rounded-xl border border-gray-300 hover:bg-brand-gray/10 hover:border-brand-green/30 transition-all font-medium"
                >
                  Try "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DomainResultCard({ domain, onAddToCart, isAddingToCart }) {
  const isAvailable = domain.available;

  return (
    <div className={`bg-white rounded-xl border border-gray-300 p-6 transition-all hover:border-[#004643] shadow-sm ${!isAvailable ? 'opacity-60 grayscale' : ''
      }`}>
      <div className="flex items-center justify-between flex-wrap gap-4">
        {/* Domain Info */}
        <div className="flex items-center gap-5 flex-1 min-w-0">
          {isAvailable ? (
            <div className="flex-shrink-0 w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center border border-brand-green/20">
              <Check className="text-brand-green" size={24} />
            </div>
          ) : (
            <div className="flex-shrink-0 w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center border border-red-500/20">
              <X className="text-red-500" size={24} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-brand-text-primary truncate mb-1">
              {domain.domain}
            </h3>
            <p className={`text-sm font-medium ${isAvailable ? 'text-brand-green' : 'text-red-400'}`}>
              {isAvailable ? 'Available' : 'Not Available'}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        {isAvailable && (
          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="flex items-center justify-end gap-1 text-2xl font-serif font-medium text-brand-text-primary">
                <DollarSign size={20} className="text-brand-text-secondary" />
                {domain.price ? (
                  <span>{domain.price.toFixed(2)}</span>
                ) : (
                  <span>Contact Us</span>
                )}
              </div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary mt-1">per year</p>
            </div>

            {domain.inCart ? (
              <button
                onClick={() => { }}
                className="px-8 py-3 bg-brand-gray/5 text-brand-text-secondary rounded-xl cursor-not-allowed flex items-center gap-2 border border-gray-300 font-medium"
                disabled
              >
                <Check size={20} />
                In Cart
              </button>
            ) : (
              <button
                onClick={() => onAddToCart(domain)}
                disabled={isAddingToCart}
                className="px-8 py-3 bg-brand-green text-white rounded-xl hover:bg-brand-green-hover transition-all disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center font-bold"
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Adding...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={20} />
                    Add
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
