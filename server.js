var WsEmitterServer = require("./ws-emit-server.js");

var sm = new WsEmitterServer();

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

  conn.on("close-file", function(message){
  	conn.broadcast("close-file", message)
  });

});

