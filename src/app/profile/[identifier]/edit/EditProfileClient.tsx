"use client";

import EditProfileForm from './EditProfileForm';
import { User } from '@prisma/client';

interface EditProfileClientProps {
  user: User;
}

export default function EditProfileClient({ user }: EditProfileClientProps) {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-24">
        <div className="mx-auto py-8">
          <div className="max-w-4xl mx-auto mt-12">
            <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Edit Your Profile</h1>
            <EditProfileForm user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}