'use client';

import { Loader2, Plus } from 'lucide-react';
import { useState } from 'react';
import { createUser } from '~/actions/users';
import { Button } from '~/components/ui/Button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/AlertDialog';
import { Input } from '~/components/ui/Input';
import useZodForm from '~/hooks/useZodForm';
import { createUserSchema } from '~/schemas/auth';

export default function AddUserDialog() {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    trigger,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useZodForm({
    schema: createUserSchema,
    mode: 'onTouched',
  });

  const password = watch('password');

  const onSubmit = async (data: unknown) => {
    setServerError(null);
    const result = await createUser(data);

    if (!result.success) {
      setServerError(
        typeof result.error === 'string' ? result.error : 'Failed to create user',
      );
      return;
    }

    reset();
    setOpen(false);
  };

  const handleCancel = () => {
    reset();
    setServerError(null);
    setOpen(false);
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add User
      </Button>
      <AlertDialog open={open}>
        <AlertDialogContent>
          <form onSubmit={(event) => void handleSubmit(onSubmit)(event)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Add New User</AlertDialogTitle>
              <AlertDialogDescription>
                Create a new user account with full access to this Fresco
                installation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              {serverError && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {serverError}
                </div>
              )}
              <Input
                label="Username"
                hint="At least 4 characters, no spaces."
                type="text"
                placeholder="username..."
                autoComplete="off"
                error={errors.username?.message}
                {...register('username')}
              />
              <Input
                label="Password"
                hint="At least 8 characters with lowercase, uppercase, number, and symbol."
                type="password"
                placeholder="******************"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password', {
                  onChange: () => trigger('password'),
                })}
              />
              {password && password.length > 0 && (
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="******************"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    onChange: () => trigger('confirmPassword'),
                  })}
                />
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                type="button"
                disabled={isSubmitting}
                onClick={handleCancel}
              >
                Cancel
              </AlertDialogCancel>
              <Button disabled={isSubmitting || !isValid} type="submit">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
