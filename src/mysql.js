'use strict'

const mysql = require('mysql2')
const Transaction = require('./transaction')

module.exports = class Mysql {
  constructor(opts = {}) {
    this.opts = opts
    this.pool = mysql.createPool(opts)
    this.promisePool = this.pool.promise()
  }

  async query(sql, args) {
    const [results] = await this.promisePool.query(sql, args)
    return results
  }

  async end() {
    return this.promisePool.end()
  }

  async beginTransaction() {
    const conn = await this.promisePool.getConnection()
    try {
      await conn.beginTransaction()
      return new Transaction(conn)
    } catch (err) {
      conn.release()
      throw err
    }
  }
}
