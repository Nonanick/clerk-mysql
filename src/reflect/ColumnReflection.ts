import { ComparableValues } from 'clerk';

export class ColumnReflection {

}

interface MySQLColumnInformation {

  table_catalog: "def";
  table_schema: string;
  table_name: string;
  column_name: string;
  ordinal_position: number;
  column_default: null | ComparableValues;
  is_nullable: "yes" | "no";
  column_key: 'PRI' | 'UNI' | 'MUL';
  extra: string;
  privileges: string;
  column_coment: string;
  generation_expression: string;

  // No precision + length info
  data_type: string;
  // Data type + precision / length
  column_type: string;

  // string like types
  character_maximum_length: number;
  character_octet_length: number;
  character_set_name: string;
  collation_name: string;

  // number like types
  numeric_precision: number;
  numeric_scale: number;

  // spatial columns
  srs_id: null | number;
}