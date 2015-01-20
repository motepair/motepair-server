# types: [ open, close, save, selection ]
# data = { type:'open', data: { file: 'lib/main.coffee' } }

class MessageHandler
  constructor: (@connections, @conn) ->

  lastMessage: null

  updateConnections: (connections) =>
    @connections = connections
    console.log("connecitons", @connections.length,  connections.length)

  broadcast: (type, data) ->
    return if JSON.stringify(data) is JSON.stringify(@lastMessage)
    @lastMessage = data
    senderId = @conn.getId()
    console.log("broadcast", @connections.length)
    @connections.forEach (conn) ->
      id = conn.getId()
      if senderId isnt id
        console.log('Sending': JSON.stringify(data) )
        conn.send JSON.stringify(data)

  handle: (data) ->
    if @["on#{data.type}"]?
      @["on#{data.type}"](data)


  onopen: (data)->
    console.log("onOpen")
    @broadcast('open', data)

module.exports = MessageHandler

