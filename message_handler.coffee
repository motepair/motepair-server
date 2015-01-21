class MessageHandler
  lastMessage: null

  constructor: (@connections, @conn) ->

  updateConnections: (@connections) ->

  broadcast: (type, data) ->
    return if JSON.stringify(data) is JSON.stringify(@lastMessage)
    @lastMessage = data
    senderId = @conn.getId()

    @connections.forEach (conn) ->
      id = conn.getId()
      if senderId isnt id
        console.log('Sending': JSON.stringify(data) )
        conn.send JSON.stringify(data)

  handle: (data) ->
    if data.type in ['open', 'close', 'save']
      @broadcast data.type, data


module.exports = MessageHandler

