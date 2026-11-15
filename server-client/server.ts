import { WebSocketServer } from "ws";

const wss = new WebSocketServer({port: 8080});
let clientSocket = undefined;

interface Message {
    user: string;
    body: string;
    timestamp: number;
}

wss.on("connection", function connection(socket : WebSocket) {
    clientSocket = socket;

    if (socket === null) {
        return;
    }

    socket.onmessage(function message(data : MessageEvent) {
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

    socket.onclose("close", function close() {
        console.log("[CLOSE] Received socket close instruction.");
        clearInterval(interval);
    });
});

function sendMessage(message : string) : number {
    if (clientSocket === undefined) {
        return -1;
    }

    let data : Message = {
        user: "server",
        body: message,
        timestamp: Date.now()
    }
    clientSocket.send(JSON.stringify(message));

    return 0;
}
function close() {
    if (clientSocket === undefined) {
        return -1;
    }

    clientSocket.close();

    return 0;
}
