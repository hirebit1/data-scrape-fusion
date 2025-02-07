
import { Card } from "./ui/card";
import { Progress } from "./ui/progress";
import { Icons } from "./icons";

interface PortfolioResultsProps {
  data: any;
  analysis: any;
}

export function PortfolioResults({ data, analysis }: PortfolioResultsProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-gray-900">Portfolio Analysis</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Icons.barChart className="h-5 w-5" />
            Technical Analysis
          </h3>
          <Progress value={analysis.technicalScore} className="mb-4" />
          <p className="text-sm text-gray-600 mb-2">Score: {analysis.technicalScore}/100</p>
        </Card>

        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Icons.layoutDashboard className="h-5 w-5" />
            Presentation Analysis
          </h3>
          <Progress value={analysis.presentationScore} className="mb-4" />
          <p className="text-sm text-gray-600 mb-2">Score: {analysis.presentationScore}/100</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Icons.trophy className="h-5 w-5 text-green-500" />
            Strengths
          </h3>
          <ul className="space-y-2">
            {analysis.strengths.map((strength: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Icons.check className="h-4 w-4 text-green-500 mt-0.5" />
                {strength}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Icons.alertTriangle className="h-5 w-5 text-yellow-500" />
            Areas for Improvement
          </h3>
          <ul className="space-y-2">
            {analysis.weaknesses.map((weakness: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Icons.alertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                {weakness}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
            <Icons.lightbulb className="h-5 w-5 text-blue-500" />
            Suggestions
          </h3>
          <ul className="space-y-2">
            {analysis.suggestions.map((suggestion: string, index: number) => (
              <li key={index} className="flex items-start gap-2 text-sm">
                <Icons.arrowRight className="h-4 w-4 text-blue-500 mt-0.5" />
                {suggestion}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Portfolio Details</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h4 className="font-medium mb-2">Technologies ({data.technologies.length})</h4>
            <div className="flex flex-wrap gap-2">
              {data.technologies.map((tech: string, index: number) => (
                <span key={index} className="px-2 py-1 bg-gray-100 rounded-md text-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Projects ({data.projects.length})</h4>
            <ul className="space-y-2">
              {data.projects.map((project: any, index: number) => (
                <li key={index} className="text-sm">
                  <a href={project.url} className="text-blue-500 hover:underline">
                    {project.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
