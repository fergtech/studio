/**
 * Represents a geographical location with latitude and longitude coordinates.
 */
export interface Location {
  /**
   * The latitude of the location.
   */
  lat: number;
  /**
   * The longitude of the location.
   */
  lng: number;
}

/**
 * Represents a resolved location with human-readable information.
 */
export interface ResolvedLocation {
  /**
   * A unique identifier for the place, from the geocoding service.
   */
  placeId: string | number;
  /**
   * Coordinates of the location.
   */
  coordinates: Location;
  /**
   * Human-readable location name (e.g., "Harford County, Maryland").
   */
  displayName: string;
  /**
   * City name.
   */
  city?: string;
  /**
   * County or administrative area.
   */
  county?: string;
  /**
   * State or province.
   */
  state?: string;
  /**
   * Country.
   */
  country?: string;
  /**
   * Postal/zip code.
   */
  postalCode?: string;
}

/**
 * Options for location detection.
 */
export interface LocationDetectionOptions {
  /**
   * Timeout for geolocation request in milliseconds.
   */
  timeout?: number;
  /**
   * Whether to use high accuracy GPS.
   */
  enableHighAccuracy?: boolean;
  /**
   * Maximum age of cached position in milliseconds.
   */
  maximumAge?: number;
}

/**
 * Result of location detection attempt.
 */
export interface LocationDetectionResult {
  /**
   * Whether the detection was successful.
   */
  success: boolean;
  /**
   * The resolved location if successful.
   */
  location?: ResolvedLocation;
  /**
   * Error message if failed.
   */
  error?: string;
  /**
   * The method used for detection.
   */
  method?: 'geolocation' | 'ip' | 'manual';
}

/**
 * Asynchronously retrieves the current location of the user using browser geolocation.
 *
 * @param options - Configuration options for geolocation.
 * @returns A promise that resolves to a Location object containing the user's latitude and longitude.
 */
export async function getCurrentLocation(options: LocationDetectionOptions = {}): Promise<Location> {
  const {
    timeout = 10000,
    enableHighAccuracy = true,
    maximumAge = 300000 // 5 minutes
  } = options;

  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Unknown geolocation error';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  });
}

/**
 * Reverse geocodes coordinates to get human-readable location information.
 *
 * @param coordinates - The latitude and longitude coordinates.
 * @returns A promise that resolves to location information.
 */
export async function reverseGeocode(coordinates: Location): Promise<ResolvedLocation> {
  try {
    // Using a free reverse geocoding service (nominatim)
    // In production, you might want to use Google Maps, Mapbox, or similar
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'Society+ App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    const address = data.address || {};

    // Extract relevant location components
    const county = address.county || address.administrative_area_level_2 || address.state_district;
    const state = address.state || address.administrative_area_level_1;
    const city = address.city || address.town || address.village || address.municipality;
    const country = address.country;
    const postalCode = address.postcode;

    // Create display name prioritizing county and state
    let displayName = '';
    if (county && state) {
      displayName = `${county}, ${state}`;
    } else if (city && state) {
      displayName = `${city}, ${state}`;
    } else if (state) {
      displayName = state;
    } else {
      displayName = data.display_name || 'Unknown Location';
    }

    return {
      placeId: data.place_id, // Assuming the geocoding service provides a place_id
      coordinates,
      displayName,
      city,
      county,
      state,
      country,
      postalCode,
    };
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    throw new Error('Failed to resolve location information');
  }
}

/**
 * Attempts automatic location detection using browser geolocation and reverse geocoding.
 *
 * @param options - Configuration options for location detection.
 * @returns A promise that resolves to a location detection result.
 */
export async function detectLocationAutomatically(options: LocationDetectionOptions = {}): Promise<LocationDetectionResult> {
  try {
    // Step 1: Get coordinates from browser geolocation
    const coordinates = await getCurrentLocation(options);
    
    // Step 2: Reverse geocode to get human-readable location
    const location = await reverseGeocode(coordinates);
    
    return {
      success: true,
      location,
      method: 'geolocation'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Location detection failed',
      method: 'geolocation'
    };
  }
}

