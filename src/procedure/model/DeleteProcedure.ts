import { IModelProcedure, IProcedureResponse } from 'clerk';
import { MysqlArchive } from "../../MysqlArchive";

export const DeleteProcedure: IModelProcedure<
  IProcedureResponse
> = {
  name: 'delete',
  execute: async (archive, request) => {

    if (!(archive instanceof MysqlArchive)) {
      return new Error('Create procedure expects an MysqlArchive!');
    }

    const model = request.model;
    let deleteSQL = `DELETE FROM \`${request.entity.source}\` `;

    // Filter by identifier
    deleteSQL += ` WHERE \`${request.entity.identifier.name}\` = ?`;

    try {
      let queryResponse = await archive.execute(
        deleteSQL,
        [await model.$id()]
      );

      console.log('MySQL DELETE response', queryResponse);

      return {
        procedure: 'delete',
        request,
        model: request.model,
        success: true,
        sql: deleteSQL,
        bindParams: [await model.$id()]
      };

    } catch (err) {
      console.error('FAILED to delete model using SQL query ', deleteSQL);
      return {
        procedure: 'delete',
        request,
        model: request.model,
        success: false,
        sql: deleteSQL,
        bindParams: [await model.$id()]
      };
    }

  }
};
