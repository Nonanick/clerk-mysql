import { AppException, ComparableValues, MaybePromise } from 'clerk';
import { PoolConnection } from 'mysql2/promise';
import { MysqlArchive } from '../MysqlArchive';

export class MysqlArchiveTransaction {

  protected _trxConn?: PoolConnection;
  protected _ended: boolean = false;

  constructor(protected _conn: MysqlArchive) {
  }

  protected async getConnection() {
    if (this._ended) {
      throw new AppException('Mysql Transaction already finished!');
    }

    if (this._trxConn == null) {
      this._trxConn = await (await this._conn.connection()).getConnection();
      await this._trxConn.beginTransaction();
    }

    return this._trxConn;
  }


  async execute(
    query: string,
    params: ComparableValues[] = []
  ) {
    if (this._ended) {
      throw new AppException('Mysql Transaction already finished!');
    }

    let poolConn = await this.getConnection();

    try {
      let ret = await poolConn.execute(query, params);
      return ret;
    } catch (err) {
      await this.rollback();
      throw err;
    }
  }

  async lastInsertedId(): MaybePromise<any> {
    return await this.execute('SELECT last_inserted_id();');
  }

  async commit() {
    if (this._ended) {
      throw new AppException('Mysql Transaction already finished!');
    }
    this._ended = true;
    try {
      await this._trxConn!.commit();
    } catch (err) {
      await this._trxConn!.rollback();
      throw err;
    } finally {
      await this._trxConn!.release();
      delete this._trxConn;
    }
  }

  async rollback() {
    if (this._ended) {
      throw new AppException('Mysql Transaction already finished!');
    }
    this._ended = true;

    try {
      await this._trxConn!.rollback();
    } catch (err) {
      console.error('Failed to rollback mysql transaction! ', err);
    } finally {
      await this._trxConn!.release();
      delete this._trxConn;
    }
  }

}