/**
 * Looks up location information from a postal/zip code.
 *
 * @param postalCode - The postal or zip code.
 * @param countryCode - Optional country code (defaults to 'US').
 * @returns A promise that resolves to location information.
 */
export async function lookupByPostalCode(postalCode: string, countryCode: string = 'US'): Promise<ResolvedLocation> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&postalcode=${encodeURIComponent(postalCode)}&countrycodes=${countryCode}&addressdetails=1&limit=1`,
      {
        headers: {
          'User-Agent': 'Society+ App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Postal code lookup failed');
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Postal code not found');
    }

    const result = data[0];
    const address = result.address || {};
    
    const coordinates: Location = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };

    const county = address.county || address.administrative_area_level_2 || address.state_district;
    const state = address.state || address.administrative_area_level_1;
    const city = address.city || address.town || address.village || address.municipality;
    const country = address.country;

    // Create display name prioritizing county and state
    let displayName = '';
    if (county && state) {
      displayName = `${county}, ${state}`;
    } else if (city && state) {
      displayName = `${city}, ${state}`;
    } else if (state) {
      displayName = state;
    } else {
      displayName = result.display_name || 'Unknown Location';
    }

    return {
      placeId: result.place_id, // Assuming the geocoding service provides a place_id
      coordinates,
      displayName,
      city,
      county,
      state,
      country,
      postalCode,
    };
  } catch (error) {
    console.error('Postal code lookup error:', error);
    throw new Error('Failed to lookup location by postal code');
  }
}

/**
 * Performs manual location detection using postal code lookup.
 *
 * @param postalCode - The postal or zip code provided by the user.
 * @param countryCode - Optional country code.
 * @returns A promise that resolves to a location detection result.
 */
export async function detectLocationManually(postalCode: string, countryCode?: string): Promise<LocationDetectionResult> {
  try {
    const location = await lookupByPostalCode(postalCode, countryCode);
    
    return {
      success: true,
      location,
      method: 'manual'
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Manual location detection failed',
      method: 'manual'
    };
  }
}

/**
 * Hybrid location detection: tries automatic detection first, falls back to manual if needed.
 *
 * @param options - Configuration options for automatic detection.
 * @returns A promise that resolves to a location detection result.
 */
export async function detectLocationHybrid(options: LocationDetectionOptions = {}): Promise<LocationDetectionResult> {
  // First, attempt automatic detection
  const autoResult = await detectLocationAutomatically(options);
  
  if (autoResult.success) {
    return autoResult;
  }
  
  // If automatic detection fails, return the failure result
  // The UI should then prompt for manual input
  return autoResult;
}

export interface NominatimResult {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    city?: string;
    county?: string;
    state?: string;
    country?: string;
    postcode?: string;
    town?: string;
    village?: string;
    municipality?: string;
    [key: string]: string | undefined;
  };
  boundingbox: [string, string, string, string];
}

/**
 * Finds nearby areas from a location string (zip code, city, etc.)
 * @param location - Location string (zip code, city name, etc.)
 * @param radiusMiles - The radius in miles to search within.
 * @returns A promise that resolves to an array of nearby locations.
 */
export async function findNearbyAreasByLocation(
  location: string,
  radiusMiles: number = 25
): Promise<ResolvedLocation[]> {
  console.log(`🗺️ findNearbyAreasByLocation: Finding areas near "${location}" within ${radiusMiles} miles`);

  try {
    // First, try to geocode the location to get coordinates
    let resolved: ResolvedLocation | null = null;

    // Check if it looks like a postal code (5 digits)
    if (/^\d{5}$/.test(location.trim())) {
      console.log(`🗺️ findNearbyAreasByLocation: Detected postal code "${location}"`);
      try {
        resolved = await lookupByPostalCode(location.trim());
      } catch (error) {
        console.log(`🗺️ findNearbyAreasByLocation: Postal code lookup failed:`, error);
      }
    }

    // If not a postal code or postal code lookup failed, we need a more generic geocoder
    // For now, return empty array since we don't have a general resolveLocation function
    if (!resolved) {
      console.log(`🗺️ findNearbyAreasByLocation: Could not resolve location "${location}" - no geocoder available`);
      return [];
    }

    console.log(`🗺️ findNearbyAreasByLocation: Resolved "${location}" to:`, resolved);

    // Now find nearby areas using the coordinates
    return await findNearbyAreas(resolved.coordinates, radiusMiles);
  } catch (error) {
    console.error(`🗺️ findNearbyAreasByLocation: Error finding nearby areas for "${location}":`, error);
    return [];
  }
}

// Cache for nearby areas to prevent repeated Nominatim API calls
const nearbyAreasCache = new Map<string, { data: ResolvedLocation[], timestamp: number }>();
const NEARBY_AREAS_CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache

/**
 * Finds neighboring areas/counties within a given radius using Nominatim.
 *
 * @param coordinates - The center coordinates.
 * @param radiusMiles - The radius in miles to search within.
 * @returns A promise that resolves to an array of nearby locations.
 */
export async function findNearbyAreas(
  coordinates: Location,
  radiusMiles: number = 25
): Promise<ResolvedLocation[]> {
  // Create cache key from rounded coordinates (to 2 decimal places) and radius
  const cacheKey = `${coordinates.lat.toFixed(2)},${coordinates.lng.toFixed(2)}-${radiusMiles}`;

  // Check cache first
  const cached = nearbyAreasCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp) < NEARBY_AREAS_CACHE_DURATION) {
    console.log(`📦 Using cached nearby areas for coordinates: ${JSON.stringify(coordinates)}`);
    return cached.data;
  }

  console.log(
    `Finding nearby areas for coordinates: ${JSON.stringify(
      coordinates
    )} within ${radiusMiles} miles`
  );

  try {
    // Use a simpler approach - search for cities near the coordinates
    // This approach works better than the complex viewbox query
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=city&lat=${coordinates.lat}&lon=${coordinates.lng}&addressdetails=1&limit=20`,
      {
        headers: {
          'User-Agent': 'Society+ App/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch nearby areas from Nominatim API. Status: ${response.status}`
      );
    }

    const data: NominatimResult[] = await response.json();
    console.log(`Found ${data.length} potential nearby areas from Nominatim.`);

    // Process results into ResolvedLocation objects
    const resolvedAreasWithDistance = data
      .map((result) => {
        const address = result.address || {};
        const county = address.county || address.municipality;
        const state = address.state;
        const city = address.city || address.town || address.village;

        let displayName = result.display_name;
        if (city && state) {
          displayName = `${city}, ${state}`;
        } else if (county && state) {
          displayName = `${county}, ${state}`;
        }

        const coords = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };

        // Calculate distance and filter by radius
        const distance = calculateDistance(coordinates, coords);

        return {
          placeId: result.place_id,
          coordinates: coords,
          displayName,
          city,
          county,
          state,
          country: address.country,
          postalCode: address.postcode,
          distance, // Temporary property for filtering
        };
      })
      .filter(area => area.distance <= radiusMiles) // Filter by radius
      .sort((a, b) => a.distance - b.distance); // Sort by distance

    // Filter out duplicates based on display name and convert to ResolvedLocation[]
    const uniqueAreas: ResolvedLocation[] = resolvedAreasWithDistance
      .filter(
        (area, index, self) =>
          index === self.findIndex((a) => a.displayName === area.displayName)
      )
      .map(({ distance, ...area }) => area); // Remove distance property

    console.log(`Found ${uniqueAreas.length} unique nearby areas within ${radiusMiles} miles.`);

    // Cache the results
    nearbyAreasCache.set(cacheKey, {
      data: uniqueAreas,
      timestamp: Date.now()
    });

    return uniqueAreas;

  } catch (error) {
    console.error('Error finding nearby areas:', error);
    // Cache empty result to prevent repeated failures
    nearbyAreasCache.set(cacheKey, {
      data: [],
      timestamp: Date.now()
    });
    return []; // Return empty array on failure
  }
}

/**
 * Calculates the distance between two coordinates in miles.
 *
 * @param coord1 - First coordinate.
 * @param coord2 - Second coordinate.
 * @returns Distance in miles.
 */
export function calculateDistance(coord1: Location, coord2: Location): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
