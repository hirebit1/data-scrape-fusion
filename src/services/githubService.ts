
interface GithubUserData {
  name: string;
  login: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  avatar_url: string;
  html_url: string;
  created_at: string;
}

interface GithubRepo {
  name: string;
  description: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}

interface ContributionDay {
  date: string;
  count: number;
}

interface CommitStats {
  total_commits: number;
  contributions_this_year: number;
  streak_days: number;
  contribution_history: ContributionDay[];
}

export const fetchGithubData = async (url: string) => {
  try {
    const username = url.split('github.com/').pop()?.split('/')[0];
    if (!username) throw new Error('Invalid GitHub URL');

    // Fetch user data
    const userResponse = await fetch(`https://api.github.com/users/${username}`);
    if (!userResponse.ok) throw new Error('Failed to fetch GitHub user data');
    const userData: GithubUserData = await userResponse.json();

    // Fetch repositories
    const reposResponse = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=5`);
    if (!reposResponse.ok) throw new Error('Failed to fetch GitHub repositories');
    const reposData: GithubRepo[] = await reposResponse.json();

    // Fetch contribution stats (last year)
    const eventsResponse = await fetch(`https://api.github.com/users/${username}/events`);
    if (!eventsResponse.ok) throw new Error('Failed to fetch GitHub events');
    const eventsData = await eventsResponse.json();

    // Process commit statistics
    const commitStats: CommitStats = {
      total_commits: 0,
      contributions_this_year: 0,
      streak_days: 0,
      contribution_history: []
    };

    // Calculate commit stats from events
    const pushEvents = eventsData.filter((event: any) => event.type === 'PushEvent');
    commitStats.total_commits = pushEvents.reduce((acc: number, event: any) => 
      acc + event.payload.commits?.length || 0, 0);

    // Group commits by date for contribution history
    const commitsByDate = new Map<string, number>();
    pushEvents.forEach((event: any) => {
      const date = event.created_at.split('T')[0];
      commitsByDate.set(date, 
        (commitsByDate.get(date) || 0) + (event.payload.commits?.length || 0));
    });

    commitStats.contribution_history = Array.from(commitsByDate.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate streak
    let currentStreak = 0;
    const sortedDates = [...commitsByDate.keys()].sort().reverse();
    for (const date of sortedDates) {
      if (commitsByDate.get(date)! > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    commitStats.streak_days = currentStreak;

    return {
      profile: userData,
      repositories: reposData,
      commitStats,
    };
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error;
  }
};
