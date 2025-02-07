
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Icons } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface GithubResultsProps {
  data: {
    profile: any;
    repositories: any[];
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
          <div className="grid grid-cols-3 gap-4 text-center">
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
