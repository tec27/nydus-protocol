var expect = require('chai').expect
  , proto = require('..')

function bindDecode(str) {
  return proto.decode.bind(proto, str)
}

function bindEncode(obj) {
  return proto.encode.bind(proto, obj)
}

describe('nydus-protocol', function() {
  describe('#decode()', function() {
    it('should throw on invalid JSON', function() {
      expect(proto.decode.bind(proto, '[}')).to.throw(Error)
    })

    it('should throw on non-Array JSON', function() {
      expect(bindDecode('{ test: true }')).to.throw(Error)
    })

    it('should throw on empty Array JSON', function() {
      expect(bindDecode('[]')).to.throw(Error)
    })
  })

  describe('#decode(WELCOME)', function() {
    it('should parse valid messages', function() {
      var message = [ proto.WELCOME, 1, 'NydusServer/1.0.1' ]
        , encoded = JSON.stringify(message)
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.WELCOME
                            , protocolVersion: 1
                            , serverAgent: 'NydusServer/1.0.1'
                            })
    })

    it('should throw on invalidly typed messages', function() {
      var message = [ proto.WELCOME, '1', 'NydusServer/1.0.1' ]
        , encoded = JSON.stringify(message)
      expect(bindDecode(encoded)).to.throw(Error)

      message = [ proto.WELCOME, 1, 1 ]
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on shortened messages', function() {
      var message = [ proto.WELCOME, 1 ]
        , encoded = JSON.stringify(message)
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(CALL)', function() {
    it('should parse parameter-less messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId', '/test/path' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.CALL
                            , callId: 'coolId'
                            , procPath: '/test/path'
                            , params: []
                            })
    })

    it('should parse single parameter messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId', '/test/path', 'param' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.CALL
                            , callId: 'coolId'
                            , procPath: '/test/path'
                            , params: [ 'param' ]
                            })
    })

    it('should parse vararg messages', function() {
      var encoded = JSON.stringify( [ proto.CALL
                                    , 'coolId'
                                    , '/test/path'
                                    , 'param'
                                    , 7
                                    , { test: true }
                                    , [ 1, 2, 3, 'four' ]
                                    ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.CALL
                            , callId: 'coolId'
                            , procPath: '/test/path'
                            , params: [ 'param'
                                      , 7
                                      , { test: true }
                                      , [ 1, 2, 3, 'four' ]
                                      ]
                            })
    })

    it('should throw on invalidly typed messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 7, '/test/path' ])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.CALL, 'coolId', 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(RESULT)', function() {
    it('should parse result-less messages', function() {
      var encoded = JSON.stringify([ proto.RESULT, 'coolId' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.RESULT
                            , callId: 'coolId'
                            , results: []
                            })
    })

    it('should parse single result messages', function() {
      var encoded = JSON.stringify([ proto.RESULT, 'coolId', 'result' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.RESULT
                            , callId: 'coolId'
                            , results: [ 'result' ]
                            })
    })

    it('should parse many result messages', function() {
      var encoded = JSON.stringify( [ proto.RESULT
                                    , 'coolId'
                                    , 'result'
                                    , 7
                                    , { test: true }
                                    , [ 1, 2, 3, 'four' ]
                                    ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.RESULT
                            , callId: 'coolId'
                            , results: [ 'result'
                                      , 7
                                      , { test: true }
                                      , [ 1, 2, 3, 'four' ]
                                      ]
                            })
    })

    it('should throw on invalidly typed messages', function() {
      var encoded = JSON.stringify([ proto.RESULT, 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.RESULT ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(ERROR)', function() {
    it('should parse a detail-less message', function() {
      var encoded = JSON.stringify([ proto.ERROR, 'coolId', 403, 'unauthorized' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.ERROR
                            , callId: 'coolId'
                            , errorCode: 403
                            , errorDesc: 'unauthorized'
                            })
    })

    it('should parsed a message with details', function() {
      var encoded = JSON.stringify([ proto.ERROR, 'coolId', 403, 'unauthorized',
            { message: 'You are not authorized to do this' }])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.ERROR
                            , callId: 'coolId'
                            , errorCode: 403
                            , errorDesc: 'unauthorized'
                            , errorDetails: { message: 'You are not authorized to do this' }
                            })
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.ERROR, 'coolId', 403 ])
      expect(bindDecode(encoded)).throw(Error)
    })

    it('should throw on invalidly typed messages', function() {
      var encoded = JSON.stringify([ proto.ERROR, 7, 403, 'unauthorized' ])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.ERROR, 'coolId', 'code', 'unauthorized'])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.ERROR, 'coolId', 403, 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(SUBSCRIBE)', function() {
    it('should parse a valid message', function() {
      var encoded = JSON.stringify([ proto.SUBSCRIBE, 'coolId', '/test/path' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.SUBSCRIBE
                            , requestId: 'coolId'
                            , topicPath: '/test/path'
                            })
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.SUBSCRIBE, 'coolId' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on invalid types', function() {
      var encoded = JSON.stringify([ proto.SUBSCRIBE, 7, '/test/path' ])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.SUBSCRIBE, 'coolId', 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(UNSUBSCRIBE)', function() {
    it('should parse a valid message', function() {
      var encoded = JSON.stringify([ proto.UNSUBSCRIBE, '/test/path' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.UNSUBSCRIBE
                            , topicPath: '/test/path'
                            })
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.UNSUBSCRIBE ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on invalid types', function() {
      var encoded = JSON.stringify([ proto.UNSUBSCRIBE, 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(PUBLISH)', function() {
    it('should parse a valid message using default excludeMe', function() {
      var encoded = JSON.stringify([ proto.PUBLISH, '/test/path', 'event' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.PUBLISH
                            , topicPath: '/test/path'
                            , event: 'event'
                            , excludeMe: false
                            })
    })

    it('should parse a valid message with excludeMe specified', function() {
      var encoded = JSON.stringify([ proto.PUBLISH, '/test/path', 'event', true ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.PUBLISH
                            , topicPath: '/test/path'
                            , event: 'event'
                            , excludeMe: true
                            })
    })

    it('should throw on shortened messages', function() {
      var encoded = JSON.stringify([ proto.PUBLISH, '/test/path' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on invalid types', function() {
      var encoded = JSON.stringify([ proto.PUBLISH, 7, 'event', true ])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.PUBLISH, '/test/path', 'event', 1 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#decode(EVENT)', function() {
    it('should parse valid messages', function() {
      var encoded = JSON.stringify([ proto.EVENT, '/test/path', 'event' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.EVENT
                            , topicPath: '/test/path'
                            , event: 'event'
                            })
    })

    it('should throw on shortned messages', function() {
      var encoded = JSON.stringify([ proto.EVENT, '/test/path' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on invalid types', function() {
      var encoded = JSON.stringify([ proto.EVENT, 7, 'event' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })

  describe('#encode()', function() {
    it('should throw on invalid types', function() {
      expect(bindEncode({})).to.throw(Error)
      expect(bindEncode({ type: 256 })).to.throw(Error)
    })
  })

  describe('#encode(WELCOME)', function() {
    it('should encode a valid message', function() {
      var obj = { type: proto.WELCOME
                , serverAgent: 'AwesomeServer/1.0.1'
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.eql([ proto.WELCOME
                                        , proto.protocolVersion
                                        , 'AwesomeServer/1.0.1'
                                        ])
    })

    it('should convert serverAgent to a string', function() {
      var obj = { type: proto.WELCOME, serverAgent: 7 }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.WELCOME
                                                , proto.protocolVersion
                                                , '7'
                                                ])
    })

    it('should throw on incomplete objects', function() {
      expect(bindEncode({ type: proto.WELCOME })).to.throw(Error)
      expect(bindEncode({ type: proto.WELCOME, serverAgent: null })).to.throw(Error)
    })
  })

  describe('#encode(CALL)', function() {
    it('should throw on incomplete objects', function() {
      var obj = { type: proto.CALL
                , callId: 'coolId'
                , procPath: null
                }
      expect(bindEncode(obj)).to.throw(Error)
      delete obj.procPath
      expect(bindEncode(obj)).to.throw(Error)
      obj.procPath = '/test/path'
      obj.callId = null
      expect(bindEncode(obj)).to.throw(Error)
      delete obj.callId
      expect(bindEncode(obj)).to.throw(Error)
    })

    it('should throw on incorrectly typed params', function() {
      var obj = { type: proto.CALL
                , callId: 'coolId'
                , procPath: '/test/path'
                , params: 7
                }
      expect(bindEncode(obj)).to.throw(Error)
      obj.params = 'asdf'
      expect(bindEncode(obj)).to.throw(Error)
      obj.params = {}
      expect(bindEncode(obj)).to.throw(Error)
    })

    it('should encode a valid parameterless object', function() {
      var obj = { type: proto.CALL
                , callId: 'coolId'
                , procPath: '/test/path'
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.CALL
                                                , 'coolId'
                                                , '/test/path'
                                                ])
    })

    it('should encode an object with an empty parameter list', function() {
      var obj = { type: proto.CALL
                , callId: 'coolId'
                , procPath: '/test/path'
                , params: []
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.CALL
                                                , 'coolId'
                                                , '/test/path'
                                                ])
    })

    it('should encode an object with parameters', function() {
      var obj = { type: proto.CALL
                , callId: 'coolId'
                , procPath: '/test/path'
                , params: [ 7
                          , { test: true }
                          , 'test'
                          , [ 'arrays' ]
                          ]
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.CALL
                                                , 'coolId'
                                                , '/test/path'
                                                , 7
                                                , { test: true }
                                                , 'test'
                                                , [ 'arrays' ]
                                                ])
    })

    it('should coerce values to correct types', function() {
      var obj = { type: proto.CALL
                , callId: 7
                , procPath: 4
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.CALL
                                                , '7'
                                                , '4'
                                                ])
    })
  })

  describe('#encode(RESULT)', function() {
    it('should throw on incomplete objects', function() {
      var obj = { type: proto.RESULT }
      expect(bindEncode(obj)).to.throw(Error)
      obj.callId = null
      expect(bindEncode(obj)).to.throw(Error)
    })

    it('should throw on invalid results list', function() {
      var obj = { type: proto.RESULT
                , callId: 'coolId'
                , results: 7
                }
      expect(bindEncode(obj)).to.throw(Error)
      obj.results = 'test'
      expect(bindEncode(obj)).to.throw(Error)
      obj.results = { test: true }
      expect(bindEncode(obj)).to.throw(Error)
    })

    it('should encode an object with no results', function() {
      var obj = { type: proto.RESULT, callId: 'coolId' }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal([ proto.RESULT, 'coolId' ])
    })

    it('should encode an object with empty results list', function() {
      var obj = { type: proto.RESULT, callId: 'coolId', results: [] }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal([ proto.RESULT, 'coolId' ])
    })

    it('should encode an object with results', function() {
      var obj = { type: proto.RESULT
                , callId: 'coolId'
                , results:  [ 7
                            , { test: true }
                            , 'test'
                            , [ 'arrays' ]
                            ]
                }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal( [ proto.RESULT
                                                , 'coolId'
                                                , 7
                                                , { test: true }
                                                , 'test'
                                                , [ 'arrays' ]
                                                ])
    })

    it('should coerce values to the correct type', function() {
      var obj = { type: proto.RESULT, callId: 7 }
        , result = proto.encode(obj)
      expect(JSON.parse(result)).to.deep.equal([ proto.RESULT, '7' ])
    })
  })
})
