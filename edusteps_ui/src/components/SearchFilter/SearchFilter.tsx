import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: FilterOptions) => void;
  totalCount: number;
  filteredCount: number;
}

interface FilterOptions {
  hasEmail: boolean | null;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  onSearch,
  onFilter,
  totalCount,
  filteredCount
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    hasEmail: null
  });

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: boolean | null) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = { hasEmail: null };
    setFilters(clearedFilters);
    onFilter(clearedFilters);
  };

  const hasActiveFilters = filters.hasEmail !== null;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search customers..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
            hasActiveFilters 
              ? 'border-blue-500 bg-blue-50 text-blue-700' 
              : 'border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {hasActiveFilters && <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">Active</span>}
        </button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filter Options</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Status</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasEmail"
                    checked={filters.hasEmail === null}
                    onChange={() => handleFilterChange('hasEmail', null)}
                    className="mr-2"
                  />
                  All customers
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasEmail"
                    checked={filters.hasEmail === true}
                    onChange={() => handleFilterChange('hasEmail', true)}
                    className="mr-2"
                  />
                  With email
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="hasEmail"
                    checked={filters.hasEmail === false}
                    onChange={() => handleFilterChange('hasEmail', false)}
                    className="mr-2"
                  />
                  Without email
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {(searchQuery || hasActiveFilters) && (
        <div className="text-sm text-gray-600">
          Showing {filteredCount} of {totalCount} customers
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
