import React, { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OnboardingGuide {
  id: string;
  title: string;
  content: string;
  role: 'admin' | 'instructor' | 'user' | 'all';
  dontShowAgain?: boolean;
}

interface OnboardingProps {
  userRole: string;
  className?: string;
}

const GUIDES: OnboardingGuide[] = [
  {
    id: 'welcome-admin',
    title: '🎯 Welcome to Admin Dashboard',
    content:
      'You have full control over the system. Use the sidebar to manage customers, courses, and users. Check the quick actions below to get started immediately.',
    role: 'admin',
  },
  {
    id: 'welcome-instructor',
    title: '📚 Welcome to Instructor Portal',
    content:
      'Create and manage your courses here. You can track student progress and ratings. Use the teaching tools to organize your content effectively.',
    role: 'instructor',
  },
  {
    id: 'welcome-user',
    title: '👋 Welcome to Your Dashboard',
    content:
      'Browse and enroll in courses. Track your learning progress and connect with instructors. Your learning journey starts here!',
    role: 'user',
  },
  {
    id: 'navigation-tip',
    title: '🗺️ Navigation Tips',
    content:
      'Use the breadcrumb at the top to see where you are. The sidebar menu keeps you organized. Help icons (?) appear throughout the app for guidance.',
    role: 'all',
  },
];

const Onboarding: React.FC<OnboardingProps> = ({ userRole, className }) => {
  const [visibleGuides, setVisibleGuides] = useState<string[]>([]);

  useEffect(() => {
    const guides = GUIDES.filter(
      (g) => g.role === userRole || g.role === 'all'
    );

    const dismissed = localStorage.getItem('dismissed_guides') || '[]';
    const dismissedList = JSON.parse(dismissed);

    const newGuides = guides
      .filter((g) => !dismissedList.includes(g.id))
      .map((g) => g.id);

    setVisibleGuides(newGuides);
  }, [userRole]);

  const dismissGuide = (id: string, dontShowAgain = false) => {
    setVisibleGuides(visibleGuides.filter((g) => g !== id));

    if (dontShowAgain) {
      const dismissed = localStorage.getItem('dismissed_guides') || '[]';
      const dismissedList = JSON.parse(dismissed);
      if (!dismissedList.includes(id)) {
        dismissedList.push(id);
        localStorage.setItem('dismissed_guides', JSON.stringify(dismissedList));
      }
    }
  };

  if (visibleGuides.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {visibleGuides.map((guideId) => {
        const guide = GUIDES.find((g) => g.id === guideId);
        if (!guide) return null;

        return (
          <div
            key={guide.id}
            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm animate-in fade-in-0 slide-in-from-top-4 duration-300"
          >
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="font-semibold text-blue-900 text-sm mb-1">
                  {guide.title}
                </h4>
                <p className="text-blue-700 text-sm">{guide.content}</p>
              </div>
              <button
                onClick={() => dismissGuide(guide.id, false)}
                className="text-blue-500 hover:text-blue-700 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={() => dismissGuide(guide.id, true)}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 underline"
            >
              Don&apos;t show this again
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Onboarding;
