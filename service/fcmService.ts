export async function sendParkingNotification({
  street,
  routeId,
  warning15,
  warning5,
}: {
  street: string;
  routeId: number;
  warning15: Date;
  warning5: Date;
}) {
  try {
    const response = await fetch("https://api.ezpark.vn/api/send-fcm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        street,
        routeId,
        warning15: warning15.toISOString(),
        warning5: warning5.toISOString(),
      }),
    });

    if (!response.ok) {
      console.warn("FCM gửi thất bạii:", await response.text());
    }
  } catch (err) {
    console.error("sendParkingNotification error:", err);
  }
}
