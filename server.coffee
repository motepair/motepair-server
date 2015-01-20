{Duplex}    = require 'stream'
livedb      = require 'livedb'
livedbMongo = require 'livedb-mongo'
ws          = require 'ws'
sharejs     = require 'share'

server = new ws.Server({ port: 3000 });

backend = livedb.client livedb.memory()
# backend.addProjection '_users', 'users', 'json0', {x:true}

share = sharejs.server.createClient {backend}

numClients = 0

server.on 'connection', (client) ->
  numClients++
  stream = new Duplex objectMode:yes
  stream._write = (chunk, encoding, callback) ->
    console.log 's->c ', JSON.stringify(chunk)
    if client.state isnt 'closed' # silently drop messages after the session is closed
      client.send JSON.stringify(chunk)
    callback()

  stream._read = -> # Ignore. You can't control the information, man!

  stream.headers = client.upgradeReq.headers
  stream.remoteAddress = client.upgradeReq.connection.remoteAddress

  client.on 'message', (data) ->
    data = JSON.parse(data)
    console.log 'c->s ', JSON.stringify(data)
    stream.push data

  stream.on 'error', (msg) ->
    client.stop()

  client.on 'close', (reason) ->
    stream.push null
    stream.emit 'close'

    numClients--
    console.log 'client went away', numClients

  stream.on 'end', ->
    client.close()

  # ... and give the stream to ShareJS.
  share.listen stream

