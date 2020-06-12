'use strict'

const Mysql = require('../src/mysql')

const mockConnection = {
  beginTransaction: jest.fn(),
  release: jest.fn(),
  query: jest.fn(() => []),
  commit: jest.fn(),
  rollback: jest.fn()
}

const mockPool = {
  query: jest.fn(() => []),
  end: jest.fn(),
  getConnection: jest.fn(() => mockConnection)
}

jest.mock('mysql2', () => {
  return {
    createPool() {
      return {
        promise: jest.fn(() => mockPool)
      }
    }
  }
})

describe('mysql', () => {
  let client

  beforeAll(() => {
    client = new Mysql()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('使用原生query', async () => {
    await client.query('select * from db_foo.bar')
    expect(mockPool.query).toBeCalled()
  })

  it('调用pool.end()', async () => {
    await client.end()
    expect(mockPool.end).toBeCalled()
  })

  it('开始一个事务失败', async () => {
    mockConnection.beginTransaction = jest.fn(() => {
      throw new Error('begin transaction failed')
    })
    try {
      await client.beginTransaction()
    } catch (err) {
      expect(mockConnection.release).toBeCalled()
    }
  })

  it('执行事务', async () => {
    mockConnection.beginTransaction = jest.fn()

    const tran = await client.beginTransaction()
    await tran.query('update db_foo.bar set name = `sufang` where id = 100')
    await tran.query('update db_foo.bar set name = `Tony` where id = 100')
    await tran.commit()
    expect(mockConnection.beginTransaction).toBeCalledTimes(1)
    expect(mockConnection.query).toBeCalledTimes(2)
    expect(mockConnection.commit).toBeCalledTimes(1)
    expect(mockConnection.release).toBeCalledTimes(1)
  })

  it('事务失败，执行回滚', async () => {
    mockConnection.beginTransaction = jest.fn()
    mockConnection.query = jest.fn(() => {
      throw new Error('query failed')
    })

    const tran = await client.beginTransaction()
    try {
      await tran.query('update db_foo.bar set name = `sufang` where id = 100')
      await tran.commit()
    } catch (err) {
      await tran.rollback()
      expect(mockConnection.commit).not.toBeCalled()
      expect(mockConnection.rollback).toBeCalledTimes(1)
      expect(mockConnection.release).toBeCalledTimes(1)
    }
  })

  it('事务提交后执行sql失败', async () => {
    mockConnection.beginTransaction = jest.fn()
    mockConnection.query = jest.fn(() => [])

    const tran = await client.beginTransaction()
    try {
      await tran.query('update db_foo.bar set name = `sufang` where id = 100')
      await tran.commit()
      await tran.query('update db_foo.bar set name = `Tony` where id = 100')
    } catch (err) {
      expect(err.message).toBe('transaction has been committed or rollbacked')
    }
  })
})
