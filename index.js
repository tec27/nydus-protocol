var debug = require('debug')('nydus-protocol')

exports.TYPES = { WELCOME: 0
                , CALL: 1
                , RESULT: 2
                , ERROR: 3
                , SUBSCRIBE: 4
                , UNSUBSCRIBE: 5
                , PUBLISH: 6
                , EVENT: 7
                }
// Set all the message types directly on the exports as well, for easy access
Object.keys(exports.TYPES).forEach(function(key) {
  exports[key] = exports.TYPES[key]
})

exports.decode = function(str) {
  var parsed = JSON.parse(str)
  if (!Array.isArray(parsed)) {
    throw new Error('parsed string was not an Array')
  } else if (parsed.length < 1) {
    throw new Error('invalid message length')
  }

  var result = {}
  result.type = parsed[0]
  switch(result.type) {
    case exports.WELCOME:
      decodeWelcome(parsed, result)
      break
    case exports.CALL:
      decodeCall(parsed, result)
      break
    case exports.RESULT:
      decodeResult(parsed, result)
      break
    case exports.ERROR:
      decodeError(parsed, result)
      break
    case exports.SUBSCRIBE:
      decodeSubscribe(parsed, result)
      break
    case exports.UNSUBSCRIBE:
      decodeUnsubscribe(parsed, result)
      break
    case exports.PUBLISH:
      decodePublish(parsed, result)
      break
    case exports.EVENT:
      decodeEvent(parsed, result)
      break
    default:
      throw new Error('invalid message type: ' + result.type)
  }

  debug('decoded %s as %j', str, result)
  return result
}

function decodeWelcome(parsed, result) {
  // [ WELCOME, protocolVersion, serverAgent ]
  if (parsed.length < 3) {
    throw new Error('invalid WELCOME message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'number') {
    throw new Error('invalid WELCOME message, protocolVersion must be a Number')
  } else if (typeof parsed[2] != 'string') {
    throw new Error('invalid WELCOME message, serverAgent must be a String')
  }

  result.protocolVersion = parsed[1]
  result.serverAgent = parsed[2]
}

function decodeCall(parsed, result) {
  // [ CALL, callId, procPath, ... ]
  if (parsed.length < 3) {
    throw new Error('invalid CALL message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid CALL message, callId must be a String')
  } else if (typeof parsed[2] != 'string') {
    throw new Error('invalid CALL message, procPath must be a String')
  }

  result.callId = parsed[1]
  result.procPath = parsed[2]
  if (parsed.length > 3) {
    result.params = parsed.slice(3)
  } else {
    result.params = []
  }
}

function decodeResult(parsed, result) {
  // [ RESULT, callId, ... ]
  if (parsed.length < 2) {
    throw new Error('invalid RESULT message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid RESULT message, callId must be a String')
  }

  result.callId = parsed[1]
  if (parsed.length > 2) {
    result.results = parsed.slice(2)
  } else {
    result.results = []
  }
}

function decodeError(parsed, result) {
  // [ ERROR, callId, errorCode, errorDesc, errorDetails (optional) ]
  if (parsed.length < 4) {
    throw new Error('invalid ERROR message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid ERROR message, callId must be a String')
  } else if (typeof parsed[2] != 'number') {
    throw new Error('invalid ERROR message, errorCode must be a Number')
  } else if (typeof parsed[3] != 'string') {
    throw new Error('invalid ERROR message, errorDesc must be a String')
  }

  result.callId = parsed[1]
  result.errorCode = parsed[2]
  result.errorDesc = parsed[3]
  if (parsed.length >= 5) {
    result.errorDetails = parsed[4]
  }
}

function decodeSubscribe(parsed, result) {
  // [ SUBSCRIBE, requestId, topicPath ]
  if (parsed.length < 3) {
    throw new Error('invalid SUBSCRIBE message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid SUBSCRIBE message, requestId must be a String')
  } else if (typeof parsed[2] != 'string') {
    throw new Error('invalid SUBSCRIBE message, topicPath must be a String')
  }

  result.requestId = parsed[1]
  result.topicPath = parsed[2]
}

function decodeUnsubscribe(parsed, result) {
  // [ UNSUBSCRIBE, topicPath ]
  if (parsed.length < 2) {
    throw new Error('invalid UNSUBSCRIBE message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid UNSUBSCRIBE message, topicPath must be a String')
  }

  result.topicPath = parsed[1]
}

function decodePublish(parsed, result) {
  // [ PUBLISH, topicPath, event, excludeMe (optional, defaults to false) ]
  if (parsed.length < 3) {
    throw new Error('invalid PUBLISH message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid PUBLISH message, topicPath must be a String')
  } else if (parsed.length > 3 && typeof parsed[3] != 'boolean') {
    throw new Error('invalid PUBLISH message, excludeMe must be a Boolean')
  }

  result.topicPath = parsed[1]
  result.event = parsed[2]
  result.excludeMe = parsed.length > 3 ? parsed[3] : false
}

function decodeEvent(parsed, result) {
  // [ EVENT, topicPath, event ]
  if (parsed.length < 3) {
    throw new Error('invalid EVENT message length: ' + parsed.length)
  } else if (typeof parsed[1] != 'string') {
    throw new Error('invalid EVENT message, topicPath must be a String')
  }

  result.topicPath = parsed[1]
  result.event = parsed[2]
}
