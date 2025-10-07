import { useEffect, useState } from "react";
import { getRoute } from "@/service/routingService";

export function useRoutingBatch(routes: NoParkingRoute[] | null) {
  const [results, setResults] = useState<(any | null)[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!routes || routes.length === 0) return;

    setLoading(true);

    Promise.all(
      routes.map((r) => {
        const start: [number, number] = [r.location_begin[0], r.location_begin[1]];
        const end: [number, number] = [r.location_end[0], r.location_end[1]];
        return getRoute(start, end);
      })
    )
      .then(setResults)
      .finally(() => setLoading(false));
  }, [routes]);

  return { results, loading };
}
