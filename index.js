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
}

function decodeCall(parsed, result) {
}

function decodeResult(parsed, result) {
}

function decodeError(parsed, result) {
}

function decodeSubscribe(parsed, result) {
}

function decodeUnsubscribe(parsed, result) {
}

function decodePublish(parsed, result) {
}

function decodeEvent(parsed, result) {
}
