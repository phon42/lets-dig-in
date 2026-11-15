let SOCKET_URL = "localhost:8080";
let socket = new WebSocket("ws://" + SOCKET_URL);

socket.onopen = function(event) {
    console.log("[OPEN] Connection established.");
    console.log("[SEND] Sending message: \"Hello world!\"");
    socket.send("Hello world!");
};

socket.onmessage = function(event) {
    console.log("[RECEIVE] Message received from server: \"" + event.data + "\"");
};

socket.onclose = function(event) {
    if (event.wasClean) {
        console.log("[CLOSE] Connection closed cleanly, code \"" + event.code + "\", reason \"" + event.reason + "\".");
    } else {
        console.log("[CLOSE] Connection closed uncleanly, code \"" + event.code + "\", reason \"" + event.reason + "\".");
    }
};

socket.onerror = function(error) {
    console.log("[ERROR]");
};
