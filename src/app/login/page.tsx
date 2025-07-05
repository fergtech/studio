import { LoginForm } from "@/components/auth/LoginForm";
import { Suspense } from 'react';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-semibold mb-6">Log In</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
