
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
    if data.a is 'meta' and data.type isnt 'init'
      handler.handle(data, connections[client.sessionId])
    else if data.a is 'meta' and data.type is 'init'
      client.createSession data.sessionId
    else
      stream.push data

  stream.on 'error', (msg) ->
    client.stop()

  client.on 'close', (reason) ->
    console.log 'client went away', connections.length
    stream.push null
    stream.emit 'close'

    connections[client.sessionId] = (conn for conn in connections[client.sessionId] when conn.getId() isnt client.getId())

  stream.on 'end', ->
    client.close()

  # giving the stream to ShareJS.
  share.listen stream


ws::createSession = (sessionId) ->
  connections[sessionId] = []  if connections[sessionId] is undefined
  connections[sessionId].push this
  @sessionId = sessionId

ws::getId = ->
  @upgradeReq.headers["sec-websocket-key"]
