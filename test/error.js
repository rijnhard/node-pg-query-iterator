var assert = require('assert')
var helper = require('./helper')

var QueryIterator = require('../')

helper('error', function (client) {
  it('receives error on event emitter', function (done) {
    const iterator = new QueryIterator('SELECT * FROM asdf num', [])
    const query = client.query(iterator)

    query.on('error', function (err) {
      assert(err)
      assert.equal(err.code, '42P01')
      done()
    })

    query.generator().next() // noop to kick off reading
  })

  it('continues to function after iterator', function (done) {
    client.query('SELECT NOW()', done)
  })
})
