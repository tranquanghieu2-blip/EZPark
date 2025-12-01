import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import localizedFormat from "dayjs/plugin/localizedFormat";
import "dayjs/locale/vi";

dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);
dayjs.locale("vi");

export const formatMessageTime = (timestamp: string) => {
  const now = dayjs();
  const messageTime = dayjs(timestamp);

  // Nếu cùng ngày
  if (now.isSame(messageTime, "day")) {
    return messageTime.format("h:mm A"); 
  }

  // Nếu là hôm qua
  if (now.subtract(1, "day").isSame(messageTime, "day")) {
    return `Hôm qua ${messageTime.format("h:mm A")}`;
  }

  // Nếu cũ hơn nữa
  return messageTime.format("DD/MM/YYYY h:mm A"); 
};
