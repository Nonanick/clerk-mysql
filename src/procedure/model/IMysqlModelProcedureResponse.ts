import { Procedure } from 'auria-clerk';

export interface IMysqlModelProcedureResponse extends Procedure.OfModel.IResponse {
  sql: string;
  bindParams: any[];
}