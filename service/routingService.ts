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


// service/mapbox/getRoute.ts
// service/mapbox/getRoute.ts
export async function getRoutes(start: [number, number], end: [number, number]) {
  try {
    const baseUrl = "https://api.mapbox.com/directions/v5/mapbox/driving";
    const accessToken =
      "pk.eyJ1IjoiaGlldWRldiIsImEiOiJjbWdpc3Q0eTIwZGtrMmpvcXFyNmx3eWYzIn0.IstlTiJSDcJR1KK288O4KA";

    // Giữ nguyên các tham số hiện tại (không thay đổi alternatives để tránh ảnh hưởng UI)
    const url = `${baseUrl}/${start[0]},${start[1]};${end[0]},${end[1]}?alternatives=false&geometries=geojson&overview=full&steps=false&language=vi&access_token=${accessToken}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Mapbox API error: ${res.status}`);

    const data = await res.json();
    if (!data.routes?.length) throw new Error("Không tìm thấy tuyến đường");

    // Chuẩn hóa: thêm mảng instructions cho từng route dựa trên legs[].steps[]
    // const routes = data.routes.map((route: any) => {
    //   // const instructions: {
    //   //   instruction: string;
    //   //   distance?: number;
    //   //   duration?: number;
    //   //   maneuver?: any;
    //   //   name?: string;
    //   //   geometry?: any;
    //   // }[] = [];

    //   // if (Array.isArray(route.legs)) {
    //   //   route.legs.forEach((leg: any) => {
    //   //     if (Array.isArray(leg.steps)) {
    //   //       leg.steps.forEach((step: any) => {
    //   //         const instrText =
    //   //           // Mapbox thường chứa instruction trong step.maneuver.instruction
    //   //           step.maneuver?.instruction ??
    //   //           // fallback: build a readable text
    //   //           `${step.maneuver?.type ?? "Đi tiếp"} ${step.name ?? ""}`.trim();

    //   //         instructions.push({
    //   //           instruction: instrText,
    //   //           distance: step.distance,
    //   //           duration: step.duration,
    //   //           maneuver: step.maneuver,
    //   //           name: step.name,
    //   //           geometry: step.geometry,
    //   //         });
    //   //       });
    //   //     }
    //   //   });
    //   // }

    //   // Trả về route gốc nhưng thêm trường instructions (không xóa hoặc đổi các trường khác)
    //   return {
    //     ...route,
    //   };
    // });

    return data.routes;
  } catch (error) {
    console.error("getRoute error:", error);
    throw error;
  }
}


