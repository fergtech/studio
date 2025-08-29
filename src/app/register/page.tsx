import { RegisterForm } from "@/components/auth/RegisterForm";

export const dynamic = 'force-dynamic';

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-6">Register</h1>
      <RegisterForm />
    </div>
  );
}
