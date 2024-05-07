import { SocketManager } from "./SocketManager";
import { Game } from "./Game";

export const socketManager = new SocketManager();
export const game = new Game();

socketManager.socket.on("mapData", function (grid) {
    console.log("Received map data", grid);
    game.createHexGridMap(grid);
});
