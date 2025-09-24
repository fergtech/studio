"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { 
  detectLocationAutomatically, 
  detectLocationManually, 
  ResolvedLocation, 
  LocationDetectionResult 
} from '@/services/location';

interface LocationDetectionProps {
  onLocationDetected: (location: ResolvedLocation) => void;
  onSkip?: () => void;
  title?: string;
  description?: string;
  allowSkip?: boolean;
}

export function LocationDetection({ 
  onLocationDetected, 
  onSkip, 
  title = "Set Your Location",
  description = "Help us show you relevant local content and connect you with your community.",
  allowSkip = true 
}: LocationDetectionProps) {
  const [step, setStep] = useState<'auto' | 'manual' | 'success'>('auto');
  const [isDetecting, setIsDetecting] = useState(false);
  const [postalCode, setPostalCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [detectedLocation, setDetectedLocation] = useState<ResolvedLocation | null>(null);

  const handleAutoDetection = async () => {
    setIsDetecting(true);
    setError(null);

    try {
      const result: LocationDetectionResult = await detectLocationAutomatically({
        timeout: 10000,
        enableHighAccuracy: true
      });

      if (result.success && result.location) {
        setDetectedLocation(result.location);
        setStep('success');
        onLocationDetected(result.location);
      } else {
        setError(result.error || 'Location detection failed');
        setStep('manual');
      }
    } catch (err) {
      setError('Failed to detect location automatically');
      setStep('manual');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleManualDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postalCode.trim()) {
      setError('Please enter a valid postal/zip code');
      return;
    }

    setIsDetecting(true);
    setError(null);

    try {
      const result: LocationDetectionResult = await detectLocationManually(postalCode.trim());

      if (result.success && result.location) {
        setDetectedLocation(result.location);
        setStep('success');
        onLocationDetected(result.location);
      } else {
        setError(result.error || 'Could not find location for this postal code');
      }
    } catch (err) {
      setError('Failed to lookup location');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTryAgain = () => {
    setStep('auto');
    setError(null);
    setDetectedLocation(null);
  };

  if (step === 'success' && detectedLocation) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-green-700">Location Set!</CardTitle>
          <CardDescription>
            Your location has been set to <strong>{detectedLocation.displayName}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-muted-foreground">
            You can change this anytime in your profile settings.
          </div>
          {allowSkip && onSkip && (
            <Button onClick={onSkip} className="w-full">
              Continue
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <MapPin className="h-12 w-12 text-primary" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'auto' && (
          <div className="space-y-4">
            <Button 
              onClick={handleAutoDetection} 
              disabled={isDetecting}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Detecting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Detect My Location
                </>
              )}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="outline" 
                onClick={() => setStep('manual')}
                disabled={isDetecting}
              >
                Enter Postal Code Instead
              </Button>
            </div>
          </div>
        )}

        {step === 'manual' && (
          <form onSubmit={handleManualDetection} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="postalCode" className="text-sm font-medium">
                Postal/Zip Code
              </label>
              <Input
                id="postalCode"
                type="text"
                placeholder="e.g., 21001 or 90210"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                disabled={isDetecting}
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={isDetecting || !postalCode.trim()}
              className="w-full"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Looking up...
                </>
              ) : (
                'Find Location'
              )}
            </Button>
            
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={handleTryAgain}
                disabled={isDetecting}
                size="sm"
              >
                Try Auto-Detection Again
              </Button>
            </div>
          </form>
        )}

        {allowSkip && onSkip && (
          <div className="pt-2 border-t">
            <Button 
              variant="ghost" 
              onClick={onSkip}
              disabled={isDetecting}
              className="w-full text-muted-foreground"
            >
              Skip for now
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}