var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 4444 });

wss.broadcast = function(data) {
  for (var i in this.clients)
    console.log("------------------------------------------------")
    console.log("Session Code: " + this.clients[i].upgradeReq.headers['sec-websocket-key'] )
    console.log("Client Session Token: " + JSON.parse(data).sessionToken)
    if (this.clients[i].upgradeReq.headers['sec-websocket-key'] != JSON.parse(data).sessionToken) {
      console.log("Message Sent!")
      this.clients[i].send(data);
    }
};

wss.on('connection', function(ws) {
  sessionId = ws.upgradeReq.headers['sec-websocket-key']
  ws.send(JSON.stringify({ session: sessionId }))

  ws.on('message', function(message) {
    wss.broadcast(message);
  });
});
