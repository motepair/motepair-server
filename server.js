var WsEmitterServer = require("./ws-emit-server.js");

var sm = new WsEmitterServer(3000);

sm.on("connection", function(conn){
  console.log("user connected")

  conn.on("change", function(message){
    conn.broadcast("change", message)
  });

  conn.on("selection", function(message){
  	conn.broadcast("selection", message)
  });

  conn.on("open-file", function(message){
  	conn.broadcast("open-file", message)
  });

});

