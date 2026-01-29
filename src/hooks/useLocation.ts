import { useCallback, useState } from "react";

export type Coords = { lat: number; lon: number } | null;

export default function useLocation() {
  const [coords, setCoords] = useState<Coords>(null);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser.");
      return;
    }
    setDetecting(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setDetecting(false);
      },
      (err) => {
        setError(err?.message ?? "Unable to retrieve location.");
        setDetecting(false);
      },
      { maximumAge: 60_000, timeout: 10_000 }
    );
  }, []);

  const setManualCoords = useCallback((lat: number, lon: number) => {
    setCoords({ lat, lon });
    setError(null);
  }, []);

  return { coords, error, detecting, requestLocation, setManualCoords } as const;
}
