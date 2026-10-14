import { RoleSelector } from "@/features/auth/components/role-selector";

export default function SelectRolePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <RoleSelector redirectOnSelect={true} />
    </div>
  );
}
