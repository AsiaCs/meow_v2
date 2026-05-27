"use client"

// Browser geolocation hook with explicit permission states + sessionStorage
// caching so the user isn't re-prompted on every navigation.
//
// Usage:
//   const { position, status, request, clear } = useUserLocation()
//   if (status === "idle") <button onClick={request}>Use my location</button>
//   if (position) <p>You're at {position.lat}, {position.lng}</p>

import { useCallback, useEffect, useRef, useState } from "react"

export interface UserPosition {
  lat: number
  lng: number
  /** Accuracy in meters. */
  accuracy: number
  /** Timestamp (ms epoch) when this fix was captured. */
  capturedAt: number
}

export type GeoStatus =
  | "idle"            // never asked yet (no cached fix, no in-flight request)
  | "loading"         // request in flight
  | "granted"         // we have a position
  | "denied"          // user blocked permission
  | "unavailable"     // browser doesn't support geolocation OR hardware error
  | "timeout"         // request timed out

const CACHE_KEY = "meow.userLocation.v1"
const CACHE_MAX_AGE_MS = 60 * 60 * 1000 // 1h

function readCache(): UserPosition | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as UserPosition
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null
    if (Date.now() - parsed.capturedAt > CACHE_MAX_AGE_MS) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(p: UserPosition): void {
  if (typeof window === "undefined") return
  try {
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(p))
  } catch { /* sessionStorage might be unavailable in private mode */ }
}

function clearCache(): void {
  if (typeof window === "undefined") return
  try { window.sessionStorage.removeItem(CACHE_KEY) } catch { /* */ }
}

export function useUserLocation(options?: {
  /** Request automatically on mount instead of waiting for explicit .request() */
  auto?: boolean
  /** Max wait before giving up (default 8s) */
  timeoutMs?: number
}) {
  const [position, setPosition] = useState<UserPosition | null>(() => readCache())
  const [status, setStatus] = useState<GeoStatus>(() => (readCache() ? "granted" : "idle"))
  const [error, setError] = useState<string | null>(null)
  const inFlightRef = useRef(false)
  const timeoutMs = options?.timeoutMs ?? 8000

  const request = useCallback(() => {
    if (inFlightRef.current) return
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable")
      setError("Geolocation is not supported in this browser.")
      return
    }
    inFlightRef.current = true
    setStatus("loading")
    setError(null)

    let settled = false
    const watchdog = setTimeout(() => {
      if (settled) return
      settled = true
      inFlightRef.current = false
      setStatus("timeout")
      setError("Timed out waiting for your location.")
    }, timeoutMs + 500)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (settled) return
        settled = true
        clearTimeout(watchdog)
        inFlightRef.current = false
        const fix: UserPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        }
        setPosition(fix)
        writeCache(fix)
        setStatus("granted")
      },
      (err) => {
        if (settled) return
        settled = true
        clearTimeout(watchdog)
        inFlightRef.current = false
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied")
          setError("Permission denied. Enable Location for this site in your browser settings.")
        } else if (err.code === err.TIMEOUT) {
          setStatus("timeout")
          setError("Timed out — try again or move somewhere with better signal.")
        } else {
          setStatus("unavailable")
          setError(err.message || "Could not get your location.")
        }
      },
      {
        enableHighAccuracy: false,
        timeout: timeoutMs,
        maximumAge: CACHE_MAX_AGE_MS,
      },
    )
  }, [timeoutMs])

  const clear = useCallback(() => {
    setPosition(null)
    setStatus("idle")
    setError(null)
    clearCache()
  }, [])

  useEffect(() => {
    if (options?.auto && status === "idle" && !position) request()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options?.auto])

  return { position, status, error, request, clear }
}
