"use client";

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, X } from 'lucide-react';
import { ResolvedLocation } from '@/services/location';
import { useDebounce } from '../hooks/useDebounce';

interface LocationInputProps {
  initialLocation?: ResolvedLocation | null;
  onLocationChange: (location: ResolvedLocation | null) => void;
}

export default function LocationInput({ initialLocation, onLocationChange }: LocationInputProps) {
  const [inputValue, setInputValue] = useState(initialLocation?.displayName || '');
  const [suggestions, setSuggestions] = useState<ResolvedLocation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<ResolvedLocation | null>(initialLocation || null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const debouncedSearchTerm = useDebounce(inputValue, 300);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debouncedSearchTerm && !selectedLocation && debouncedSearchTerm.trim().length >= 2) {
      fetchSuggestions(debouncedSearchTerm);
    } else {
      setSuggestions([]);
      setNoResults(false);
      setError(null);
    }
  }, [debouncedSearchTerm, selectedLocation]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [containerRef]);

  const fetchSuggestions = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setNoResults(false);
    
    try {
      const response = await fetch(`/api/location/autocomplete?query=${encodeURIComponent(query)}`);
      const data = await response.json();
      
      if (response.ok) {
        const suggestions = data.suggestions || [];
        setSuggestions(suggestions);
        setNoResults(suggestions.length === 0);
        setIsDropdownOpen(true);
      } else {
        setError(data.error || 'Failed to fetch suggestions');
        setSuggestions([]);
        setNoResults(true);
      }
    } catch (error) {
      console.error('Failed to fetch location suggestions:', error);
      setError('Network error occurred');
      setSuggestions([]);
      setNoResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (location: ResolvedLocation) => {
    setSelectedLocation(location);
    setInputValue(location.displayName);
    onLocationChange(location);
    setSuggestions([]);
    setIsDropdownOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedLocation(null);
    onLocationChange(null);
    setSuggestions([]);
    setNoResults(false);
    setError(null);
  };

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center space-x-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (selectedLocation) {
              setSelectedLocation(null);
              onLocationChange(null);
            }
            setError(null);
            setNoResults(false);
          }}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsDropdownOpen(true);
            }
          }}
          placeholder="Enter City, Zip, or County"
          className="flex-1"
        />
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {inputValue && !isLoading && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {(isDropdownOpen && (suggestions.length > 0 || noResults || error)) && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg dark:bg-gray-800 dark:border-gray-700">
          {suggestions.length > 0 && (
            <ul>
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.placeId}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  {suggestion.displayName}
                </li>
              ))}
            </ul>
          )}
          {noResults && !error && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              No locations found for "{inputValue}". Try entering a different city, zip code, or county.
            </div>
          )}
          {error && (
            <div className="px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
