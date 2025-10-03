import Image from 'next/image';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin">
            <Image
              src="/apple-touch-icon.png"
              alt="Loading"
              width={80}
              height={80}
              className="opacity-90"
            />
          </div>
        </div>
        <p className="text-lg font-medium text-muted-foreground animate-pulse">
          Loading...
        </p>
      </div>
    </div>
  );
}
