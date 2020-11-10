import { Procedure } from 'auria-clerk';

export interface IMysqlEntityProcedureResponse extends Procedure.OfEntity.IResponse {
  success: boolean;
  request: Procedure.OfEntity.IRequest;
  sql: string;
  bindedParams: any[];
}