import { useEffect } from "react";

type TimeRange = { start: string; end: string };
type Mode = "forbidden" | "allowed";

export const useScheduleTimeTriggers = (
  routes: NoParkingRoute[] | null,
  onTrigger: () => void,
  mode: Mode = "forbidden" // mặc định là trigger theo giờ cấm
) => {
  useEffect(() => {
    if (!routes) return;

    let timers: ReturnType<typeof setTimeout>[] = [];
    const now = new Date();
    const today = now.toISOString().split("T")[0];

    routes.forEach((route) => {
      route.time_range.forEach((range: TimeRange) => {
        // Nếu cấm cả ngày
        if (range.start === "00:00:00" && range.end === "23:59:59") {
          if (mode === "allowed") {
            // cả ngày bị cấm thì không có khoảng allowed
            return;
          }
        }

        const startTime = new Date(`${today}T${range.start}`);
        const endTime = new Date(`${today}T${range.end}`);

        if (mode === "forbidden") {
          // trigger khi bắt đầu và kết thúc cấm
          if (startTime > now) {
            timers.push(
              setTimeout(() => {
                console.log("Trigger forbidden START:", route.no_parking_route_id, range.start);
                onTrigger();
              }, startTime.getTime() - now.getTime())
            );
          }

          if (endTime > now) {
            timers.push(
              setTimeout(() => {
                console.log("Trigger forbidden END:", route.no_parking_route_id, range.end);
                onTrigger();
              }, endTime.getTime() - now.getTime())
            );
          }
        } else if (mode === "allowed") {
          // trigger khi bước vào giờ được đỗ (ngoài cấm)
          const dayStart = new Date(`${today}T00:00:00`);
          const dayEnd = new Date(`${today}T23:59:59`);

          // khoảng trước giờ cấm
          if (dayStart < startTime && startTime > now) {
            timers.push(
              setTimeout(() => {
                console.log("Trigger allowed BEFORE ban:", route.no_parking_route_id, "00:00:00 →", range.start);
                onTrigger();
              }, startTime.getTime() - now.getTime())
            );
          }

          // khoảng sau giờ cấm
          if (endTime < dayEnd && endTime > now) {
            timers.push(
              setTimeout(() => {
                console.log("Trigger allowed AFTER ban:", route.no_parking_route_id, range.end, "→ 23:59:59");
                onTrigger();
              }, endTime.getTime() - now.getTime())
            );
          }
        }
      });
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [routes, onTrigger, mode]);
};
