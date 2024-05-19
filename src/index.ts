import { Socket, io } from 'socket.io-client';
import { init } from './game';
import { DefaultEventsMap } from '@socket.io/component-emitter';
import { Game } from 'estomania-server/types/Game';
import { Player } from 'estomania-server/types/Player';

let worker: Worker, gameUIManager: GameUIManager, socketManager: SocketManager

const mouseEventHandler = makeSendPropertiesHandler([
    'ctrlKey',
    'metaKey',
    'shiftKey',
    'button',
    'pointerType',
    'clientX',
    'clientY',
    'pageX',
    'pageY',
]);

const wheelEventHandlerImpl = makeSendPropertiesHandler([
    'deltaX',
    'deltaY',
]);

const keydownEventHandler = makeSendPropertiesHandler([
    'ctrlKey',
    'metaKey',
    'shiftKey',
    'keyCode',
]);

function wheelEventHandler(event, sendFn) {
    event.preventDefault();
    wheelEventHandlerImpl(event, sendFn);
}

function preventDefaultHandler(event) {
    event.preventDefault();
}

function copyProperties(src, properties, dst) {
    for (const name of properties) {
        dst[name] = src[name];
    }
}

function makeSendPropertiesHandler(properties) {
    return function sendProperties(event, sendFn) {
        const data = { type: event.type };
        copyProperties(event, properties, data);
        sendFn(data);
    };
}

function touchEventHandler(event, sendFn) {
    const touches = [];
    const data = { type: event.type, touches };
    for (let i = 0; i < event.touches.length; ++i) {
        const touch = event.touches[i];
        touches.push({
            pageX: touch.pageX,
            pageY: touch.pageY,
        });
    }
    sendFn(data);
}

const orbitKeys = {
    '37': true,  // left
    '38': true,  // up
    '39': true,  // right
    '40': true,  // down
};

function filteredKeydownEventHandler(event, sendFn) {
    const { keyCode } = event;
    if (orbitKeys[keyCode]) {
        event.preventDefault();
        keydownEventHandler(event, sendFn);
    }
}

let nextProxyId = 0;

class ElementProxy {
    id: number;
    worker: Worker;
    constructor(element, worker, eventHandlers) {
        this.id = nextProxyId++;
        this.worker = worker;
        const sendEvent = (data) => {
            this.worker.postMessage({
                type: 'event',
                id: this.id,
                data,
            });
        };

        worker.postMessage({
            type: 'makeProxy',
            id: this.id,
        });
        sendSize();
        for (const [eventName, handler] of Object.entries(eventHandlers)) {
            element.addEventListener(eventName, function (event) {
                //@ts-ignore
                handler(event, sendEvent);
            });
        }

        function sendSize() {
            const rect = element.getBoundingClientRect();
            sendEvent({
                type: 'size',
                left: rect.left,
                top: rect.top,
                width: element.clientWidth,
                height: element.clientHeight,
            });
        }

        // really need to use ResizeObserver
        window.addEventListener('resize', sendSize);
    }
}

function startWorker(canvas) {
    canvas.focus();
    const offscreen = canvas.transferControlToOffscreen();
    worker = new Worker(new URL('./offscreencanvas-worker-orbitcontrols.ts', import.meta.url), { type: 'module' });

    const eventHandlers = {
        contextmenu: preventDefaultHandler,
        mousedown: mouseEventHandler,
        mousemove: mouseEventHandler,
        mouseup: mouseEventHandler,
        pointerdown: mouseEventHandler,
        pointermove: mouseEventHandler,
        pointerup: mouseEventHandler,
        touchstart: touchEventHandler,
        touchmove: touchEventHandler,
        touchend: touchEventHandler,
        wheel: wheelEventHandler,
        keydown: filteredKeydownEventHandler,
    };
    const proxy = new ElementProxy(canvas, worker, eventHandlers);
    worker.postMessage({
        type: 'start',
        canvas: offscreen,
        canvasId: proxy.id,
    }, [offscreen]);
    console.log('using OffscreenCanvas');  /* eslint-disable-line no-console */
}

function startMainPage(canvas) {
    // init({ canvas, inputElement: canvas });
    console.log('using regular canvas');  /* eslint-disable-line no-console */
    alert("UNSUPPORTED_BROWSER error")
}

class SocketManager {

    socket: Socket<DefaultEventsMap, DefaultEventsMap>

    constructor(address: string) {
        this.socket = io(address)
        this._loadSocketListeners();
    }

    _loadSocketListeners() {
        this.socket.on('gameData', (gameData: Game) => {
            worker.postMessage({
                type: 'gameData',
                data: gameData
            })
            gameUIManager.updateGameTurn(gameData.turn)
            gameUIManager.setPlayerList(gameData.currentPlayers)
        })
    }
}

class GameUIManager {

    turn: number;
    playerList: Player[]

    turnCounterContainer: HTMLElement;
    playerInfoContainer: HTMLElement;

    constructor() {
        this.turn = 0;
    }

    updateGameTurn(turnNo: number) {
        this.turn = turnNo;

        if (!this.turnCounterContainer) {
            this.turnCounterContainer = document.querySelector('#turn_counter_container')
        }

        this._updateGameTurnCounter()
    }

    setPlayerList(playerList: Player[]) {

        this.playerList = playerList

        if (!this.playerInfoContainer) {
            this.playerInfoContainer = document.querySelector('#all_players_info_container')
        }

        this._createPlayerInfoDivForAll()

    }

    _updateGameTurnCounter() {
        if (!this.turnCounterContainer) return;
        this.turnCounterContainer.innerHTML = `Turn ${this.turn}`
    }

    _createPlayerInfoDivForAll() {
        if (!this.playerInfoContainer) return;
        this.playerList.forEach(player => {
            this._createPlayerInfoDiv(player)
        });

    }

    _createPlayerInfoDiv(playerData: Player) {

        if (!this.playerInfoContainer) return;

        const playerInfoDiv = document.createElement('div');
        playerInfoDiv.className = 'player_info_container'

        const playerNameDiv = document.createElement('div');
        playerNameDiv.className = 'player_info_name'
        playerNameDiv.innerHTML = playerData.uuid;

        const playerDataDiv = document.createElement('div');
        playerDataDiv.className = 'player_info_data'
        playerDataDiv.innerHTML = playerData.socketId

        playerInfoDiv.appendChild(playerNameDiv)
        playerInfoDiv.appendChild(playerDataDiv)

        this.playerInfoContainer.appendChild(playerInfoDiv)
    }
}

function main() {  /* eslint consistent-return: 0 */
    const canvas = document.querySelector('#c');
    if ((canvas as HTMLCanvasElement).transferControlToOffscreen) {
        startWorker(canvas);
    } else {
        alert("UNSUPPORTED BROWSER")
        startMainPage(canvas);
    }

    gameUIManager = new GameUIManager()
    socketManager = new SocketManager('http://localhost:3000')
}

main();

document.addEventListener('click', (e) => {
    e.preventDefault();
    worker.postMessage({
        type: 'raycastFromCamera'
    })
})