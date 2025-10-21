// // service/routingService.ts
// import { LineString } from "@/types/geojson";

// export async function getRoute(
//   start: [number, number],
//   end: [number, number]
// ): Promise<LineString | null> {
//   try {
//     const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;

//     const res = await fetch(url);

//     if (!res.ok) {
//       throw new Error(`HTTP error! status: ${res.status} lỗi routing`);
//     }

//     const data = await res.json();

//     if (!data.routes || data.routes.length === 0) {
//       throw new Error("Không tìm thấy route nào từ OSRM");
//     }

//     // 🟢 Trả về đúng GeoJSON LineString
//     // return data.routes[0].geometry as LineString;
//     return data.routes[0];
//   } catch (err) {
//     console.error("Error fetching route:", err);
//     return null;
//   }
// }


export async function getRoute(
  start: [number, number],
  end: [number, number]
) {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson&alternatives=true`;

    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("Không tìm thấy route nào từ OSRM");
    }

    return data.routes; 
  } catch (err) {
    console.error("Error fetching route:", err);
    return null; 
  }
}

