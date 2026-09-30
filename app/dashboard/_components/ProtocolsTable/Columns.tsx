'use client';

import Image from 'next/image';

import { DataTableColumnHeader } from '@codaco/fresco-ui/DataTable/ColumnHeader';
import { type StrictColumnDef } from '@codaco/fresco-ui/DataTable/types';
import Checkbox from '@codaco/fresco-ui/form/fields/Checkbox';
import TimeAgo from '@codaco/fresco-ui/TimeAgo';

import { AnonymousRecruitmentURLButton } from './AnonymousRecruitmentURLButton';
import type { ProtocolWithInterviews } from './ProtocolsTableClient';

export const getProtocolColumns = (
  allowAnonRecruitment = false,
): StrictColumnDef<ProtocolWithInterviews>[] => {
  const columns: StrictColumnDef<ProtocolWithInterviews>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: 'identifier',
      accessorKey: 'id',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Identifier" />;
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2" title={row.original.id}>
            <span className="max-w-56 truncate">{row.original.id}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      sortingFn: 'text',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Name" />;
      },
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <Image
              src="/images/protocol-icon.png"
              alt="Protocol icon"
              width={32}
              height={24}
              className="shrink-0"
            />
            {row.original.name}
          </div>
        );
      },
    },
    {
      id: 'identifier',
      accessorKey: 'id',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Identifier" />;
      },
      cell: ({ row }) => {
        return (
          <span className="max-w-56 truncate" title={row.original.id}>
            {row.original.id}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: 'importedAt',
      sortingFn: 'datetime',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Imported" />;
      },
      cell: ({ row }) => <TimeAgo date={row.original.importedAt} />,
    },
    {
      accessorKey: 'lastModified',
      sortingFn: 'datetime',
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Modified" />;
      },
      cell: ({ row }) => <TimeAgo date={row.original.lastModified} />,
    },
  ];

  if (allowAnonRecruitment) {
    columns.push({
      id: 'participant-url',
      enableSorting: false,
      header: ({ column }) => {
        return (
          <DataTableColumnHeader
            column={column}
            title="Anonymous Participation URL"
          />
        );
      },
      cell: ({ row }) => {
        return <AnonymousRecruitmentURLButton protocolId={row.original.id} />;
      },
    });
  }

  return columns;
};
