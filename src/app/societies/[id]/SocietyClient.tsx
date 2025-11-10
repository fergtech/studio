"use client";

import React from 'react';

interface SocietyClientProps {
  society: {
    id: string;
    name: string;
    description?: string;
  };
  members?: any[];
  posts?: any[];
}

export default function SocietyClient({ society, members = [], posts = [] }: SocietyClientProps) {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 pb-16 md:pb-10">
      <h1 className="text-3xl font-bold mb-4">{society.name}</h1>
      {society.description && (
        <div className="bg-card rounded-lg shadow p-6 mb-6">
          <p className="text-muted-foreground">{society.description}</p>
        </div>
      )}
      <div className="grid gap-6">
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Members ({members.length})</h2>
          {/* Add members list here if needed */}
        </div>
        <div className="bg-card rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Posts ({posts.length})</h2>
          {/* Add posts list here if needed */}
        </div>
      </div>
    </div>
  );
}
