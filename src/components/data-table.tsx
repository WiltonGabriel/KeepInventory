import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type DataItem = {
  id: string;
  [key: string]: any;
};

// This type uses generics to accept any kind of data structure for a row.
// It is used by react-table to define the columns.
// See: https://tanstack.com/table/v8/docs/api/core/column-def
type ColumnDef<T> = {
  accessorKey: keyof T | 'actions';
  header: string;
  // The cell function receives the row data and can render any JSX.
  cell: (props: { row: { original: T } }) => React.ReactNode;
};


interface DataTableProps<T extends DataItem> {
  columns: ColumnDef<T>[];
  data: T[];
  emptyStateMessage: string;
}

export function DataTable<T extends DataItem>({ columns, data, emptyStateMessage }: DataTableProps<T>) {
  return (
    <Card>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead key={index}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  {columns.map((column, index) => (
                    <TableCell key={index}>{column.cell({ row: { original: item }})}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyStateMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
