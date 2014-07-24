#nydus-protocol
Encoder/decoder for nydus, a simple RPC/PubSub protocol designed for use over WebSockets.

[![Build Status](https://img.shields.io/travis/tec27/nydus-protocol.png?style=flat)](https://travis-ci.org/tec27/nydus-protocol)
[![NPM](https://img.shields.io/npm/v/nydus-protocol.svg?style=flat)](https://www.npmjs.org/package/nydus-protocol)

[![NPM](https://nodei.co/npm/nydus-protocol.png)](https://nodei.co/npm/nydus-protocol/)

##Usage

##Protocol
Messages in nydus are JSON encoded arrays, with the first element describing the type of message. There are 9 types of messages:

* 0 - `WELCOME`
* 1 - `CALL`
* 2 - `RESULT`
* 3 - `ERROR`
* 4 - `SUBSCRIBE`
* 5 - `UNSUBSCRIBE`
* 6 - `PUBLISH`
* 7 - `EVENT`
* 8 - `REVOKE`

The meaning of the rest of the elements in the array depends on what type of message it is.

### WELCOME
Sent by the server to the client when the client connects. 

```
[ 0, protocolVersion, serverAgent ]
```
Example:
```
[ 0, 2, "AwesomeServer/1.0.1" ]
```

### CALL
Calls a remote procedure (client -> server or vice versa).

```
[ 1, callId, procPath, ... ]
```
`callId` is generated randomly, and needs to be unique for a client's requests in flight.
`procPath` is the path to the RPC.
Any number of RPC arguments may be passed after `procPath`.

Example:
```
[ 1, "asdf1234", "/my/cool/procedure", "param1", 2, { param: 3 } ]
```

### RESULT
A non-error result from a `CALL`, `SUBSCRIBE`, or `UNSUBSCRIBE` request.

```
[ 2, callId, ... ]
```
`callId` matches the id given by the requester.
Any number of results can be passed after `callId` (including none).

Example:
```
[ 2, "asdf1234",  "first result part", "second result part" ]
```

### ERROR
An error result from a `CALL`, `SUBSCRIBE`, or `UNSUBSCRIBE` request.

```
[ 3, callId, errorCode, errorDesc, errorDetails (optional) ]
```
`callId` matches the id given by the requester.
`errorCode` can be application-specific, although HTTP error codes and descriptions work decently
well for this purpose and are well documented.
`errorDetails` is an optional parameter (and may be as complex or as simple as desired).

Example:
```
[ 3, "asdf1234", 403, "unauthorized", { message: "You are not authorized to do this!" } ]
```

### SUBSCRIBE
Subscribe to receive events about a particular topic (client -> server).

```
[ 4, requestId, topicPath ]
```
`requestId` should be a randomly generated string, unique for the client's requests in flight.

The server will send a `RESULT` or `ERROR` message in response.

Example:
```
[ 4, "1234asdf", "/chat/myroom" ]
```

### UNSUBSCRIBE
Unsubscribe from a particular topic to which you had previously subscribed (client -> server).

```
[ 5, requestId, topicPath ]
```
`requestId` should be a randomly generated string, unique for the client's requests in flight.

The server will send a `RESULT` or `ERROR` message in response.

Example:
```
[ 5, "1234asdf", "/chat/myroom" ]
```

### PUBLISH
Publish an event to all clients subscribed to a topic. The server may decide whether or not to
accept the event, and how to modify it prior to sending it to other clients.

```
[ 6, topicPath, event, excludeMe (optional, defaults false) ]
```
`event` can be as complex or as simple as desired.
`excludeMe`, if true, specifies that the server should not send the event back to the current client.

Example:
```
[ 6, "/chat/myroom", "Hello!" ]
[ 6, "/chat/myroom", "Hello!", false ]
```

### EVENT
An event was published to a particular topic to which this client is subscribed.

```
[ 7, topicPath, event ]
```
`event` can be as complex or as simple as desired.

Example:
```
[ 7, "/chat/myroom", "Hello!" ]
```

### REVOKE
Tell a client that a subscription they'd previously registered has been revoked, and that they are
no longer subscribed to that topic.

```
[ 8, topicPath ]
```

Example:
```
[ 8, "/chat/myroom" ]
```

##See Also
[nydus](https://github.com/tec27/nydus) - The official server implementation
[nydus-client](https://github.com/tec27/nydus-client) - The official client implementation (for node and browsers via browserify)

##License
MIT
