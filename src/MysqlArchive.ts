import { Archive, ComparableValues, IOrderBy, MaybePromise, QueryRequest, QueryResponse } from 'clerk';
import { MysqlConnectionInfo } from 'connection/MysqlConnectionInfo';
import { createPool, Pool } from 'mysql2/promise';
import { MysqlArchiveTransaction } from 'transaction/MysqlArchiveTransaction';
import { QueryParser } from './query/QueryParser';


export class MysqlArchive extends Archive {

  protected _connectionInfo: MysqlConnectionInfo;

  protected _mysqlConn?: Pool;

  constructor(connectionInfo: MysqlConnectionInfo) {
    super();
    this._connectionInfo = connectionInfo;
  }

  async connect() {
    this._mysqlConn = await createPool(this._connectionInfo);
    return this._mysqlConn;
  }

  async connection(): Promise<Pool> {

    if (this._mysqlConn == null) {
      await this.connect();
    }

    return this._mysqlConn!;

  }

  async query<T = any>(request: QueryRequest<T>): MaybePromise<QueryResponse<T>> {

    let parser = new QueryParser(request);

    let sql = parser.parse();

    //this.requestToSQL(request);

    let conn = await this.connection();

    let response = new QueryResponse(request);

    try {
      let values = await conn.query(
        sql.query,
        sql.params
      );
      if (Array.isArray(values[0])) {
        let rows: any[] = values[0];

        if (request.hasIncludes()) {
          rows = this.arrangeIncludedProperties(request, rows);
          rows = await this.fetchChildRows(request, rows);
        }
        response.addRows(...values[0]);

      }
    } catch (err) {
      response.addErrors(err);
    }
    return response;

  }

  protected arrangeIncludedProperties(request: QueryRequest<any>, values: any[]) {

    for (let includedProp of request.includes) {

      let relation = request.entity.properties[includedProp]?.getRelation();
      if (relation!.type !== 'one-to-one' && relation!.type !== 'many-to-one') {
        continue;
      }

      let baseName = `related_to_${includedProp}_`;
      let newValues = values.map(row => {
        let newRow = { ...row };

        for (let rowPropertyName in row) {
          if (rowPropertyName.indexOf(baseName) === 0) {

            let newName = rowPropertyName.replace(baseName, '');
            let value = row[rowPropertyName];
            delete newRow[rowPropertyName];

            if (typeof newRow[includedProp] !== 'object') {
              newRow[includedProp] = {};
            }

            newRow[includedProp][newName] = value;
          }
        }

        return newRow;
      });

      values = newValues;
    }
    return values;
  }

  protected async fetchChildRows(request: QueryRequest<any>, values: any[]) {

    for (let includedProp of request.includes) {

      let relation = request.entity.properties[includedProp]?.getRelation();
      if (relation == null) {
        continue;
      }

      // Fetch child rows applies only for many-to-one relations
      if (relation.type !== 'many-to-one') {
        continue;
      }

      let store = request.entity.store();
      let childRequest = new QueryRequest(store.entity(relation.entity.name)!);
      let ordering: IOrderBy[] = [
        {
          property: relation?.property!,
          direction: 'asc'
        }
      ];

      if (relation.order != null) {
        if (Array.isArray(relation.order)) {
          ordering.push(...relation.order);
        } else {
          ordering.push(relation.order);
        }
      }

      // Query for children whose parent was queried in the main query
      childRequest.loadQueryRequest({
        properties: relation?.returning,
        order: ordering,
        filters: {
          ...relation?.filters ?? {},
          'included-in-previous': [relation?.property!, 'included in', values.map(m => {
            return m[includedProp];
          })]
        },
      });

      const childRows = await childRequest.fetch();
      if (childRows instanceof Error || childRows == null) {
        console.error('Failed to fetch associated child of property ', includedProp);
        return values;
      }

      const placeInRowAt: {
        [index: number]: any;
      } = {};

      // Associate children to parent index
      for (let index = 0; index <= childRows.length; index++) {
        let child = childRows[index];
        for (let row of values) {

          if (child[relation.property] === row[includedProp]) {
            // Initialize array
            if (!Array.isArray(placeInRowAt[index])) placeInRowAt[index] = [];

            placeInRowAt[index].push(row);
            // Found its parent? stop!
            break;
          }
        }
      }

      for (let index in placeInRowAt) {
        values[index][includedProp] = placeInRowAt[index];
      }

    }

    return values;
  }

  transaction(): MysqlArchiveTransaction {
    let trx = new MysqlArchiveTransaction(this);

    return trx;
  }

  async lastInsertedId(): MaybePromise<any> {
    return await this.execute('SELECT last_inserted_id();');
  }

  async execute(query: string, params: ComparableValues[] = []) {
    return (await this.connection()).execute(query, params);
  }
}

export type GeneratedQuerySQL = {
  query: string;
  params: any[];
};