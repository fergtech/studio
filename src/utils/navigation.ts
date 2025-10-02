import { useRouter } from 'next/navigation';

/**
 * Utility to handle navigation while preserving scroll position
 * Based on the recommended pattern for non-SPA navigation
 */
export const createNavigationHandler = (router: ReturnType<typeof useRouter>) => {
  return {
    /**
     * Navigate to a post while preserving scroll position
     */
    handlePostClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/posts/${id}`);
    },

    /**
     * Navigate to an idea while preserving scroll position and filter state
     */
    handleIdeaClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      const currentFilter = sessionStorage.getItem('feedFilter') || 'all';
      sessionStorage.setItem('feedFilter', currentFilter);
      router.push(`/ideas/${id}`);
    },

    /**
     * Navigate to an issue while preserving scroll position and filter state
     */
    handleIssueClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      const currentFilter = sessionStorage.getItem('feedFilter') || 'all';
      sessionStorage.setItem('feedFilter', currentFilter);
      router.push(`/issues/${id}`);
    },

    /**
     * Navigate to an initiative while preserving scroll position
     */
    handleInitiativeClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/initiatives/${id}`);
    },

    /**
     * Navigate to a profile while preserving scroll position
     */
    handleProfileClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/profile/${id}`);
    },

    /**
     * Navigate to a society while preserving scroll position
     */
    handleSocietyClick: (id: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/societies/${id}`);
    },

    /**
     * Navigate to a topic while preserving scroll position
     */
    handleTopicClick: (topic: string) => {
      sessionStorage.setItem('scrollY', window.scrollY.toString());
      router.push(`/topics/${encodeURIComponent(topic)}`);
    }
  };
};

/**
 * Restore scroll position when returning to the feed
 * Call this in useEffect in the feed component
 */
export const restoreScrollPosition = () => {
  const savedY = sessionStorage.getItem('scrollY');
  if (savedY) {
    const y = parseInt(savedY);
    window.scrollTo(0, y);
    sessionStorage.removeItem('scrollY');
  }
};