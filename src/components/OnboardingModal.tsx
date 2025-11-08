'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Predefined role/profession options
const ROLE_OPTIONS = [
  'UI/UX Designer',
  'Product Designer',
  'Graphic Designer',
  'Software Developer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'Project Manager',
  'Product Manager',
  'Account Manager',
  'Community Organizer',
  'Community Outreach',
  'Urban Planner',
  'Architect',
  'Researcher',
  'Student',
  'Educator',
  'Activist',
  'Content Creator',
  'Other',
];

// Predefined interest/topic options
const INTEREST_OPTIONS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Web Development',
  'Mobile Development',
  'Architecture',
  'Architectural Design',
  'Urban Design',
  'Graphic Design',
  'Product Design',
  'Politics',
  'Social Justice',
  'Climate Change',
  'Sustainability',
  'Community Development',
  'Education',
  'Healthcare',
  'Technology',
  'Arts & Culture',
  'Music',
  'Film & TV',
  'Animation',
  'Old School Cartoons',
  'Gaming',
  'Sports',
  'Food & Cooking',
  'Travel',
  'Science',
  'History',
  'Philosophy',
  'Psychology',
  'Business',
  'Entrepreneurship',
  'Marketing',
];

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export function OnboardingModal({ open, onClose, userId }: OnboardingModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [profession, setProfession] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleSave = async () => {
    if (!profession) {
      toast({
        title: "Please select a role",
        description: "Choose what best describes you.",
        variant: "destructive",
      });
      return;
    }

    if (interests.length === 0) {
      toast({
        title: "Please select at least one interest",
        description: "This helps us personalize your feed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          profession,
          interests,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }

      toast({
        title: "Welcome! 🎉",
        description: "Your profile has been set up. Enjoy your personalized feed!",
      });

      onClose();
      router.refresh(); // Refresh to show personalized content
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        title: "Something went wrong",
        description: "Please try again or update this later in settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Welcome to Society+! 👋</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Let's personalize your experience. This helps us show you content that matters to you.
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role/Profession Selection */}
          <div className="space-y-3">
            <Label htmlFor="profession" className="text-base font-semibold">
              What best describes you?
            </Label>
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger id="profession" className="w-full">
                <SelectValue placeholder="Select your role or profession" />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interests Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">
              What are you interested in?
              <span className="text-sm font-normal text-muted-foreground ml-2">
                (Select all that apply)
              </span>
            </Label>
            <div className="flex flex-wrap gap-2 p-4 border rounded-lg bg-muted/30 max-h-64 overflow-y-auto">
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = interests.includes(interest);
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer transition-all hover:scale-105 ${
                      isSelected ? 'bg-primary text-primary-foreground' : ''
                    }`}
                    onClick={() => toggleInterest(interest)}
                  >
                    {isSelected && <Check className="w-3 h-3 mr-1" />}
                    {interest}
                  </Badge>
                );
              })}
            </div>
            {interests.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {interests.length} interest{interests.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Skip for now
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !profession || interests.length === 0}
            className="min-w-[120px]"
          >
            {isLoading ? 'Saving...' : "Let's go! 🚀"}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground pt-2">
          You can always update these preferences later in your settings.
        </p>
      </DialogContent>
    </Dialog>
  );
}
