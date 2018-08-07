const assert = require('assert')
const helper = require('./helper')

const QueryIterator = require('../')

helper('iterate', function (client) {
  it('iterates correctly', async function () {
    const iterator = new QueryIterator('SELECT * FROM generate_series(0, 200) num', [])
    const query = client.query(iterator)
    // this switched from on end which is a stream event to close
    const end = new Promise((resolve) => iterator.on('close', resolve))

    let total = 0;
    for await (const row of query) {
      total += row.num
    }
    assert.equal(total, 20100)

    return end
  })
})
