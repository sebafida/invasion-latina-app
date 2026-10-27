import * as Location from 'expo-location';

/** Both song request forms must forward the same venue check coordinates. */
export async function getRequestLocation(): Promise<{ latitude: string | null; longitude: string | null }> {
  const unavailable = { latitude: null, longitude: null };
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return unavailable;
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Location timeout')), 15000);
      }),
    ]);
    return { latitude: String(position.coords.latitude), longitude: String(position.coords.longitude) };
  } catch {
    // The backend remains responsible for allowing/denying the venue check.
    return unavailable;
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
