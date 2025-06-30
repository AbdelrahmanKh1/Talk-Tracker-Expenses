import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Filter, Tag, DollarSign, Calendar, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchFilters } from '@/types';

interface SearchBarProps {
  onSearch: (searchTerm: string, filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

interface ExtendedSearchFilters extends SearchFilters {
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

const categories = [
  'All Categories',
  'Food',
  'Transport',
  'Entertainment',
  'Health',
  'Shopping',
  'Bills',
  'Education',
  'Travel',
  'Miscellaneous'
];

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  placeholder = "Search expenses...",
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<ExtendedSearchFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchTerm, filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters, onSearch]);

  // Close filters when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowFilters(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        const searchInput = searchRef.current?.querySelector('input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const clearSearch = (): void => {
    setSearchTerm('');
    setFilters({});
    onSearch('', {});
  };

  const updateFilter = (key: keyof ExtendedSearchFilters, value: string | number | Date | null | ExtendedSearchFilters['dateRange']): void => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== null && 
    (typeof value === 'object' ? Object.values(value).some(v => v !== null) : true)
  );

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Main Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
          <Search className="w-5 h-5" />
        </div>
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          className="pl-12 pr-12 h-12 text-base border-gray-200 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl transition-all duration-200 dark:bg-gray-800 dark:text-white"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {hasActiveFilters && (
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          )}
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors
              ${showFilters 
                ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500'}
            `}
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>
        
        {/* Keyboard shortcut indicator */}
        {!searchTerm && !isFocused && (
          <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
            </kbd>
          </div>
        )}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 z-50">
          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Category
              </label>
              <select
                value={filters.category || 'All Categories'}
                onChange={(e) => updateFilter('category', e.target.value === 'All Categories' ? undefined : e.target.value)}
                className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Amount Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minAmount || ''}
                  onChange={(e) => updateFilter('minAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxAmount || ''}
                  onChange={(e) => updateFilter('maxAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={filters.dateRange?.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
                <Input
                  type="date"
                  value={filters.dateRange?.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateFilter('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value ? new Date(e.target.value) : null
                  })}
                  className="text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
                />
              </div>
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button
                onClick={() => {
                  setFilters({});
                  onSearch(searchTerm, {});
                }}
                variant="outline"
                className="w-full"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {isFocused && searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2 z-40">
          <div className="text-sm text-gray-500 dark:text-gray-400 p-2">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4" />
              <span>Search tips:</span>
            </div>
            <ul className="text-xs space-y-1 ml-6">
              <li>• Type "coffee" to find coffee expenses</li>
              <li>• Type "100" to find expenses around 100</li>
              <li>• Type "food" to find food category expenses</li>
              <li>• Use filters for more specific searches</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}; 