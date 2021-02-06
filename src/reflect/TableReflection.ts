import { MysqlArchive } from '../MysqlArchive';
import { ColumnReflection } from './ColumnReflection';

export class TableReflection {

  protected _columns?: {
    [name: string]: ColumnReflection;
  };

  constructor(
    protected archive: MysqlArchive,
    public name: string
  ) {

  }

  async getColumns() {

    if (this._columns != null) {
      return this._columns;
    }

    const tableInformation = await this.archive.execute(`
    SELECT * 
    FROM \`information_schema\`.\`tables\` 
    WHERE \`table_name\` = \`${this.name}\`
  `);

    console.log(tableInformation);

  }

}

interface TableInformation {
  table_catalog: "def";
  table_schema: string;
  table_name: string;
  table_type: "base table" | "view" | "system view";
  engine: string;
  row_format: "fixed" | "dynamic" | "compressed" | "redundant" | "compact";
  table_rows: number | null;
  avg_row_length: number;
  data_length: number;
  max_data_length: number;
  index_length: number;
  data_free: number;
  auto_increment: number;
  create_time: Date;
  update_time: Date;
  check_time: Date;
  table_collation: string;
  checksum: string;
  create_options: string;
  table_comment: string;
};

interface TableConstraintInformation {
  constraint_catalog: 'def';
  constraint_schema: string;
  constraint_name: string;
  constraint_type: 'primary key' | 'check' | 'unique' | 'foreign key';
  table_schema: string;
  table_name: string;
}