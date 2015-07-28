# nydus-protocol
Encoder/decoder for nydus, a simple RPC/PubSub protocol designed for use over WebSockets.

[![Build Status](https://img.shields.io/travis/tec27/nydus-protocol.svg?style=flat)](https://travis-ci.org/tec27/nydus-protocol)
[![NPM](https://img.shields.io/npm/v/nydus-protocol.svg?style=flat)](https://www.npmjs.org/package/nydus-protocol)

[![NPM](https://nodei.co/npm/nydus-protocol.png)](https://nodei.co/npm/nydus-protocol/)

## Usage
#### `import protocol from 'nydus-protocol'`

<b><code>protocol.decode(str)</code></b>

Decode a string into an object corresponding to a nydus message. All decoded objects will have a
`type` field describing their message type (see below). Other fields that *may* exist are:

* `data` - a data payload for the message
* `id` - a unique ID representing this call/response
* `path` - a HTTP-like path representing a particular resource

If the message is not valid, a `PARSER_ERROR` message will be returned.

<b><code>protocol.encode({ type, data = undefined, id = undefined, path = undefined })</code></b>

Encode an object into a packet string. The object must have a `type` field describing its message
type, as well as other fields depending on what type of message it is (see below). All expected
fields are named as in the documentation below. This method is very permissive, and will not cause
errors if a message is formatted incorrectly (but such a message will usually result in a disconnect
if a server receives it, so beware).

<b><code>protocol.protocolVersion</code></b>

The protocol version of this module. This number will increase as the protocol changes, and is used
in `WELCOME` messages.

<b><code>protocol.WELCOME</code></b>

<b><code>protocol.INVOKE</code></b>

<b><code>protocol.RESULT</code></b>

<b><code>protocol.ERROR</code></b>

<b><code>protocol.PUBLISH</code></b>

<b><code>protocol.PARSER_ERROR</code></b>

Message types, which will be passed in the `type` field of decoded messages.

## Protocol

Nydus is designed to be a very simple protocol, with distinct roles for clients and servers.
Certain messages are only valid client -> server or server -> client. The basic idea is to allow
both clients and servers to route messages based on URL patterns. Clients can make RPCs to servers
(via `INVOKE`), and receive a direct `RESULT` or `ERROR` in response. Servers can `PUBLISH` events
on the fly to clients.

Clients do not communicate to the server which `PUBLISH` channels they are interested in; it is up
to the server to manage this list if it desires. One common way to do this would be in response to
an RPC, but it can also simply resort to over-publishing. Similarly, servers do not communicate to
clients which paths form valid RPCs. It is up to the server to properly reply to clients with an
`ERROR` if they `INVOKE` an invalid path.

Messages themselves are formatted in a simple string format:
```
<type>[$<id>][~<path>]|[data]
```

Each part of the message (except for the initial `type`) is prefixed by a character signaling which
section it is. All sections other than `type` and `data` are optional (and `data` need not contain
any actual data).

`type` can be:

* 0 - `WELCOME`
* 1 - `INVOKE`
* 2 - `RESULT`
* 3 - `ERROR`
* 4 - `PUBLISH`

`id` is a string of 1-32 characters, matching `/^[A-z0-9-]+$/`. It should be unique for all of the
current `INVOKE`s in flight between a client and server.

`path` is a HTTP-like path (e.g. `/hello/there`), URL-encoded.

`data` is, if present, JSON-encoded. The underlying data may be any type
(object, array, string, etc.).

### WELCOME
Sent by the server to the client when the client connects. `protocolVersion` should be sent as the
`data`. `id` and `path` must not be present.

```
0|3
=> { type: WELCOME, data: 3 }
```

### INVOKE
Invokes a remote procedure on the server (only valid client -> server). `id` should be set to an ID
unique for all the current `INVOKE`s in flight between this client and server. `path` should be a
URL-encoded path to the RPC the client wishes to invoke. `data` should be any necessary arguments
for the RPC.

```
1$asdf1234~/say%20hello|{"to":"everyone"}
=> { type: INVOKE, id: 'asdf1234', path: '/say hello', data: { to: 'everyone' } }
```

### RESULT
A non-error result from an `INVOKE`. This must only be sent from the server to the client in
response to an `INVOKE`. `id` should match the `INVOKE` this is a response to. `data` should contain
any results from the RPC. `path` must not be set.

```
2$asdf1234|"done"
=> { type: RESULT, id: 'asdf1234', data: "done" }
```

### ERROR
An error result from an `INVOKE`. This must only be sent from the server to the client in response
to an `INVOKE`. `id` should match the `INVOKE` this is a response to. `data` should contain any
details about the error that occurred. `path` must not be set.

```
3$asdf1234|{"status":404,"message":"Not found"}
=> { type: ERROR, id: 'asdf1234', data: { status: 404, message: 'Not found' } }
```

Error format is not enforced by Nydus, but a common convention is to utilize HTTP error codes and
messages, along with an optional body, i.e.:
```
{
  status: 418,
  message: 'I\'m a teapot',
  body: {
    reset: true,
  }
}
```

### PUBLISH
Publish an event to a client (only valid server -> client). `path` should be set to a path
identifying the resource to which the event pertains. `data` should be set to the event data.
`id` must not be set.

```
4~/chat|{"message":"hello"}
=> { type: PUBLISH, path: '/chat', data: { message: 'hello' } }
```

##See Also
[nydus](https://github.com/tec27/nydus) - The official server implementation

[nydus-client](https://github.com/tec27/nydus-client) - The official client implementation (for node and browsers via browserify or webpack)

##License
MIT
