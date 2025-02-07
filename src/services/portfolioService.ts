
interface PortfolioData {
  title: string;
  description: string;
  technologies: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
  }>;
  skills: string[];
  contact?: {
    email?: string;
    social?: Record<string, string>;
  };
  metadata: {
    lastUpdated: string;
    pageLoadTime: number;
    wordCount: number;
  };
}

interface PortfolioAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  technicalScore: number;
  presentationScore: number;
}

export const fetchPortfolioData = async (url: string): Promise<{ data: PortfolioData; analysis: PortfolioAnalysis }> => {
  try {
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Enhanced selectors for better data extraction
    const getContent = (selectors: string[]): string => {
      for (const selector of selectors) {
        const element = doc.querySelector(selector);
        const content = element?.textContent?.trim();
        if (content) return content;
      }
      return '';
    };

    const getTechnologies = (): string[] => {
      const techSelectors = [
        '.technology', '.tech-stack', '.skills', '.languages',
        '[data-tech]', '[class*="technology"]', '[class*="skill"]',
        '.stack', '.tool', '.framework'
      ];
      
      const technologies = new Set<string>();
      techSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => {
          const tech = el.textContent?.trim();
          if (tech) technologies.add(tech);
        });
      });
      
      return Array.from(technologies);
    };

    const getProjects = (): Array<{ name: string; description: string; technologies: string[]; url?: string }> => {
      const projectSelectors = [
        '.project', 'article', '.work', '.portfolio-item',
        '[class*="project"]', '[class*="work"]', '.card'
      ];
      
      const projects: Array<{ name: string; description: string; technologies: string[]; url?: string }> = [];
      
      projectSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(project => {
          const name = getContent([
            'h2', 'h3', '.title', '[class*="title"]',
            'h4', '.name', '[class*="name"]'
          ].map(s => `${selector} ${s}`));

          const description = getContent([
            'p', '.description', '[class*="description"]',
            '.summary', '[class*="summary"]', '.content'
          ].map(s => `${selector} ${s}`));

          if (name || description) {
            const projectTechs = Array.from(project.querySelectorAll('.tech, .stack, [class*="technology"]'))
              .map(tech => tech.textContent?.trim())
              .filter((t): t is string => !!t);

            const anchor = project.querySelector('a') as HTMLAnchorElement;
            
            projects.push({
              name: name || 'Untitled Project',
              description: description || '',
              technologies: projectTechs,
              url: anchor?.href || undefined
            });
          }
        });
      });
      
      return projects;
    };

    const portfolioData: PortfolioData = {
      title: doc.title || getContent(['h1', '.title', '#title']),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                  getContent(['.about', '.bio', '.introduction', '#about', '[class*="about"]']),
      technologies: getTechnologies(),
      projects: getProjects(),
      skills: Array.from(new Set([
        ...Array.from(doc.querySelectorAll('.skill, .technology, [class*="skill"], [data-skill]'))
          .map(skill => skill.textContent?.trim())
          .filter((s): s is string => !!s)
      ])),
      contact: {
        email: (doc.querySelector('a[href^="mailto:"]') as HTMLAnchorElement)?.href?.replace('mailto:', '') || '',
        social: {
          github: (doc.querySelector('a[href*="github.com"]') as HTMLAnchorElement)?.href || '',
          linkedin: (doc.querySelector('a[href*="linkedin.com"]') as HTMLAnchorElement)?.href || '',
          twitter: (doc.querySelector('a[href*="twitter.com"]') as HTMLAnchorElement)?.href || '',
        },
      },
      metadata: {
        lastUpdated: doc.querySelector('time, .last-updated')?.getAttribute('datetime') || new Date().toISOString(),
        pageLoadTime: performance.now(),
        wordCount: doc.body.textContent?.split(/\s+/).length || 0,
      },
    };

    // Cache the data
    localStorage.setItem(`portfolio_${url}`, JSON.stringify(portfolioData));

    // Enhanced analysis with more detailed scoring
    const analysis = analyzePortfolio(portfolioData);
    localStorage.setItem(`portfolio_analysis_${url}`, JSON.stringify(analysis));

    console.log('Scraped Portfolio Data:', portfolioData);
    console.log('Portfolio Analysis:', analysis);

    return { data: portfolioData, analysis };
  } catch (error) {
    console.error('Portfolio scraping error:', error);
    throw error;
  }
};

function analyzePortfolio(data: PortfolioData): PortfolioAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  let technicalScore = 0;
  let presentationScore = 0;

  // Technical Stack Analysis
  if (data.technologies.length > 5) {
    strengths.push('Diverse technical skill set');
    technicalScore += 30;
  } else if (data.technologies.length > 0) {
    weaknesses.push('Limited technology stack');
    suggestions.push('Consider expanding your technology expertise');
  } else {
    weaknesses.push('No technologies listed');
    suggestions.push('Add your technical skills and technologies you work with');
  }

  // Project Analysis
  if (data.projects.length >= 3) {
    strengths.push('Good portfolio of projects');
    technicalScore += 30;
  } else if (data.projects.length > 0) {
    weaknesses.push('Limited project showcase');
    suggestions.push('Add more project examples to demonstrate your capabilities');
  } else {
    weaknesses.push('No projects found');
    suggestions.push('Add some projects to showcase your work');
  }

  // Content Quality Analysis
  if (data.description && data.description.length > 100) {
    strengths.push('Well-described professional profile');
    presentationScore += 20;
  } else if (data.description) {
    weaknesses.push('Brief professional description');
    suggestions.push('Expand your professional summary to better highlight your expertise');
  } else {
    weaknesses.push('Missing professional description');
    suggestions.push('Add a detailed description about yourself and your work');
  }

  // Contact Information Analysis
  if (data.contact?.email && Object.values(data.contact.social || {}).some(Boolean)) {
    strengths.push('Good professional networking presence');
    presentationScore += 20;
  } else if (data.contact?.email || Object.values(data.contact.social || {}).some(Boolean)) {
    weaknesses.push('Limited contact information');
    suggestions.push('Add more professional networking links and contact methods');
  } else {
    weaknesses.push('Missing contact information');
    suggestions.push('Add your contact information and professional social media links');
  }

  // Project Details Analysis
  const projectsWithTech = data.projects.filter(p => p.technologies.length > 0);
  if (projectsWithTech.length === data.projects.length && data.projects.length > 0) {
    strengths.push('Well-documented projects with technology details');
    technicalScore += 20;
  } else if (data.projects.length > 0) {
    suggestions.push('Add technology details to your projects');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Portfolio under development'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Initial analysis pending'],
    suggestions: suggestions.length > 0 ? suggestions : ['Start by adding basic portfolio information'],
    technicalScore: Math.min(100, technicalScore),
    presentationScore: Math.min(100, presentationScore),
  };
}
