"use client";

import { useState, useEffect, useCallback } from "react";
import { UserLocation, LocationStatus } from "@/lib/types";

// Default location: Ho Chi Minh City center
const DEFAULT_LOCATION: UserLocation = {
  lat: 10.7769,
  lng: 106.7009,
};

interface UseUserLocationReturn {
  location: UserLocation;
  status: LocationStatus;
  error: string | null;
  refreshLocation: () => void;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation>(DEFAULT_LOCATION);
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const getLocation = useCallback(() => {
    setStatus("loading");
    setError(null);

    if (typeof window === "undefined") {
      setStatus("error");
      setError("Không thể truy cập vị trí trong môi trường server");
      return;
    }

    if (!navigator.geolocation) {
      setStatus("error");
      setError("Trình duyệt không hỗ trợ định vị vị trí");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus("success");
        setError(null);
      },
      (err) => {
        let errorMessage = "Không thể lấy vị trí";

        switch (err.code) {
          case err.PERMISSION_DENIED:
            setStatus("denied");
            errorMessage = "Người dùng từ chối cấp quyền truy cập vị trí";
            break;
          case err.POSITION_UNAVAILABLE:
            setStatus("error");
            errorMessage = "Thông tin vị trí không khả dụng";
            break;
          case err.TIMEOUT:
            setStatus("error");
            errorMessage = "Hết thời gian chờ lấy vị trí";
            break;
          default:
            setStatus("error");
            errorMessage = "Lỗi không xác định khi lấy vị trí";
        }

        setError(errorMessage);
        // Keep default location when there's an error
        setLocation(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  }, []);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  return {
    location,
    status,
    error,
    refreshLocation: getLocation,
  };
}
