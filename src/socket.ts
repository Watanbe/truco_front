import { io } from "socket.io-client";

export const socket = io("http://54.166.203.158:22000", {
    autoConnect: false
});