require 'newrelic'

MessageHandler  = require './message_handler'
Tracker         = require './tracker'
{Duplex}        = require 'stream'
livedb          = require 'livedb'
livedbMongo     = require 'livedb-mongo'
sharejs         = require 'share'
express         = require 'express'
getenv          = require 'getenv'

ws              = require 'ws'
fs              = require 'fs'

port            = process.env.PORT || 3000
app             = express()

app.use(express.static(__dirname + '/../public'));

MOTEPAIR_KEY    = getenv('MOTEPAIR_KEY', '')
MOTEPAIR_CERT   = getenv('MOTEPAIR_CERT', '')

if MOTEPAIR_KEY isnt '' and MOTEPAIR_CERT isnt ''
  httpServ     = require 'https'

  privateKey   = fs.readFileSync(MOTEPAIR_KEY, 'utf8')
  certificate  = fs.readFileSync(MOTEPAIR_CERT, 'utf8')
  credentials  = { key: privateKey, cert: certificate }
  server       = httpServ.createServer(credentials, app)

  console.log "Listening on https://localhost:#{port}/"
else
  httpServ = require 'http'
  server   = httpServ.createServer(app)

  console.log "Listening on http://localhost:#{port}/"


server.listen(port)

wss = new ws.Server({server: server})

backend = livedb.client livedb.memory()

share = sharejs.server.createClient {backend}

connections = []
connectionsDuration = []

wss.on 'connection', (client) ->
  tracker = new Tracker
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

  client.sessionStarted = new Date()

  client.on 'message', (data) ->
    return if data is 'ping'

    data = JSON.parse(data)
    console.log 'c->s ', JSON.stringify(data)

    if data.a is 'meta' and data.type isnt 'init'
      handler.handle(data, connections[client.sessionId])
    else if data.a is 'meta' and data.type is 'init'
      client.createSession data
    else
      stream.push data

  stream.on 'error', (msg) ->
    client.stop()

  client.on 'close', (reason) ->
    console.log 'client went away', connections.length
    stream.push null
    stream.emit 'close'
    tracker.connectionClosed(client, stream.remoteAddress)

    connections[client.sessionId] = (conn for conn in connections[client.sessionId] when conn.getId() isnt client.getId())

  stream.on 'end', ->
    client.close()

  # giving the stream to ShareJS.
  share.listen stream


ws::createSession = (data) ->
  connections[data.sessionId] = []  if connections[data.sessionId] is undefined
  connections[data.sessionId].push this

  @sessionId       = data.sessionId
  @atomVersion     = data.atomVersion
  @motepairVersion = data.motepairVersion

ws::getId = ->
  @upgradeReq.headers["sec-websocket-key"]
