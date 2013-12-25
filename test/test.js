var expect = require('chai').expect
  , proto = require('..')

function bindDecode(str) {
  return proto.decode.bind(proto, str)
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

    // WELCOME handling
    it('should parse valid WELCOME messages', function() {
      var message = [ proto.WELCOME, 1, 'NydusServer/1.0.1' ]
        , encoded = JSON.stringify(message)
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.WELCOME
                            , protocolVersion: 1
                            , serverAgent: 'NydusServer/1.0.1'
                            })
    })

    it('should throw on invalidly typed WELCOME messages', function() {
      var message = [ proto.WELCOME, '1', 'NydusServer/1.0.1' ]
        , encoded = JSON.stringify(message)
      expect(bindDecode(encoded)).to.throw(Error)

      message = [ proto.WELCOME, 1, 1 ]
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on shortened WELCOME messages', function() {
      var message = [ proto.WELCOME, 1 ]
        , encoded = JSON.stringify(message)
      expect(bindDecode(encoded)).to.throw(Error)
    })

    // CALL handling
    it('should parse parameter-less CALL messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId', '/test/path' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.CALL
                            , callId: 'coolId'
                            , procPath: '/test/path'
                            })
    })

    it('should parse single parameter CALL messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId', '/test/path', 'param' ])
        , result = proto.decode(encoded)
      expect(result).to.eql({ type: proto.CALL
                            , callId: 'coolId'
                            , procPath: '/test/path'
                            , params: [ 'param' ]
                            })
    })

    it('should parse vararg CALL messages', function() {
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

    it('should throw on invalidly typed CALL messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 7, '/test/path' ])
      expect(bindDecode(encoded)).to.throw(Error)

      encoded = JSON.stringify([ proto.CALL, 'coolId', 7 ])
      expect(bindDecode(encoded)).to.throw(Error)
    })

    it('should throw on shortened CALL messages', function() {
      var encoded = JSON.stringify([ proto.CALL, 'coolId' ])
      expect(bindDecode(encoded)).to.throw(Error)
    })
  })
})
