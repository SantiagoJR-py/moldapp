import { useEffect, useState } from 'react';

/** La hora actual, refrescada cada tanto: "hace 2 min" tiene que avanzar solo. */
export function useNow(intervalMs = 15000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return now;
}
