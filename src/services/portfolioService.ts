
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
    // Fetch the HTML content using a CORS proxy
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    const data = await response.json();
    const html = data.contents;

    // Parse the HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Extract portfolio data
    const portfolioData: PortfolioData = {
      title: doc.title || '',
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      technologies: Array.from(doc.querySelectorAll('.technology, .tech-stack, .skills'))
        .map(el => el.textContent?.trim() || '')
        .filter(Boolean),
      projects: Array.from(doc.querySelectorAll('.project, article, .work'))
        .map(project => ({
          name: project.querySelector('h2, h3, .title')?.textContent?.trim() || '',
          description: project.querySelector('p, .description')?.textContent?.trim() || '',
          technologies: Array.from(project.querySelectorAll('.tech, .stack'))
            .map(tech => tech.textContent?.trim() || '')
            .filter(Boolean),
          url: project.querySelector('a')?.href,
        })),
      skills: Array.from(doc.querySelectorAll('.skill, .technology'))
        .map(skill => skill.textContent?.trim() || '')
        .filter(Boolean),
      contact: {
        email: doc.querySelector('a[href^="mailto:"]')?.getAttribute('href')?.replace('mailto:', '') || '',
        social: {
          github: doc.querySelector('a[href*="github.com"]')?.href || '',
          linkedin: doc.querySelector('a[href*="linkedin.com"]')?.href || '',
          twitter: doc.querySelector('a[href*="twitter.com"]')?.href || '',
        },
      },
      metadata: {
        lastUpdated: doc.querySelector('time, .last-updated')?.getAttribute('datetime') || new Date().toISOString(),
        pageLoadTime: performance.now(),
        wordCount: doc.body.textContent?.split(/\s+/).length || 0,
      },
    };

    // Store in localStorage for faster access
    localStorage.setItem(`portfolio_${url}`, JSON.stringify(portfolioData));

    // Analyze the portfolio data
    const analysis = analyzePortfolio(portfolioData);
    localStorage.setItem(`portfolio_analysis_${url}`, JSON.stringify(analysis));

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

  // Technical Analysis
  if (data.technologies.length > 5) {
    strengths.push('Diverse technical skill set');
    technicalScore += 30;
  } else {
    weaknesses.push('Limited technology stack');
    suggestions.push('Consider expanding your technology expertise');
  }

  // Project Analysis
  if (data.projects.length >= 3) {
    strengths.push('Good portfolio of projects');
    technicalScore += 30;
  } else {
    weaknesses.push('Limited project showcase');
    suggestions.push('Add more project examples to demonstrate your capabilities');
  }

  // Content Analysis
  if (data.description && data.description.length > 100) {
    strengths.push('Well-described professional profile');
    presentationScore += 20;
  } else {
    weaknesses.push('Brief or missing professional description');
    suggestions.push('Expand your professional summary to better highlight your expertise');
  }

  // Contact Information
  if (data.contact?.email && Object.values(data.contact.social || {}).some(Boolean)) {
    strengths.push('Good professional networking presence');
    presentationScore += 20;
  } else {
    weaknesses.push('Limited contact information');
    suggestions.push('Add more professional networking links and contact methods');
  }

  return {
    strengths,
    weaknesses,
    suggestions,
    technicalScore: Math.min(100, technicalScore),
    presentationScore: Math.min(100, presentationScore),
  };
}
