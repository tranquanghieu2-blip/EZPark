import {MAPBOX_API_KEY} from "@env";
export async function getRoutes(start: [number, number], end: [number, number]) {
  try {
    const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/driving";
    const mbToken = MAPBOX_API_KEY;
    const url = `${baseUrl}/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=false&geometries=geojson&overview=full&steps=false&language=vi&access_token=${mbToken}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`);

    const data = await res.json();
    if (!data.routes?.length) throw new Error("Không tìm thấy tuyến đường");
    return data.routes;
  } catch (error) {
    console.error("getRoute error:", error);
    throw error;
  }
}


