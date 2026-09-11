import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SOCKET_URL || "http://127.0.0.1:7000", {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
