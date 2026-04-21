import { Camera, type CameraRef, MapView, PointAnnotation } from "@maplibre/maplibre-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";

const FALLBACK_COORDINATE: [number, number] = [76.34182, 10.011781];
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const MAP_STYLE = {
  version: 8,
  name: "Reports Map Style - Comprehensive",
  metadata: {
    app: "reportsApp",
    profile: "style-spec-variations",
  },
  center: FALLBACK_COORDINATE,
  zoom: 14,
  bearing: 0,
  pitch: 20,
  transition: {
    duration: 300,
    delay: 0,
  },
  light: {
    anchor: "viewport",
    color: "#ffffff",
    intensity: 0.25,
    position: [1.15, 210, 30],
  },
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      maxzoom: 19,
      attribution: "© OpenStreetMap contributors",
    },
    overlays: {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {
              kind: "point",
            },
            geometry: {
              type: "Point",
              coordinates: FALLBACK_COORDINATE,
            },
          },
          {
            type: "Feature",
            properties: {
              kind: "line",
            },
            geometry: {
              type: "LineString",
              coordinates: [
                [76.3387, 10.0101],
                FALLBACK_COORDINATE,
                [76.3456, 10.0132],
              ],
            },
          },
          {
            type: "Feature",
            properties: {
              kind: "polygon",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [76.3385, 10.0101],
                  [76.3447, 10.0101],
                  [76.3447, 10.0147],
                  [76.3385, 10.0147],
                  [76.3385, 10.0101],
                ],
              ],
            },
          },
        ],
      },
    },
  },
  layers: [
    {
      id: "background-base",
      type: "background",
      paint: {
        "background-color": "#dbeafe",
        "background-opacity": 1,
      },
    },
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      paint: {
        "raster-opacity": 1,
        "raster-saturation": -0.1,
        "raster-contrast": 0.05,
      },
    },
    {
      id: "zone-fill",
      type: "fill",
      source: "overlays",
      filter: ["==", ["get", "kind"], "polygon"],
      paint: {
        "fill-color": "#2563eb",
        "fill-opacity": 0.2,
      },
    },
    {
      id: "route-line",
      type: "line",
      source: "overlays",
      filter: ["==", ["get", "kind"], "line"],
      paint: {
        "line-color": "#1d4ed8",
        "line-width": 4,
        "line-opacity": 0.95,
      },
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
    },
    {
      id: "focus-point-circle",
      type: "circle",
      source: "overlays",
      filter: ["==", ["get", "kind"], "point"],
      paint: {
        "circle-color": "#0f172a",
        "circle-radius": 7,
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    },
  ],
} as const;

