'use client';

import { HardDriveUpload, RefreshCw } from 'lucide-react';
import { hash as objectHash } from 'ohash';
import { useRouter } from 'next/navigation';
import { use, useMemo, useState, useTransition } from 'react';
import { refreshInterviews } from '~/actions/interviews';
import { ActionsDropdown } from '~/app/dashboard/_components/InterviewsTable/ActionsDropdown';
import { InterviewColumns } from '~/app/dashboard/_components/InterviewsTable/Columns';
import { DeleteInterviewsDialog } from '~/app/dashboard/interviews/_components/DeleteInterviewsDialog';
import { ExportInterviewsDialog } from '~/app/dashboard/interviews/_components/ExportInterviewsDialog';
import { GenerateInterviewURLs } from '~/app/dashboard/interviews/_components/GenerateInterviewURLs';
import { DataTable } from '~/components/DataTable/DataTable';
import { Button } from '~/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import type { GetInterviewsReturnType } from '~/queries/interviews';
import type { GetProtocolsReturnType } from '~/queries/protocols';

export const InterviewsTable = ({
  interviewsPromise,
  protocolsPromise,
}: {
  interviewsPromise: GetInterviewsReturnType;
  protocolsPromise: GetProtocolsReturnType;
}) => {
  const interviews = use(interviewsPromise);
  const router = useRouter();
  const [isRefreshing, startRefreshTransition] = useTransition();

  const [selectedInterviews, setSelectedInterviews] =
    useState<typeof interviews>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const handleRefresh = () => {
    startRefreshTransition(async () => {
      await refreshInterviews();
      router.refresh();
    });
  };

  const unexportedInterviews = useMemo(
    () => interviews.filter((interview) => !interview.exportTime),
    [interviews],
  );

  const completedInterviews = useMemo(
    () => interviews.filter((interview) => interview.finishTime),
    [interviews],
  );

  const handleDelete = (data: typeof interviews) => {
    setSelectedInterviews(data);
    setShowDeleteModal(true);
  };

  const handleExportUnexported = () => {
    setSelectedInterviews(unexportedInterviews);
    setShowExportModal(true);
  };

  const handleExportAll = () => {
    setSelectedInterviews(interviews);
    setShowExportModal(true);
  };

  const handleExportCompleted = () => {
    setSelectedInterviews(completedInterviews);
    setShowExportModal(true);
  };

  const handleResetExport = () => {
    setSelectedInterviews([]);
    setShowExportModal(false);
  };

  return (
    <>
      <ExportInterviewsDialog
        key={objectHash(selectedInterviews)}
        open={showExportModal}
        handleCancel={handleResetExport}
        interviewsToExport={selectedInterviews!}
      />
      <DeleteInterviewsDialog
        open={showDeleteModal}
        setOpen={setShowDeleteModal}
        interviewsToDelete={selectedInterviews ?? []}
      />
      <DataTable
        columns={InterviewColumns()}
        data={interviews}
        filterColumnAccessorKey="identifier"
        handleDeleteSelected={handleDelete}
        handleExportSelected={(selected) => {
          setSelectedInterviews(selected);
          setShowExportModal(true);
        }}
        actions={ActionsDropdown}
        defaultSortBy={{ id: 'lastUpdated', desc: true }}
        headerItems={
          <>
            <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-2 inline-block h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={interviews.length === 0}>
                  <HardDriveUpload className="mr-2 inline-block h-4 w-4" />
                  Export Interview Data
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportAll}>
                  Export all interviews
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={completedInterviews.length === 0}
                  onClick={handleExportCompleted}
                >
                  Export all completed interviews
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={unexportedInterviews.length === 0}
                  onClick={handleExportUnexported}
                >
                  Export all unexported interviews
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <GenerateInterviewURLs
              interviews={interviews}
              protocolsPromise={protocolsPromise}
            />
          </>
        }
      />
    </>
  );
};
