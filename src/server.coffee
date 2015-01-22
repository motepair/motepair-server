
MessageHandler  = require './message_handler'
{Duplex}        = require 'stream'
livedb          = require 'livedb'
livedbMongo     = require 'livedb-mongo'
sharejs         = require 'share'
express         = require 'express'
http            = require 'http'
ws              = require 'ws'

port            = process.env.PORT || 3000
app             = express()
server          = http.createServer(app)

server.listen(port)

wss = new ws.Server({server: server})

backend = livedb.client livedb.memory()

share = sharejs.server.createClient {backend}

connections = []

wss.on 'connection', (client) ->
  connections.push client
  stream = new Duplex objectMode: yes
  stream._write = (chunk, encoding, callback) ->
    console.log 's->c ', JSON.stringify(chunk)
    if client.state isnt 'closed' # silently drop messages after the session is closed
      client.send JSON.stringify(chunk)
    callback()

  stream._read = -> # Ignore. You can't control the information, man!

  stream.headers = client.upgradeReq.headers
  stream.remoteAddress = client.upgradeReq.connection.remoteAddress

  handler = new MessageHandler(client)

  client.on 'message', (data) ->
    data = JSON.parse(data)
    console.log 'c->s ', JSON.stringify(data)

    # Yes! We can control the information, man!
    if data.a is 'meta'
      handler.handle(data, connections)
    else
      stream.push data

  stream.on 'error', (msg) ->
    client.stop()

  client.on 'close', (reason) ->
    console.log 'client went away', connections.length
    stream.push null
    stream.emit 'close'

    connections = (conn for conn in connections when conn.getId() isnt client.getId())

  stream.on 'end', ->
    client.close()

  # ... and give the stream to ShareJS.
  share.listen stream


ws::write = (event, message) ->
  data =
    event: event
    data: message

  @send JSON.stringify(data)

# ws::createSession = (sessionId) ->
#   connections[sessionId] = []  if connections[sessionId] is undefined
#   connections[sessionId].push this
#   @sessionId = sessionId

ws::broadcast = (event, message) ->
  senderId = @getId()
  console.log @sessionId
  if @sessionId isnt undefined
    connections[@sessionId].forEach each = (conn) ->
      id = conn.getId()
      if senderId isnt id
        data =
          event: event
          data: message

        conn.send JSON.stringify(data)

ws::getId = ->
  @upgradeReq.headers["sec-websocket-key"]
