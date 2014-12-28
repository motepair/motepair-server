var WsEmitterServer = require("./ws-emit-server.js");

var sm = new WsEmitterServer(3000);

sm.on("connection", function(conn){
  console.log("user connected")

  conn.on("change", function(message){
    conn.broadcast("change", message)
  });

  conn.on("cursor", function(message){
  	conn.broadcast("cursor", message)
  });

});

