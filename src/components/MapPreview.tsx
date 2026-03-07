import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '../theme';

interface MapPreviewProps {
  address: string;
}

interface Coords {
  lat: number;
  lon: number;
}

// Module-level cache to avoid re-geocoding
const geocodeCache = new Map<string, Coords | null>();

function stripApartment(address: string): string {
  return address.replace(/,?\s*кв\.?\s*\d+/i, '').trim();
}

async function geocodeAddress(address: string): Promise<Coords | null> {
  const cleaned = stripApartment(address);
  const cacheKey = cleaned.toLowerCase();

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey) || null;
  }

  try {
    const query = encodeURIComponent(`Москва, ${cleaned}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    const res = await fetch(url, {
      headers: { 'Accept-Language': 'ru' },
    });
    const data = await res.json();

    if (data.length > 0) {
      const coords: Coords = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      };
      geocodeCache.set(cacheKey, coords);
      return coords;
    }
  } catch {
    // Geocoding failed — silently return null
  }

  geocodeCache.set(cacheKey, null);
  return null;
}

function buildMapUrl(coords: Coords): string {
  const { lat, lon } = coords;
  const delta = 0.004;
  const bbox = `${lon - delta},${lat - delta * 0.6},${lon + delta},${lat + delta * 0.6}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

export function MapPreview({ address }: MapPreviewProps) {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    geocodeAddress(address).then((result) => {
      if (cancelled) return;
      if (result) {
        setCoords(result);
      } else {
        setFailed(true);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [address]);

  if (failed) return null;

  if (loading) {
    return (
      <View style={styles.skeleton}>
        <ActivityIndicator size="small" color={colors.textLight} />
      </View>
    );
  }

  if (!coords) return null;

  if (Platform.OS === 'web') {
    const src = buildMapUrl(coords);
    return (
      <View style={styles.container}>
        {React.createElement('iframe', {
          src,
          style: {
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: radius.lg,
          },
          loading: 'lazy',
          title: `Map: ${address}`,
        })}
      </View>
    );
  }

  // Native: placeholder until react-native-webview is added
  return null;
}

const styles = StyleSheet.create({
  container: {
    height: 150,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.bgElevated,
  },
  skeleton: {
    height: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
});
