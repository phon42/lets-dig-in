import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({port: 8080});

wss.on("connection", function connection(socket) {
    socket.on("message", function message(data) {
        console.log("[RECEIVE] Received: \"" + data + "\"");
        // move this elsewhere/space it out
        socket.close();
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
