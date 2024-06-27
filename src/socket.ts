import { io } from "socket.io-client";

export const socket = io("http://3.90.232.177:22000", {
    autoConnect: false
});