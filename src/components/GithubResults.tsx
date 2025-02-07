
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface GithubResultsProps {
  data: {
    profile: any;
    repositories: any[];
    commitStats: {
      total_commits: number;
      contributions_this_year: number;
      streak_days: number;
      contribution_history: Array<{
        date: string;
        count: number;
      }>;
    };
  };
}

export function GithubResults({ data }: GithubResultsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <img 
              src={data.profile.avatar_url} 
              alt={data.profile.name} 
              className="w-16 h-16 rounded-full"
            />
            <div>
              <CardTitle>{data.profile.name}</CardTitle>
              <CardDescription>{data.profile.bio}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{data.profile.public_repos}</div>
              <div className="text-sm text-muted-foreground">Repositories</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.profile.followers}</div>
              <div className="text-sm text-muted-foreground">Followers</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.profile.following}</div>
              <div className="text-sm text-muted-foreground">Following</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{data.commitStats.streak_days}</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Commit Activity</CardTitle>
          <CardDescription>Your contribution history over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.commitStats.contribution_history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => format(new Date(date), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(date) => format(new Date(date), 'MMM d, yyyy')}
                  formatter={(value) => [`${value} commits`, 'Commits']}
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#2563eb" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold">{data.commitStats.total_commits}</div>
            <div className="text-sm text-muted-foreground">Total Commits</div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Repositories</h3>
        {data.repositories.map((repo) => (
          <Card key={repo.name}>
            <CardHeader>
              <CardTitle className="text-base">
                <a 
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  {repo.name}
                </a>
              </CardTitle>
              <CardDescription>{repo.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                {repo.language && (
                  <Badge variant="secondary">
                    {repo.language}
                  </Badge>
                )}
                <div className="flex items-center space-x-1">
                  <Icons.star className="h-4 w-4" />
                  <span>{repo.stargazers_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Icons.gitFork className="h-4 w-4" />
                  <span>{repo.forks_count}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Updated {format(new Date(repo.updated_at), 'MMM d, yyyy')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
