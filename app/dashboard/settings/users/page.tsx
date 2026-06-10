import { Suspense } from 'react';
import { getUsers } from '~/actions/users';
import SettingsSection from '~/components/layout/SettingsSection';
import ResponsiveContainer from '~/components/ResponsiveContainer';
import { Skeleton } from '~/components/ui/skeleton';
import PageHeader from '~/components/ui/typography/PageHeader';
import Paragraph from '~/components/ui/typography/Paragraph';
import { requireAppNotExpired } from '~/queries/appSettings';
import { requirePageAuth } from '~/utils/auth';
import AddUserDialog from './_components/AddUserDialog';
import UsersList from './_components/UsersList';

async function UsersListSection() {
  const session = await requirePageAuth();
  const users = await getUsers();

  return <UsersList users={users} currentUserId={session.user.userId} />;
}

export default async function UsersPage() {
  await requireAppNotExpired();
  await requirePageAuth();

  return (
    <>
      <ResponsiveContainer>
        <PageHeader
          headerText="User Management"
          subHeaderText="Manage user accounts for this Fresco installation."
        />
      </ResponsiveContainer>
      <ResponsiveContainer className="gap-4">
        <SettingsSection heading="Users" controlArea={<AddUserDialog />}>
          <Paragraph margin="none">
            All users have full administrative access to this Fresco
            installation, including managing protocols, participants, and
            interviews.
          </Paragraph>
        </SettingsSection>
        <Suspense
          fallback={
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          }
        >
          <UsersListSection />
        </Suspense>
      </ResponsiveContainer>
    </>
  );
}
