// // hooks/useTraffic.ts
// import { useEffect, useState } from "react";
// import {
//   getTrafficSignals
// } from "../service/trafficService";

// export function useTraffic() {
//   const [signals, setSignals] = useState<any[]>([]);
//   // const [speedLimits, setSpeedLimits] = useState<any[]>([]);
//   // const [hazards, setHazards] = useState<any[]>([]);
//   // const [roads, setRoads] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     let isMounted = true;

//     async function fetchData() {
//       try {
//         setLoading(true);
//         const [sig] = await Promise.all([
//           getTrafficSignals(),
//           // getSpeedLimits(),
//           // getHazards(),
//           // getRoadInfo(),
//         ]);
//         if (isMounted) {
//           setSignals(sig?.elements || []);
//           // setSpeedLimits(spd?.elements || []);
//           // setHazards(haz?.elements || []);
//           // setRoads(rds?.elements || []);a
//         }
//       } catch (error) {
//         console.error("Error fetching traffic service:", error);
//       } finally {
//         if (isMounted) setLoading(false);
//       }
//     }

//     // chỉ fetch một lần khi component mount
//     fetchData();

//     return () => {
//       isMounted = false;
//     };
//   }, []);

//   return { signals, loading};
// }
