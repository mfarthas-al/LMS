import { UsersManager } from './UsersManager';

export default function Page() {
  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-slate-600">Create accounts and manage access.</p>
      </div>
      <UsersManager />
    </>
  );
}
