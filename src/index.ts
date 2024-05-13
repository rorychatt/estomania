import { init } from './shared-orbitcontrols';

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

        // register an id
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
    const worker = new Worker(new URL('./offscreencanvas-worker-orbitcontrols.ts', import.meta.url), { type: 'module' });

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
    init({ canvas, inputElement: canvas });
    console.log('using regular canvas');  /* eslint-disable-line no-console */
}

function main() {  /* eslint consistent-return: 0 */
    const canvas = document.querySelector('#c');
    if ((canvas as HTMLCanvasElement).transferControlToOffscreen) {
        startWorker(canvas);
    } else {
        startMainPage(canvas);
    }
}

main();