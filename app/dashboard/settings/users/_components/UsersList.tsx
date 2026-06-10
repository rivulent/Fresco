'use client';

import { Trash2, User } from 'lucide-react';
import { useState } from 'react';
import { Button } from '~/components/ui/Button';
import DeleteUserDialog from './DeleteUserDialog';

type User = {
  id: string;
  username: string;
};

type UsersListProps = {
  users: User[];
  currentUserId: string;
};

export default function UsersList({ users, currentUserId }: UsersListProps) {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  return (
    <>
      <div className="divide-y divide-border rounded-lg border">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <span className="font-medium">{user.username}</span>
                {user.id === currentUserId && (
                  <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    You
                  </span>
                )}
              </div>
            </div>
            {user.id !== currentUserId && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteTarget(user)}
                aria-label={`Delete user ${user.username}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
      </div>
      {deleteTarget && (
        <DeleteUserDialog
          open={!!deleteTarget}
          userId={deleteTarget.id}
          username={deleteTarget.username}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}
