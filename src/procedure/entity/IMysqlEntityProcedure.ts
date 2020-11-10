
import { IArchive, MaybePromise, Procedure } from 'auria-clerk';
import { IMysqlEntityProcedureResponse } from './IMysqlEntityProcedureResponse';

export interface IMysqlEntityProcedure<
  Context extends Procedure.OfEntity.IContext = Procedure.OfEntity.IContext>
  extends Procedure.OfEntity.IProcedure<Context> {
  execute: (
    archive: IArchive,
    request: Procedure.OfEntity.IRequest
  ) => MaybePromise<IMysqlEntityProcedureResponse>;
}