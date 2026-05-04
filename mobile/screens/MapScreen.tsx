import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRNMobileAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

// OSM tile URL template (free, no API key required)
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

export default function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isSignedIn } = useRNMobileAuth();

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc);
    })();
  }, [isSignedIn]);

  if (!location) {
    return (
      <View style={styles.center}>
        {error ? <Text>{error}</Text> : <Text>Loading map...</Text>}
      </View>
    );
  }

  const region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <MapView style={styles.map} initialRegion={region} showsUserLocation followsUserLocation>
      {/* OSM Tile Layer */}
      <UrlTile
        urlTemplate={OSM_TILE_URL}
        maximumZ={19}
        flipY={false}
        tileSize={256}
      />
      
      {/* User location marker */}
      <Marker
        coordinate={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }}
        title="Your Location"
        description="Live GPS tracking"
      />
    </MapView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    width,
    height,
  },
});
