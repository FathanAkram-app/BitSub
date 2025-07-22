import React, { useState, useEffect } from 'react';
import { AuthClient } from '@dfinity/auth-client';
import { SubscriptionPlan } from '../types';
import { Button, Card, Loading } from '../components/ui';
import { subscriptionService } from '../services/subscriptionService';
import { usePrice } from '../hooks/usePrice';

interface MarketplacePageProps {
  authClient: AuthClient;
  onSubscribe: (planId: string) => void;
}

interface PlanCardProps {
  plan: SubscriptionPlan;
  onSubscribe: (planId: string) => void;
  convertSatsToUSD: (sats: number) => string;
}

function PlanCard({ plan, onSubscribe, convertSatsToUSD }: PlanCardProps): React.ReactElement {
  const formatInterval = (interval: { Daily?: null; Weekly?: null; Monthly?: null; Yearly?: null }): string => {
    if (interval.Daily !== undefined) return 'Daily';
    if (interval.Weekly !== undefined) return 'Weekly';
    if (interval.Monthly !== undefined) return 'Monthly';
    if (interval.Yearly !== undefined) return 'Yearly';
    return 'Unknown';
  };

  const intervalText = formatInterval(plan.interval);
  const usdAmount = convertSatsToUSD(plan.amount);

  return (
    <Card className="plan-card">
      <div className="plan-header">
        <h3 className="plan-title">{plan.title}</h3>
        <div className="plan-price">
          <span className="price-sats">{plan.amount.toLocaleString()} sats</span>
          <span className="price-usd">${usdAmount}</span>
          <span className="price-interval">/{intervalText.toLowerCase()}</span>
        </div>
      </div>
      
      <div className="plan-description">
        <p>{plan.description}</p>
      </div>
      
      <div className="plan-meta">
        <div className="plan-interval">
          <span className="meta-label">Billing:</span>
          <span className="meta-value">{intervalText}</span>
        </div>
        <div className="plan-creator">
          <span className="meta-label">Creator:</span>
          <span className="meta-value">{plan.creator.toString().slice(0, 8)}...</span>
        </div>
      </div>
      
      <div className="plan-actions">
        <Button 
          onClick={() => onSubscribe(plan.planId)}
          variant="primary"
          className="subscribe-btn"
        >
          Subscribe Now
        </Button>
      </div>
    </Card>
  );
}

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

function FilterBar({ 
  searchQuery, 
  onSearchChange, 
  priceRange, 
  onPriceRangeChange, 
  onClearFilters 
}: FilterBarProps): React.ReactElement {
  return (
    <div className="filter-bar">
      <div className="search-section">
        <input
          type="text"
          placeholder="Search plans..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="filter-section">
        <div className="price-filter">
          <label>Price Range (sats):</label>
          <div className="range-inputs">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ''}
              onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
              className="range-input"
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] || ''}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || 1000000])}
              className="range-input"
            />
          </div>
        </div>
        
        <Button onClick={onClearFilters} variant="secondary" size="sm">
          Clear Filters
        </Button>
      </div>
    </div>
  );
}

