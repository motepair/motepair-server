var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 4444 });

wss.broadcast = function(data) {
  for (var i in this.clients)
    console.log("CLIENTE" + i)
    this.clients[i].send(data);
};

wss.on('connection', function(ws) {
  ws.on('message', function(message) {
    console.log(message);
    wss.broadcast(message);
  });
});
