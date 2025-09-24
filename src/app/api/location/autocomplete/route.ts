import { NextRequest, NextResponse } from 'next/server';
import { ResolvedLocation } from '@/services/location';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ 
      suggestions: [],
      error: 'Query must be at least 2 characters long' 
    });
  }

  try {
    // Use Nominatim OpenStreetMap geocoding service
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&addressdetails=1&limit=5&countrycodes=us`,
      {
        headers: {
          'User-Agent': 'Society+ App'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();

    // Transform the Nominatim results into our ResolvedLocation format
    const suggestions: ResolvedLocation[] = data.map((result: any) => {
      const address = result.address || {};
      
      // Extract location components
      const county = address.county || address.administrative_area_level_2 || address.state_district;
      const state = address.state || address.administrative_area_level_1;
      const city = address.city || address.town || address.village || address.municipality;
      const country = address.country;
      const postalCode = address.postcode;

      // Create a standardized display name prioritizing county and state
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
        placeId: result.place_id,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        },
        displayName,
        city,
        county,
        state,
        country,
        postalCode
      };
    });

    return NextResponse.json({ suggestions });

  } catch (error) {
    console.error('Location autocomplete error:', error);
    return NextResponse.json({ 
      suggestions: [],
      error: 'Failed to fetch location suggestions' 
    }, { status: 500 });
  }
}