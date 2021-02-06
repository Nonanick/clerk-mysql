import {
  IFilterQuery,
  MaybePromise,
  ComparableValues,
  IEntityProcedure,
  IEntityProcedureContext,
  IEntityProcedureResponse
} from 'clerk';
import { ResultSetHeader } from 'mysql2';
import { MysqlArchive } from '../../MysqlArchive';
import { FilterParser } from '../../query/FilterParser';

export const BatchUpdate: IEntityProcedure = {
  name: 'batch-update',
  execute: async (archive, request) => {

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
    let parsedFilter = FilterParser.ParseAll(request.context.filter, whereParams);
    let parsedWhere = FilterParser.ParseNamedAttributes(parsedFilter, whereParams);

    updateSQL += ' WHERE ' + parsedWhere.query;

    bindParams.push(...parsedWhere.params);

    let batchUpdateResponse = await archive.execute(updateSQL, bindParams);

    let result: ResultSetHeader = batchUpdateResponse[0] as ResultSetHeader;

    let response: IEntityProcedureResponse = {
      procedure: 'batch-update',
      request: request,
      success: result.affectedRows > 0,
      bindedParams: bindParams,
      sql: updateSQL,
    };

    return response;
  }
};


export interface BatchUpdateContext extends IEntityProcedureContext {
  values: any;
  filter: IFilterQuery;
};

declare module 'clerk' {
  interface Entity {
    execute(procedure: 'batch-update', context: BatchUpdateContext): MaybePromise<IEntityProcedureResponse>;
  }
}