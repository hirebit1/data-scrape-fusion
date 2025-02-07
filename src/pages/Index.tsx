
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { urlSchema, type UrlInputs } from "@/utils/validation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import { fetchGithubData } from "@/services/githubService";
import { GithubResults } from "@/components/GithubResults";

export default function Index() {
  const { toast } = useToast();
  const [urls, setUrls] = useState<Partial<UrlInputs>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [githubData, setGithubData] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      const validatedUrls = await urlSchema.parseAsync(urls);
      
      if (validatedUrls.github) {
        const data = await fetchGithubData(validatedUrls.github);
        setGithubData(data);
        toast({
          title: "Success",
          description: "GitHub data fetched successfully!",
        });
      }
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: error.errors[0].message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch GitHub data. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlChange = (type: keyof UrlInputs) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrls(prev => ({ ...prev, [type]: e.target.value }));
  };

  const renderIcon = (type: keyof typeof Icons) => {
    const Icon = Icons[type];
    return <Icon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Web Scraping Platform
          </h1>
          <p className="text-lg text-gray-600">
            Enter your URLs and let AI analyze your online presence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-1">
            {(["github", "linkedin", "portfolio"] as const).map((type) => (
              <Card key={type} className="p-6 glass-card hover-card">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    {renderIcon(type)}
                    <h2 className="text-lg font-medium capitalize">{type}</h2>
                  </div>
                  <Input
                    type="url"
                    placeholder={`Enter your ${type} URL`}
                    value={urls[type] || ""}
                    onChange={handleUrlChange(type)}
                    className="w-full"
                  />
                </div>
              </Card>
            ))}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Analyze URLs"
            )}
          </Button>
        </form>

        {githubData && (
          <div className="mt-8">
            <GithubResults data={githubData} />
          </div>
        )}
      </div>
    </div>
  );
}