export default function MarketplacePage({ authClient, onSubscribe }: MarketplacePageProps): React.ReactElement {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<SubscriptionPlan[]>([]);
  const [featuredPlans, setFeaturedPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
  const [activeTab, setActiveTab] = useState<'all' | 'featured'>('featured');
  
  const { convertSatsToUSD } = usePrice(authClient);

  useEffect(() => {
    loadPlans();
  }, []);

  useEffect(() => {
    filterPlans();
  }, [plans, searchQuery, priceRange]);

  const loadPlans = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const [allPlans, featured] = await Promise.all([
        subscriptionService.getAllPublicPlans(authClient),
        subscriptionService.getFeaturedPlans(authClient)
      ]);
      
      setPlans(allPlans);
      setFeaturedPlans(featured);
    } catch (err) {
      setError('Failed to load plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterPlans = (): void => {
    let filtered = plans;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(plan => 
        plan.title.toLowerCase().includes(query) ||
        plan.description.toLowerCase().includes(query)
      );
    }

    // Price range filter
    filtered = filtered.filter(plan => 
      plan.amount >= priceRange[0] && plan.amount <= priceRange[1]
    );

    setFilteredPlans(filtered);
  };

  const handleSearchChange = (query: string): void => {
    setSearchQuery(query);
  };

  const handlePriceRangeChange = (range: [number, number]): void => {
    setPriceRange(range);
  };

  const handleClearFilters = (): void => {
    setSearchQuery('');
    setPriceRange([0, 1000000]);
  };

  const currentPlans = activeTab === 'featured' ? featuredPlans : filteredPlans;

  if (loading) {
    return (
      <div className="marketplace-page">
        <Loading text="Loading marketplace..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="marketplace-page">
        <div className="error-state">
          <h2>Error Loading Marketplace</h2>
          <p>{error}</p>
          <Button onClick={loadPlans} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      {/* Debug indicator */}
      <div style={{ position: 'fixed', top: '10px', right: '10px', background: '#00d4ff', color: '#0c1426', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', zIndex: 9999 }}>
        MARKETPLACE PAGE
      </div>
      
      {/* Hero Section */}
      <div className="marketplace-hero">
        <div className="hero-content">
          <div className="hero-badge">🛒 Marketplace</div>
          <h1 className="hero-title">🚀 Discover Amazing Subscriptions</h1>
          <p className="hero-subtitle">
            Browse curated subscription plans from creators worldwide. 
            Find your next favorite service and subscribe instantly with Bitcoin.
          </p>
          
          {/* Quick Stats */}
          <div className="marketplace-stats">
            <div className="stat-item">
              <div className="stat-number">{plans.length}</div>
              <div className="stat-label">Active Plans</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{featuredPlans.length}</div>
              <div className="stat-label">Featured</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">⚡</div>
              <div className="stat-label">Instant Subscribe</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="marketplace-navigation">
        <div className="nav-container">
          <div className="marketplace-tabs">
            <button 
              className={`marketplace-tab ${activeTab === 'featured' ? 'active' : ''}`}
              onClick={() => setActiveTab('featured')}
            >
              <span className="tab-icon">⭐</span>
              <span className="tab-text">Featured</span>
              <span className="tab-count">{featuredPlans.length}</span>
            </button>
            <button 
              className={`marketplace-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              <span className="tab-icon">🔍</span>
              <span className="tab-text">Browse All</span>
              <span className="tab-count">{plans.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      {activeTab === 'all' && (
        <div className="marketplace-filters">
          <FilterBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            priceRange={priceRange}
            onPriceRangeChange={handlePriceRangeChange}
            onClearFilters={handleClearFilters}
          />
        </div>
      )}

      {/* Content Grid */}
      <div className="marketplace-content">
        <div className="content-container">
          {activeTab === 'featured' && featuredPlans.length > 0 && (
            <div className="featured-section">
              <h2 className="section-title">⭐ Featured Plans</h2>
              <p className="section-subtitle">Hand-picked subscriptions with the best value</p>
            </div>
          )}
          
          {currentPlans.length === 0 ? (
            <div className="marketplace-empty">
              <div className="empty-icon">
                {activeTab === 'featured' ? '⭐' : '🔍'}
              </div>
              <h3>No plans found</h3>
              <p>
                {activeTab === 'featured' 
                  ? 'No featured plans available at the moment. Check back soon!'
                  : 'Try adjusting your search terms or price filters.'
                }
              </p>
              {activeTab === 'all' && (
                <Button onClick={handleClearFilters} variant="secondary">
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="marketplace-grid">
              {currentPlans.map((plan) => (
                <div key={plan.planId} className="marketplace-card-wrapper">
                  <PlanCard
                    plan={plan}
                    onSubscribe={onSubscribe}
                    convertSatsToUSD={convertSatsToUSD}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}