
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

export const fetchGithubData = async (url: string) => {
  try {
    // Extract username from GitHub URL
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

    return {
      profile: userData,
      repositories: reposData,
    };
  } catch (error) {
    console.error('GitHub API Error:', error);
    throw error;
  }
};
