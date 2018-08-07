'use strict'
const Cursor = require('pg-cursor')
const EventEmitter = require('events').EventEmitter

class PgQueryIterator extends EventEmitter {
  constructor (text, values, options) {
    super()
    this.cursor = new Cursor(text, values)
    this._reading = false
    this._closed = false
    this.batchSize = (options || { }).batchSize || 100

    // delegate Submittable callbacks to cursor
    this.handleRowDescription = this.cursor.handleRowDescription.bind(this.cursor)
    this.handleDataRow = this.cursor.handleDataRow.bind(this.cursor)
    this.handlePortalSuspended = this.cursor.handlePortalSuspended.bind(this.cursor)
    this.handleCommandComplete = this.cursor.handleCommandComplete.bind(this.cursor)
    this.handleReadyForQuery = this.cursor.handleReadyForQuery.bind(this.cursor)
    this.handleError = this.cursor.handleError.bind(this.cursor)
  }

  submit (connection) {
    this.cursor.submit(connection)
    return this
  }

  close (callback) {
    this._closed = true
    const cb = callback || (() => this.emit('close'))
    this.cursor.close(cb)
  }

  async * generator () {
    if (this._reading || this._closed) {
      throw new Error('Generator can only be consumed once per query')
    }

    this._reading = true

    while (this._reading && !this._closed) {
      let rows
      try {
        rows = await batchRead(this.cursor, this.batchSize)
      } catch (err) {
        this._closed = true
        this._reading = false
        this.emit('error', err)
        return
      }

      // if we get a 0 length array we've read to the end of the cursor
      if (!rows.length) {
        this._closed = true
        this._reading = false
        setImmediate(() => this.emit('close'))
        return
      }

      for (let i = 0; i < rows.length; i++) {
        yield rows[i]
      }
    }
  }

  * [Symbol.asyncIterator] () {
    return this.generator()
  }
}

function batchRead(cursor, size) {
  return new Promise((resolve, reject) => {
    cursor.read(size, (err, rows) => {
      if (err) {
        reject(err)
      } else {
        resolve(rows)
      }
    })
  })
}

module.exports = PgQueryIterator
