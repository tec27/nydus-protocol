import { expect } from 'chai'

import {
  encode,
  decode,
  protocolVersion,
  MessageType,
  NydusMessage,
  UnvalidatedMessage,
} from '../index'

function packet<T>({ type, data, id, path }: UnvalidatedMessage<T>): NydusMessage<T> {
  return { type, data, id, path } as any as NydusMessage<T>
}

describe('encode', () => {
  it('should encode WELCOMEs', () => {
    const packet = encode(MessageType.Welcome, protocolVersion)
    expect(packet).to.eql(`0|${protocolVersion}`)
  })

  it('should encode INVOKEs', () => {
    const packet = encode(MessageType.Invoke, { hello: true }, '7', '/hi there')
    expect(packet).to.eql('1$7~/hi%20there|{"hello":true}')
  })

  it('should encode INVOKEs without data', () => {
    const packet = encode(MessageType.Invoke, undefined, '7', '/hi')
    expect(packet).to.eql('1$7~/hi|')
  })

  it('should encode RESULTs', () => {
    const packet = encode(MessageType.Result, 'woo', '7')
    expect(packet).to.eql('2$7|"woo"')
  })

  it('should encode ERRORs', () => {
    const packet = encode(MessageType.Error, { status: 404, message: 'Not found' }, '7')
    expect(packet).to.eql('3$7|{"status":404,"message":"Not found"}')
  })

  it('should encode PUBLISHes', () => {
    const packet = encode(MessageType.Publish, { hi: 'world' }, undefined, '/publish')
    expect(packet).to.eql('4~/publish|{"hi":"world"}')
  })
})

describe('decode', () => {
  it('should decode WELCOMEs', () => {
    expect(decode(`0|${protocolVersion}`)).to.eql(
      packet({ type: MessageType.Welcome, data: protocolVersion }),
    )
  })

  it('should decode INVOKEs', () => {
    const result = decode('1$7~/hi%20there|{"hello":true}')
    expect(result).to.eql(
      packet({
        type: MessageType.Invoke,
        data: { hello: true },
        id: '7',
        path: '/hi there',
      }),
    )
  })

  it('should decode INVOKEs without data', () => {
    const result = decode('1$7~/hi|')
    expect(result).to.eql(packet({ type: MessageType.Invoke, id: '7', path: '/hi' }))
  })

  it('should decode RESULTs', () => {
    const result = decode('2$7|"woo"')
    expect(result).to.eql(packet({ type: MessageType.Result, id: '7', data: 'woo' }))
  })

  it('should decode ERRORs', () => {
    const result = decode('3$7|{"status":404,"message":"Not found"}')
    expect(result).to.eql(
      packet({
        type: MessageType.Error,
        id: '7',
        data: { status: 404, message: 'Not found' },
      }),
    )
  })

  it('should decode PUBLISHes', () => {
    const result = decode('4~/publish|{"hi":"world"}')
    expect(result).to.eql(
      packet({
        type: MessageType.Publish,
        path: '/publish',
        data: { hi: 'world' },
      }),
    )
  })

  const validations = [
    ['WELCOME with id', `0$7|${protocolVersion}`],
    ['WELCOME with path', `0~/errorme|${protocolVersion}`],
    ['WELCOME with wrong protocolVersion', '0|1'],
    ['INVOKE without id', '1~/path|7'],
    ['INVOKE without path', '1$7|"hi"'],
    ['RESULT without id', '2|"hi"'],
    ['RESULT with path', '2$7~/path|"hello"'],
    ['ERROR without id', '3|"hi"'],
    ['ERROR with path', '3$7~/path|"hello"'],
    ['PUBLISH with id', '4$7~/test|"message"'],
    ['PUBLISH without path', '4|"message"'],
    ['unparseable JSON', '1$7~/path|fail me now!'],
    ['messages that are too short (0)', ''],
    ['messages that are too short (1)', '1'],
    ['messages that are out of the expected type range (NaN)', 'a|"hi"'],
    ['messages that are out of the expected type range (too high)', '5|"hi"'],
  ]

  for (const [caseDesc, testData] of validations) {
    it(`should return an error on ${caseDesc}`, () => {
      expect(decode(testData)).to.eql({ type: MessageType.ParserError })
    })
  }
})
