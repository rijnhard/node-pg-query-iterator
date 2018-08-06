# pg-query-iterator

[![Build Status](https://travis-ci.org/rijnhard/node-pg-query-iterator.svg)](https://travis-ci.org/rijnhard/node-pg-query-iterator)

Receive result rows from [pg](https://github.com/brianc/node-postgres) as a readable (object) stream.


## installation

```bash
$ npm install pg
$ npm install pg-query-stream
```

_requires pg>=2.8.1_


## use

```js
var pg = require('pg')
var QueryStream = require('pg-query-stream')
var JSONStream = require('JSONStream')

//pipe 1,000,000 rows to stdout without blowing up your memory usage
pg.connect(function(err, client, done) {
  if(err) throw err;
  var query = new QueryStream('SELECT * FROM generate_series(0, $1) num', [1000000])
  var stream = client.query(query)
  //release the client when the stream is finished
  stream.on('end', done)
  stream.pipe(JSONStream.stringify()).pipe(process.stdout)
})
```

The stream uses a cursor on the server so it efficiently keeps only a low number of rows in memory.

This is especially useful when doing [ETL](http://en.wikipedia.org/wiki/Extract,_transform,_load) on a huge table.  Using manual `limit` and `offset` queries to fake out async itteration through your data is cumbersom, and _way way way_ slower than using a cursor.

_note: this module only works with the JavaScript client, and does not work with the native bindings. libpq doesn't expose the protocol at a level where a cursor can be manipulated directly_

## contribution

I'm very open to contribution!  Open a pull request with your code or idea and we'll talk about it.  If it's not way insane we'll merge it in too: isn't open source awesome?


## Credits

- Brian M. Carlson for most of the node postgres ecosystem
