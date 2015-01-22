class MessageHandler
  lastMessage: null

  constructor: (@conn) ->

  broadcast: (type, data, connections) ->
    return if JSON.stringify(data) is JSON.stringify(@lastMessage)
    @lastMessage = data
    senderId = @conn.getId()

    connections.forEach (conn) ->
      id = conn.getId()
      if senderId isnt id
        conn.send JSON.stringify(data)

  handle: (data, connections) ->
    if data.type in ['open', 'close', 'save', 'cursor']
      @broadcast data.type, data, connections

module.exports = MessageHandler

