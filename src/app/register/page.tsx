import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-6">Create an Account</h1>
      <RegisterForm />
    </div>
  );
}
