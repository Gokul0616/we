import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
  useMemo,
  useEffect,
} from "react";
import {
  Platform,
  StyleSheet,
  View,
  ActivityIndicator,
} from "react-native";
import MapView from "react-native-maps";
import { WebView } from "react-native-webview";

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface PlaceMapHandle {
  animateToRegion: (region: MapRegion, duration?: number) => void;
}

export interface PlaceMapProps {
  initialRegion: MapRegion;
  showsUserLocation?: boolean;
  userLocation?: { latitude: number; longitude: number } | null;
  dark?: boolean;
  onRegionChangeComplete?: (region: MapRegion) => void;
  accessibilityLabel?: string;
}

function deltaToZoom(latitudeDelta: number): number {
  if (!latitudeDelta || latitudeDelta <= 0) return 15;
  const z = Math.round(Math.log(360 / latitudeDelta) / Math.LN2);
  return Math.min(18, Math.max(2, z));
}

/**
 * PlaceMap
 * - iOS: Uses Apple Maps via react-native-maps natively (no API key needed).
 * - Android: Uses OpenStreetMap / Leaflet via WebView (100% free, no API key or watermark needed).
 */
export const PlaceMap = forwardRef<PlaceMapHandle, PlaceMapProps>(function PlaceMap(
  {
    initialRegion,
    showsUserLocation = false,
    userLocation,
    dark = false,
    onRegionChangeComplete,
    accessibilityLabel = "Map",
  },
  ref
) {
  // ─── 1. iOS: Native Apple Maps ──────────────────────────────────────────────
  if (Platform.OS === "ios") {
    const mapViewRef = useRef<MapView>(null);

    useImperativeHandle(ref, () => ({
      animateToRegion: (region: MapRegion, duration = 400) => {
        mapViewRef.current?.animateToRegion(region, duration);
      },
    }));

    return (
      <MapView
        ref={mapViewRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        minZoomLevel={2}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  // ─── 2. Android (and fallback): OpenStreetMap Leaflet View ──────────────────
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region: MapRegion, duration = 400) => {
      const zoom = deltaToZoom(region.latitudeDelta);
      const durationSec = duration / 1000;
      webViewRef.current?.injectJavaScript(`
        if (window.flyToRegion) {
          window.flyToRegion(${region.latitude}, ${region.longitude}, ${zoom}, ${durationSec});
        }
        true;
      `);
    },
  }));

  // Update user location marker on Android when it changes
  useEffect(() => {
    if (showsUserLocation && userLocation && !loading) {
      webViewRef.current?.injectJavaScript(`
        if (window.updateUserLocation) {
          window.updateUserLocation(${userLocation.latitude}, ${userLocation.longitude});
        }
        true;
      `);
    }
  }, [showsUserLocation, userLocation, loading]);

  const htmlContent = useMemo(() => {
    const initLat = initialRegion.latitude || 0;
    const initLng = initialRegion.longitude || 0;
    const initZoom = deltaToZoom(initialRegion.latitudeDelta);
    const bgColor = dark ? "#0F172A" : "#F8FAFC";
    const tileUrl = dark
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";

    const userScript =
      showsUserLocation && userLocation
        ? `
        userMarker = L.circleMarker([${userLocation.latitude}, ${userLocation.longitude}], {
          radius: 7,
          fillColor: '#3B82F6',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);
      `
        : "";

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { -webkit-tap-highlight-color: transparent; }
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: ${bgColor};
    }
    .leaflet-control-attribution,
    .leaflet-control-zoom {
      display: none !important;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var map = L.map('map', {
      center: [${initLat}, ${initLng}],
      zoom: ${initZoom},
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: true,
      zoomAnimation: true
    });

    L.tileLayer('${tileUrl}', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    var userMarker = null;
    ${userScript}

    function notifyRegion() {
      if (!map) return;
      var center = map.getCenter();
      var bounds = map.getBounds();
      var latDelta = Math.abs(bounds.getNorth() - bounds.getSouth());
      var lngDelta = Math.abs(bounds.getEast() - bounds.getWest());
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'regionChange',
          latitude: center.lat,
          longitude: center.lng,
          latitudeDelta: latDelta || 0.008,
          longitudeDelta: lngDelta || 0.008
        }));
      }
    }

    map.on('moveend', notifyRegion);

    window.flyToRegion = function(lat, lng, zoom, durationSec) {
      if (!map) return;
      map.flyTo([lat, lng], zoom || map.getZoom(), {
        duration: durationSec || 0.4,
        easeLinearity: 0.25
      });
    };

    window.updateUserLocation = function(lat, lng) {
      if (!map) return;
      if (userMarker) {
        userMarker.setLatLng([lat, lng]);
      } else {
        userMarker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: '#3B82F6',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.95
        }).addTo(map);
      }
    };
  </script>
</body>
</html>`;
  }, [initialRegion, dark, showsUserLocation, userLocation]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === "regionChange" && onRegionChangeComplete) {
          onRegionChangeComplete({
            latitude: data.latitude,
            longitude: data.longitude,
            latitudeDelta: data.latitudeDelta,
            longitudeDelta: data.longitudeDelta,
          });
        }
      } catch {}
    },
    [onRegionChangeComplete]
  );

  return (
    <View style={StyleSheet.absoluteFill} accessibilityLabel={accessibilityLabel}>
      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        style={styles.webView}
        originWhitelist={["*"]}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        scrollEnabled={false}
        overScrollMode="never"
        nestedScrollEnabled={false}
        onMessage={handleMessage}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingOverlay, { backgroundColor: dark ? "#0F172A" : "#F8FAFC" }]}>
          <ActivityIndicator size="small" color="#3B82F6" />
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  webView: {
    flex: 1,
    backgroundColor: "transparent",
  },
  loadingOverlay: {
    justifyContent: "center",
    alignItems: "center",
  },
});
