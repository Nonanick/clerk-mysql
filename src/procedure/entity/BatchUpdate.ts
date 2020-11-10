import {
  IFilterQuery,
  Procedure,
  MaybePromise,
  ComparableValues
} from 'auria-clerk';
import { ResultSetHeader } from 'mysql2';
import { MysqlArchive } from '../../MysqlArchive';
import { IMysqlEntityProcedureResponse } from './IMysqlEntityProcedureResponse';

export const BatchUpdate: Procedure.OfEntity.IProcedure<BatchUpdateContext> = {
  name: 'batch-update',
  async execute(archive, request) {

    if (!(archive instanceof MysqlArchive)) {
      return new Error('Batch Update expects an MySQL archive!');
    }

    let updateSQL = `UPDATE \`${request.entity.source}\` `;

    const bindParams: any[] = [];
    const updateProperties: string[] = [];
    for (let propName in request.context.values) {
      let value = request.context.values[propName];
      updateProperties.push('`' + request.entity.source + '`.`' + propName + '` = ?');
      bindParams.push(value);
    }
    updateSQL += ' SET ' + updateProperties.join(' , ');

    let whereParams: { [name: string]: ComparableValues; } = {};
    let whereQuery = archive.sqlFromFilter(request.context.filter, whereParams);
    let parsedWhere = archive.parseNamedAttributes(whereQuery, whereParams);
    updateSQL += ' WHERE ' + parsedWhere.query;
    bindParams.push(...parsedWhere.params);

    let batchUpdateResponse = await archive.execute(updateSQL, bindParams);

    let result: ResultSetHeader = batchUpdateResponse[0] as ResultSetHeader;

    return {
      bindedParams: bindParams,
      sql: updateSQL,
      success: result.affectedRows > 0,
      request: request,
    };
  }
};


export interface BatchUpdateContext extends Procedure.OfEntity.IContext {
  values: any;
  filter: IFilterQuery;
};

declare module 'auria-clerk' {
  interface Entity {
    execute(procedure: 'batch-update', context: BatchUpdateContext): MaybePromise<IMysqlEntityProcedureResponse>;
  }
}