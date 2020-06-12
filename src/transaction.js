'use strict'

module.exports = class Transaction {
  constructor(conn) {
    this.conn = conn
  }

  async query(sql, args) {
    this._check()
    const [results] = await this.conn.query(sql, args)
    return results
  }

  async commit() {
    this._check()
    try {
      await this.conn.commit()
    } finally {
      this.conn.release()
      this.conn = null
    }
  }

  async rollback() {
    this._check()
    try {
      await this.conn.rollback()
    } finally {
      this.conn.release()
      this.conn = null
    }
  }

  _check() {
    if (!this.conn) {
      throw new Error('transaction has been committed or rollbacked')
    }
  }
}
