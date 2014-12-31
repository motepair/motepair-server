var WsEmitterServer = require("./ws-emit-server.js");

var port = process.env.PORT || 3000

var sm = new WsEmitterServer(port);

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

