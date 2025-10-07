const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Bounding box Đà Nẵng (south,west,north,east)
const bbox = "15.975,108.10,16.125,108.28";

// Lấy đèn giao thông
export async function getTrafficSignals() {
  const query = `
    [out:json];
    node["highway"="traffic_signals"](${bbox});
    out;
  `;
  return fetchOverpass(query);
}

// Lấy tốc độ giới hạn
// export async function getSpeedLimits() {
//   const query = `
//     [out:json];
//     way["maxspeed"](${bbox});
//     out body;
//     >;
//     out skel qt;
//   `;
//   return fetchOverpass(query);
// }

// Lấy cảnh báo (hazard, traffic calming)
// export async function getHazards() {
//   const query = `
//     [out:json];
//     node["traffic_calming"](${bbox});
//     out;
//   `;
//   return fetchOverpass(query);
// }

// Lấy thông tin đường (highway + tên)
// export async function getRoadInfo() {
//   const query = `
//     [out:json];
//     way["highway"](${bbox});
//     out body;
//     >;
//     out skel qt;
//   `;
//   return fetchOverpass(query);
// }

// Hàm dùng chung để fetch Overpass
async function fetchOverpass(query: string) {
  try {
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain; charset=UTF-8" },
      body: query,
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status} loi traffic service`);
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching OSM data:", err);
    return null;
  }
}
