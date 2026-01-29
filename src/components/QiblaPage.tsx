import React, { useRef, useState } from "react";
import useLocation from "../hooks/useLocation";
import useQiblaDirection, { KAABA } from "../hooks/useQiblaDirection";
import useCompass from "../hooks/useCompass";
import archImg from "../assets/qiblaImg.png";


const QiblaCompassPage: React.FC = () => {
    const { coords, error: locError, detecting, requestLocation, setManualCoords } = useLocation();
    const { compute } = useQiblaDirection();
    const { deviceHeading, error: compassError, start: startCompass } = useCompass();

    const [manualLat, setManualLat] = useState<string>("");
    const [manualLon, setManualLon] = useState<string>("");
    const [cameraOn, setCameraOn] = useState(false);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    const { bearing, distanceKm } = compute(coords);

    const arrowRotation = bearing != null && deviceHeading != null ? (bearing - deviceHeading + 360) % 360 : (bearing ?? 0);

    const applyManual = () => {
        const lat = parseFloat(manualLat);
        const lon = parseFloat(manualLon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
            setManualCoords(lat, lon);
        }
    };

    const startCamera = async () => {
        setCameraOn(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(() => {});
            }
        } catch (err) {
            setCameraOn(false);
        }
    };

    const stopCamera = () => {
        setCameraOn(false);
        if (videoRef.current && videoRef.current.srcObject) {
            const s = videoRef.current.srcObject as MediaStream;
            s.getTracks().forEach((t) => t.stop());
            videoRef.current.srcObject = null;
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-2xl shadow text-center">
            <h2 className="text-2xl font-semibold mb-2">Qibla Compass</h2>
            <p className="text-sm text-gray-600 mb-4">Point your device so the arrow faces the Kaaba ({KAABA.lat.toFixed(3)}, {KAABA.lon.toFixed(3)}).</p>

            <div className="flex items-center justify-center">
                <div className="relative w-56 h-56 rounded-full border-4 border-indigo-200 flex items-center justify-center bg-indigo-50">
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{backgroundImage: `url(${archImg})`, backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.18, zIndex: 0}} />
                    <div className="absolute top-3 left-1/2 transform -translate-x-1/2 text-sm font-semibold z-10">N</div>
                    <div className="transform transition-transform z-10" style={{ transform: `rotate(${arrowRotation}deg)` }}>
                        <svg width="48" height="96" viewBox="0 0 48 96" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                            <defs>
                                <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#000" floodOpacity="0.15" />
                                </filter>
                            </defs>
                            <g filter="url(#shadow)" transform="translate(0,4)">
                                <path d="M24 0 L46 56 H30 V92 H18 V56 H2 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" rx="6" />
                                <circle cx="24" cy="70" r="6" fill="#fff" opacity="0.9" />
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                {bearing != null ? (
                    <>
                        <div className="text-lg font-medium">Bearing: {bearing.toFixed(1)}°</div>
                        {distanceKm != null && <div className="text-sm text-gray-500">Distance: {distanceKm.toFixed(1)} km</div>}
                    </>
                ) : (
                    <div className="text-sm text-gray-500">Qibla not set — detect your location to compute bearing.</div>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button onClick={requestLocation} className="px-4 py-2 rounded bg-indigo-600 text-white">{detecting ? "Detecting..." : "Detect Location"}</button>
                <button onClick={() => startCompass()} className="px-4 py-2 rounded border">Enable Compass</button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input value={manualLat} onChange={(e) => setManualLat(e.target.value)} placeholder="Latitude" className="p-2 border rounded" />
                <input value={manualLon} onChange={(e) => setManualLon(e.target.value)} placeholder="Longitude" className="p-2 border rounded" />
                <button onClick={applyManual} className="col-span-1 sm:col-span-2 px-4 py-2 rounded bg-green-600 text-white">Apply Manual Location</button>
            </div>

            <div className="mt-4">
                <button onClick={cameraOn ? stopCamera : startCamera} className="px-4 py-2 rounded border">{cameraOn ? "Stop Camera" : "Camera Background"}</button>
                {locError && <div className="mt-2 text-sm text-red-500">{locError}</div>}
                {compassError && <div className="mt-2 text-sm text-red-500">{compassError}</div>}
            </div>

            <div style={{ display: cameraOn ? "block" : "none" }} className="mt-4">
                <video ref={videoRef} className="w-full rounded" playsInline muted />
            </div>

            <div className="mt-6 text-left prose prose-sm prose-indigo">
                <h3>How Qibla Finder works</h3>
                <p>
                    We compute the most direct great-circle bearing from your current location to the Kaaba using standard spherical
                    formulas (bearing and haversine distance). The compass uses your device orientation to rotate the arrow live.
                </p>

                <h4>Permissions & privacy</h4>
                <p>
                    Location and device orientation are requested only to compute and display the Qibla direction locally in your
                    browser. We do not store or transmit your location.
                </p>
            </div>
        </div>
    );
};

export default QiblaCompassPage;
