class MessageHandler
  lastMessages: {}

  constructor: (@conn) ->

  broadcast: (type, data, connections) ->
    return if JSON.stringify(data) is JSON.stringify(@lastMessages[@conn.sessionId])
    @lastMessages[@conn.sessionId] = data
    senderId = @conn.getId()
    connections.forEach (conn) ->
      id = conn.getId()
      if senderId isnt id
        conn.send JSON.stringify(data)

  handle: (data, connections) ->
    if data.type in ['open', 'close', 'save', 'select']
      @broadcast data.type, data, connections

module.exports = MessageHandler

