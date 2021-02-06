import { AppError, ComparableValues, IModelProcedure, IProcedureResponse } from 'clerk';
import { ResultSetHeader } from 'mysql2';

import { MysqlArchive } from '../../MysqlArchive';

export const CreateProcedure: IModelProcedure<
  IProcedureResponse
> = {
  name: 'create',
  execute: async (archive, request) => {

    if (!(archive instanceof MysqlArchive)) {
      return new Error('Create procedure expects a MysqlArchive!');
    }

    const model = request.model;
    const propertyNames: string[] = [];
    const propertyValues: ComparableValues[] = [];

    // Update state and fetch values
    let allValues = await model.$commit();

    // Failed?
    if (allValues instanceof Error) {
      return allValues;
    }

    for (let propName in allValues) {
      propertyNames.push(propName);
      propertyValues.push(allValues[propName]);
    }

    // Check for required properties
    for (let propertyName in request.entity.properties) {
      let property = request.entity.properties[propertyName];
      if (property.isRequired() && !propertyNames.includes(propertyName)) {
        return new AppError(
          + 'Failed to insert row into the MYSQL database!'
          + `\nProperty ${propertyName} is marked as required but was not set!`
        );
      }
    }

    if (
      propertyNames.length <= 0
      || propertyValues.length <= 0
      || propertyValues.length !== propertyNames.length
    ) {
      return new AppError(
        'Failed to build mysql INSERT query, the number of properties and values mismatch!'
      );
    }

    // Build SQL
    let insertSQL = `INSERT INTO \`${request.entity.source}\` ( `;
    insertSQL +=
      // (`prop1` , `prop2` , `prop3`)
      propertyNames
        .map(f => `\`${f}\``)
        .join(' , ')
      + ' ) VALUES ( '
      // VALUES ( ? , ? , ?)
      + propertyValues
        .map(f => ' ? ')
        .join(' , ')
      + ')';

    try {

      let queryResponse = await archive.execute(
        insertSQL,
        propertyValues
      );

      return {
        procedure: 'create',
        request,
        model: request.model,
        success: (queryResponse[0] as ResultSetHeader).affectedRows == 1,
        sql: insertSQL,
        bindParams: propertyValues,
      };

    } catch (err) {
      console.error('FAILED to insert model into mysql table!', err);
      return {
        procedure: 'create',
        request,
        model: request.model,
        success: false,
        sql: insertSQL,
        bindParams: propertyValues
      };
    }

  }
};
