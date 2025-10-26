'use client';

import { AllTopicsClient } from './AllTopicsClient';

export default function BrowseTopicsPage() {
  return (
    <div className="w-full min-w-0 overflow-hidden">
      <div className="px-4 lg:px-6 pt-20 lg:pt-6 pb-24">
        <AllTopicsClient />
      </div>
    </div>
  );
}
