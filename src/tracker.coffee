Keen   = require 'keen-js'
geoip  = require 'geoip-lite'
getenv = require 'getenv'

class Tracker

  constructor: ->

    @KEEN_TRACK = getenv.bool('KEEN_TRACK', false)

    @KEEN_PROJECTID = getenv('KEEN_PROJECT_ID', '')
    @KEEN_WRITEKEY = getenv('KEEN_WRITE_KEY', '')

    @client = new Keen({
      projectId: @KEEN_PROJECTID,
      writeKey: @KEEN_WRITEKEY
    })

  ready: ->
    (@KEEN_TRACK and @KEEN_PROJECTID isnt '' and @KEEN_WRITEKEY isnt '')

  connectionClosed: (client, remoteAddress) ->
    return unless @ready()

    connection = {
      sessionId: client.sessionId,
      duration: (new Date() - client.sessionStarted)/60000, # in minutes
      atomVersion: client.atomVersion,
      motepairVersion: client.motepairVersion
    }

    @client.addEvent "connections", connection, (err, res) ->
      if err
        console.log('Connection could not be saved.')
      else
        console.log('Connection logged.', connection, res)

module.exports = Tracker
