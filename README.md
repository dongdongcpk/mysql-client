# mysql-client

基于 MySQL2 封装的 MySQL 客户端，提供更加便捷的 API 调用

## 用法

```js
'use strict'

const Mysql = require('@wac/mysql-client')

const client = new Mysql({
  host: 'localhost',
  user: 'root',
  database: 'test'
})

const results = await client.query('select * from table')
```

事务

```js
const tran = await client.beginTransaction()

await tran.query('update table set name = `Tony` where id = 101')
await tran.query('update table set name = `Rick` where id = 102')

await tran.commit()
```

回滚

```js
const tran = await client.beginTransaction()

try {
  await tran.query('update table set name = `Tony` where id = 101')
  await tran.commit()
} catch (err) {
  await tran.rollback()
}
```

## API

### Class: Mysql

#### query(sql[, args])

使用标准 MySQL2 的 API，详情参考：https://www.npmjs.com/package/mysql2#api-and-configuration

#### end()

关闭连接池中所有连接

#### beginTransaction()

返回一个 Transaction 实例

### Class: Transaction

#### query(sql[, args])

#### commit()

#### rollback()