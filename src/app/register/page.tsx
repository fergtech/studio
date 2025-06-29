import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join society+</h1>
          <p className="text-gray-600">Be part of the change you want to see in your community</p>
        </div>
        <RegisterForm />
      </div>
    </div>
  );
}
