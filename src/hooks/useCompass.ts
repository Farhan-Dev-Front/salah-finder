import { useCallback, useEffect, useState } from "react";

export default function useCompass() {
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onEvent = (e: DeviceOrientationEvent) => {
    const alpha = e.alpha;
    if (typeof alpha === "number") {
      // alpha is rotation around z-axis in degrees (0..360) relative to the device's starting orientation.
      // We convert to compass heading where 0 = North. Different devices expose different event types; using
      // alpha with a simple transform is a pragmatic approach for many devices.
      setDeviceHeading((360 - alpha) % 360);
    }
  };

  const start = useCallback(async () => {
    setError(null);
    const anyWin = window as any;
    // On iOS (Safari) DeviceOrientationEvent requires a user gesture permission request.
    if (anyWin.DeviceOrientationEvent && typeof anyWin.DeviceOrientationEvent.requestPermission === "function") {
      try {
        const res = await anyWin.DeviceOrientationEvent.requestPermission();
        if (res === "granted") window.addEventListener("deviceorientation", onEvent as EventListener);
        else setError("Device orientation permission denied");
      } catch (err) {
        setError("Device orientation permission error");
      }
    } else {
      window.addEventListener("deviceorientation", onEvent as EventListener);
    }
  }, []);

  const stop = useCallback(() => {
    window.removeEventListener("deviceorientation", onEvent as EventListener);
  }, []);

  useEffect(() => {
    // Start listening by default for a simple live compass. Consumers may call start/stop explicitly
    // if they want to request permission in a user gesture.
    try {
      window.addEventListener("deviceorientation", onEvent as EventListener);
    } catch (err) {
      /* ignore */
    }
    return () => stop();
  }, [stop]);

  return { deviceHeading, error, start, stop } as const;
}
