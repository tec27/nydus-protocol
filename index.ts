import setupDebug from 'debug'
const debug = setupDebug('nydus-protocol')

export const protocolVersion = 3

export enum MessageType {
  Welcome = 0,
  Invoke = 1,
  Result = 2,
  Error = 3,
  Publish = 4,

  ParserError = 11,
}
const LAST_TYPE = MessageType.Publish

export interface NydusMessageBase {
  type: MessageType
}

export interface UnvalidatedMessage<T> {
  type: MessageType
  data?: T
  id?: string
  path?: string
}

export interface NydusWelcomeMessage extends NydusMessageBase {
  type: typeof MessageType.Welcome
  data: number
}

export interface NydusInvokeMessage<T> extends NydusMessageBase {
  type: typeof MessageType.Invoke
  data?: T
  id: string
  path: string
}

export interface NydusResultMessage<T> extends NydusMessageBase {
  type: typeof MessageType.Result
  data?: T
  id: string
}

export interface NydusErrorMessage<T> extends NydusMessageBase {
  type: typeof MessageType.Error
  data?: T
  id: string
}

export interface NydusPublishMessage<T> extends NydusMessageBase {
  type: typeof MessageType.Publish
  data?: T
  path: string
}

export interface NydusParserError extends NydusMessageBase {
  type: typeof MessageType.ParserError
}

export type NydusMessage<T> =
  | NydusWelcomeMessage
  | NydusInvokeMessage<T>
  | NydusResultMessage<T>
  | NydusErrorMessage<T>
  | NydusPublishMessage<T>
  | NydusParserError

const PARSER_ERROR: Readonly<NydusParserError> = { type: MessageType.ParserError }

export function encode(type: MessageType, data?: any, id?: string, path?: string): string {
  let output = '' + type
  if (id !== undefined) {
    output += '$' + id
  }
  if (path !== undefined) {
    output += '~' + encodeURI(path)
  }
  if (data === undefined) {
    output += '|'
  } else {
    output += '|' + JSON.stringify(data)
  }

  return output
}

function validate<T>(msg: NydusMessage<T>): NydusMessage<T> {
  const umsg = msg as any as UnvalidatedMessage<T>
  switch (msg.type) {
    case MessageType.Welcome:
      if (umsg.id !== undefined || umsg.path !== undefined) {
        debug('invalid WELCOME message, no id or path allowed')
        return PARSER_ERROR
      }
      if (msg.data !== protocolVersion) {
        debug('invalid WELCOME message, unsupported protocol version')
        return PARSER_ERROR
      }
      break
    case MessageType.Invoke:
      if (msg.id === undefined || msg.path === undefined) {
        debug('invalid INVOKE message, id and path required')
        return PARSER_ERROR
      }
      break
    case MessageType.Result:
      if (msg.id === undefined) {
        debug('invalid RESULT message, id is required')
        return PARSER_ERROR
      }
      if (umsg.path !== undefined) {
        debug('invalid RESULT message, path is not allowed')
        return PARSER_ERROR
      }
      break
    case MessageType.Error:
      if (msg.id === undefined) {
        debug('invalid RESULT message, id is required')
        return PARSER_ERROR
      }
      if (umsg.path !== undefined) {
        debug('invalid RESULT message, path is not allowed')
        return PARSER_ERROR
      }
      break
    case MessageType.Publish:
      if (umsg.id !== undefined) {
        debug('invalid PUBLISH message, id is not allowed')
        return PARSER_ERROR
      }
      if (msg.path === undefined) {
        debug('invalid PUBLISH message, path is required')
        return PARSER_ERROR
      }
      break
  }

  return msg
}

const JSON_ERROR = {}
function tryParse<T>(str: string): T | typeof JSON_ERROR {
  try {
    return JSON.parse(str)
  } catch (_err) {
    return JSON_ERROR
  }
}

export function decode<T>(str: string) {
  if (str.length < 2) {
    debug('invalid nydus message, too short')
    return PARSER_ERROR
  }

  const type = +str[0]
  if (isNaN(type) || type > LAST_TYPE) {
    debug('invalid nydus message, unrecognized type')
    return PARSER_ERROR
  }

  let id
  let path
  let data

  let begin = 2
  let i = 2
  const len = str.length
  if (str[i - 1] === '$') {
    for (; i < len; i++) {
      if (str[i] === '~' || str[i] === '|') {
        id = str.slice(begin, i)
        i++
        break
      }
      if (i - begin > 32) {
        debug('invalid nydus message, id too long')
        return PARSER_ERROR
      }
    }

    if (id == null || !id.length) {
      debug('invalid nydus message, empty id specified')
      return PARSER_ERROR
    }
  }

  begin = i
  if (str[i - 1] === '~') {
    for (; i < len; i++) {
      if (str[i] === '|') {
        path = decodeURI(str.slice(begin, i))
        i++
        break
      }
      if (i - begin > 1024) {
        debug('invalid nydus message, path too long')
        return PARSER_ERROR
      }
    }

    if (path == null || !path.length) {
      debug('invalid nydus message, empty path specified')
      return PARSER_ERROR
    }
  }

  if (str[i - 1] !== '|') {
    debug('invalid nydus message, no body found')
    return PARSER_ERROR
  }
  if (i < len) {
    data = tryParse(str.slice(i))
    if (data === JSON_ERROR) {
      debug('invalid nydus message, invalid JSON')
      return PARSER_ERROR
    }
  }

  return validate<T>({ type, id, path, data } as any as NydusMessage<T>)
}
