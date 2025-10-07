export const getPolylineStyleOfRoute = (
  route: NoParkingRoute
): { strokeColor: string; strokeWidth: number } => {
  switch (route.type) {
    case "no parking":
      return { strokeColor: "red", strokeWidth: 4 };
    case "no stopping":
      return { strokeColor: "purple", strokeWidth: 4 };
    case "alternate days":
      return { strokeColor: "orange", strokeWidth: 4 };
    default:
      return { strokeColor: "gray", strokeWidth: 2 };
  }
};
