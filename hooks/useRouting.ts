// hooks/useRouting.ts
import { useEffect, useState } from "react";
import { getRoute } from "../service/routingService";

export function useRouting(
  start: [number, number] | null,
  end: [number, number] | null
) {
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!start || !end) return;

    setLoading(true);
    getRoute(start, end).then((data) => {
      setRoute(data);
      setLoading(false);
    });
  }, [start, end]);

  return { route, loading };
}
