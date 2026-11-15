import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({port: 8080});
let clientSocket = undefined;

wss.on("connection", function connection(socket) {
    clientSocket = socket;

    socket.on("message", function message(data) {
        console.log("[RECEIVE] Received: \"" + data + "\"");
        // move this elsewhere/space it out
        setTimeout(function() {
            close();
        }, (10 + 1) * 1000);
    });

    socket.send("[RECEIVE] Connection received.");

    let interval = setInterval(function() {
        console.log("[SEND] Sending message: \"Hi!\".");
        socket.send("H!");
    }, 1000);

    socket.on("close", function close() {
        console.log("[CLOSE] Received socket close instruction.");
        clearInterval(interval);
    });
});

function sendMessage(message) {
    if (clientSocket === undefined) {
        return -1;
    }

    clientSocket.send(message);

    return 0;
}
function close() {
    if (clientSocket === undefined) {
        return -1;
    }

    clientSocket.close();

    return 0;
}