type SearchResult = {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
  distanceKm?: number;
  containsQuery?: boolean;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (from: [number, number], to: [number, number]) => {
  const earthRadiusKm = 6371;
  const [fromLon, fromLat] = from;
  const [toLon, toLat] = to;

  const latDelta = toRadians(toLat - fromLat);
  const lonDelta = toRadians(toLon - fromLon);
  const a =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(fromLat)) *
      Math.cos(toRadians(toLat)) *
      Math.sin(lonDelta / 2) *
      Math.sin(lonDelta / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const MapScreen = () => {
  const cameraRef = useRef<CameraRef>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);
  const [coordinate, setCoordinate] = useState<[number, number]>(FALLBACK_COORDINATE);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [selectedPlaceLabel, setSelectedPlaceLabel] = useState<string | null>(null);

  const label = useMemo(() => {
    const [longitude, latitude] = coordinate;
    return `Lat ${latitude.toFixed(5)} | Lng ${longitude.toFixed(5)}`;
  }, [coordinate]);

  const centerToCoordinate = useCallback(
    (nextCoordinate: [number, number]) => {
      cameraRef.current?.flyTo(nextCoordinate, 900);
    },
    [],
  );

  const getNearestCoordinate = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    setCoordinate(FALLBACK_COORDINATE);
    centerToCoordinate(FALLBACK_COORDINATE);
    setIsLocating(false);
  }, [centerToCoordinate]);

  useEffect(() => {
    void getNearestCoordinate();
  }, [getNearestCoordinate]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const timer = setTimeout(() => {
      const searchPlaces = async () => {
        setIsSearching(true);
        setSearchError(null);

        try {
          const url = `${NOMINATIM_ENDPOINT}?format=json&q=${encodeURIComponent(trimmedQuery)}&limit=5&countrycodes=in,ae`;
          const response = await fetch(url, {
            headers: {
              Accept: "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Search request failed");
          }

          const places = (await response.json()) as SearchResult[];
          const normalizedQuery = trimmedQuery.toLowerCase();
          const rankedPlaces = places
            .map((place) => {
              const placeCoordinate: [number, number] = [Number(place.lon), Number(place.lat)];
              const normalizedLabel = place.display_name.toLowerCase();
              return {
                ...place,
                distanceKm: getDistanceKm(coordinate, placeCoordinate),
                containsQuery: normalizedLabel.includes(normalizedQuery),
              };
            })
            .sort((a, b) => {
              const containsWeightA = a.containsQuery ? 0 : 1;
              const containsWeightB = b.containsQuery ? 0 : 1;
              if (containsWeightA !== containsWeightB) {
                return containsWeightA - containsWeightB;
              }
              return (a.distanceKm ?? Number.MAX_SAFE_INTEGER) - (b.distanceKm ?? Number.MAX_SAFE_INTEGER);
            });
          setSearchResults(rankedPlaces);
        } catch {
          setSearchError("Place search failed. Please try again.");
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      };

      void searchPlaces();
    }, 350);

    return () => clearTimeout(timer);
  }, [query, coordinate]);

  const handleSelectResult = useCallback(
    (result: SearchResult) => {
      const nextCoordinate: [number, number] = [Number(result.lon), Number(result.lat)];
      setCoordinate(nextCoordinate);
      centerToCoordinate(nextCoordinate);
      setSelectedPlaceLabel(result.display_name);
      setQuery(result.display_name);
      setSearchResults([]);
      setSearchError(null);
    },
    [centerToCoordinate],
  );

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        mapStyle={MAP_STYLE}
        compassEnabled
        logoEnabled={false}
        onDidFailLoadingMap={() => setMapError("Map tiles failed to load. Check internet connection.")}
      >
        <Camera ref={cameraRef} zoomLevel={14} centerCoordinate={coordinate} />
        <PointAnnotation id="nearest-coordinate" coordinate={coordinate}>
          <View style={styles.pinContainer}>
            <View style={styles.pinDot} />
          </View>
        </PointAnnotation>
      </MapView>

      <SafeAreaView pointerEvents="box-none" style={styles.overlay}>
        <View style={styles.infoCard}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search places (min 3 letters)"
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {isSearching ? <ActivityIndicator style={styles.searchLoader} color="#cbd5e1" /> : null}
          {searchError ? <Text style={styles.errorText}>{searchError}</Text> : null}
          {searchResults.length > 0 ? (
            <View style={styles.searchResultsCard}>
              {searchResults.map((result) => (
                <Pressable
                  key={result.place_id}
                  onPress={() => handleSelectResult(result)}
                  style={styles.searchResultItem}
                >
                  <Text numberOfLines={2} style={styles.searchResultText}>
                    {result.display_name}
                  </Text>
                  {typeof result.distanceKm === "number" ? (
                    <Text style={styles.searchResultDistance}>{result.distanceKm.toFixed(2)} km away</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          ) : null}

          <Text style={styles.title}>Nearest Coordinate</Text>
          <Text style={styles.coordinateText}>{label}</Text>
          {selectedPlaceLabel ? (
            <Text numberOfLines={2} style={styles.selectedPlaceText}>
              {selectedPlaceLabel}
            </Text>
          ) : null}
          {locationError ? <Text style={styles.errorText}>{locationError}</Text> : null}
          {mapError ? <Text style={styles.errorText}>{mapError}</Text> : null}
        </View>

        <Pressable onPress={() => void getNearestCoordinate()} style={styles.recenterButton}>
          {isLocating ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.recenterText}>Recenter</Text>
          )}
        </Pressable>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1a2c",
  },
  map: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "space-between",
    padding: 16,
  },
  infoCard: {
    marginTop: 8,
    alignSelf: "stretch",
    borderRadius: 14,
    padding: 14,
    backgroundColor: "rgba(4, 19, 39, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  title: {
    color: "#dbeafe",
    fontWeight: "700",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.55)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#ffffff",
    backgroundColor: "rgba(15, 23, 42, 0.9)",
    fontSize: 14,
  },
  searchLoader: {
    marginTop: 8,
  },
  searchResultsCard: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(15, 23, 42, 0.95)",
  },
  searchResultItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148, 163, 184, 0.2)",
  },
  searchResultText: {
    color: "#f8fafc",
    fontSize: 13,
  },
  searchResultDistance: {
    marginTop: 4,
    color: "#93c5fd",
    fontSize: 12,
  },
  coordinateText: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "500",
  },
  selectedPlaceText: {
    marginTop: 6,
    color: "#bfdbfe",
    fontSize: 12,
  },
  errorText: {
    marginTop: 6,
    color: "#fecaca",
    fontSize: 12,
  },
  recenterButton: {
    alignSelf: "center",
    minWidth: 130,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  recenterText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 15,
  },
  pinContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#1d4ed8",
    borderWidth: 2,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ffffff",
  },
});

export default MapScreen;