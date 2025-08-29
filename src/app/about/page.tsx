import { StaticPageLayout } from "@/components/layouts/StaticPageLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Heart, Users, MessageCircle, Target, Lightbulb, Globe } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <StaticPageLayout title="About society+">
      <div className="space-y-8">
        {/* Mission Statement */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <Heart className="w-4 h-4" />
            Built for changemakers
          </div>
          <p className="text-xl text-muted-foreground leading-relaxed">
            society+ is a platform designed to empower communities, facilitate meaningful debates, 
            and help people connect around the causes that matter most to them.
          </p>
        </div>

        <Separator />

        {/* What We Do */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            What We Do
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <h3 className="font-medium">Connect Communities</h3>
              </div>
              <p className="text-muted-foreground">
                Bring together like-minded individuals who share similar passions for social change, 
                environmental causes, and community improvement.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-accent" />
                <h3 className="font-medium">Foster Debates</h3>
              </div>
              <p className="text-muted-foreground">
                Create structured, respectful debates on important societal issues where different 
                perspectives can be shared and discussed constructively.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-accent" />
                <h3 className="font-medium">Generate Ideas</h3>
              </div>
              <p className="text-muted-foreground">
                Provide a space for innovative solutions and creative approaches to solving 
                complex social and environmental challenges.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                <h3 className="font-medium">Drive Impact</h3>
              </div>
              <p className="text-muted-foreground">
                Transform discussions into real-world action by connecting users with opportunities 
                to make a difference in their communities.
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Key Features */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Key Features</h2>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Society Discovery</Badge>
            <Badge variant="secondary">Structured Debates</Badge>
            <Badge variant="secondary">Issue Tracking</Badge>
            <Badge variant="secondary">Idea Sharing</Badge>
            <Badge variant="secondary">Community Building</Badge>
            <Badge variant="secondary">Real-time Discussions</Badge>
            <Badge variant="secondary">User Profiles</Badge>
            <Badge variant="secondary">Activity Feeds</Badge>
          </div>
        </div>

        <Separator />

        {/* Vision */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Our Vision</h2>
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6">
            <p className="text-lg leading-relaxed">
              We envision a world where technology serves as a bridge between diverse communities, 
              fostering understanding and collaboration. society+ aims to be the digital town square 
              where meaningful conversations happen and positive change begins.
            </p>
          </div>
        </div>

        <Separator />

        {/* Get Involved */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Get Involved</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Button asChild size="lg" className="w-full">
              <Link href="/societies">
                <Users className="w-4 h-4 mr-2" />
                Explore Societies
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full">
              <Link href="/contribute">
                <Heart className="w-4 h-4 mr-2" />
                Contribute
              </Link>
            </Button>
          </div>
          <p className="text-center text-sm text-muted-foreground">
            Join our growing community of changemakers and start making a difference today.
          </p>
        </div>

        {/* Version Info */}
        <div className="pt-6 border-t border-border">
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>society+ v1.0</span>
            <span>•</span>
            <span>Built for changemakers</span>
            <span>•</span>
            <span>© 2024</span>
          </div>
        </div>
      </div>
    </StaticPageLayout>
  );
}