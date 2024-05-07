import { Socket, io } from "socket.io-client";
import { DefaultEventsMap } from "socket.io/dist/typed-events";

export class SocketManager {
    socket: Socket<DefaultEventsMap, DefaultEventsMap>;

    constructor() {
        this.socket = io("http://localhost:3000");
    }
}
