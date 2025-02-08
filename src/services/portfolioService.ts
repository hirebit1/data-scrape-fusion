
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
    console.log('Fetching portfolio data from:', url);
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('Parsed HTML document:', doc.documentElement.outerHTML.substring(0, 200) + '...');

    // Enhanced selectors for better data extraction
    const getContent = (selectors: string[]): string => {
      for (const selector of selectors) {
        const elements = doc.querySelectorAll(selector);
        for (const element of elements) {
          const content = element?.textContent?.trim();
          if (content && content.length > 10) return content; // Only return meaningful content
        }
      }
      return '';
    };

    const getTechnologies = (): string[] => {
      const techSelectors = [
        '.technology', '.tech-stack', '.skills', '.languages',
        '[data-tech]', '[class*="technology"]', '[class*="skill"]',
        '.stack', '.tool', '.framework', 
        // Additional selectors
        'code', '.code', '.programming-language',
        '[class*="tech"]', '[class*="lang"]', '[class*="tool"]',
        'li[class*="skill"]', 'span[class*="tech"]'
      ];
      
      const technologies = new Set<string>();
      techSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => {
          const tech = el.textContent?.trim();
          if (tech && tech.length > 1) technologies.add(tech);
        });
      });

      // If no technologies found, try to extract from text content
      if (technologies.size === 0) {
        const commonTechs = ['JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue', 'Node.js', 'TypeScript', 'HTML', 'CSS'];
        const bodyText = doc.body.textContent || '';
        commonTechs.forEach(tech => {
          if (bodyText.includes(tech)) technologies.add(tech);
        });
      }
      
      return Array.from(technologies);
    };

    const getProjects = (): Array<{ name: string; description: string; technologies: string[]; url?: string }> => {
      const projectSelectors = [
        '.project', 'article', '.work', '.portfolio-item',
        '[class*="project"]', '[class*="work"]', '.card',
        // Additional selectors
        '.portfolio-piece', '.showcase-item', '.work-item',
        'section[id*="project"]', 'div[id*="work"]',
        '.case-study', '.portfolio-entry'
      ];
      
      const projects: Array<{ name: string; description: string; technologies: string[]; url?: string }> = [];
      
      projectSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(project => {
          const titleSelectors = [
            'h2', 'h3', '.title', '[class*="title"]',
            'h4', '.name', '[class*="name"]',
            'strong', '.heading', '[class*="heading"]'
          ];

          const descriptionSelectors = [
            'p', '.description', '[class*="description"]',
            '.summary', '[class*="summary"]', '.content',
            '.details', '[class*="details"]', '.text'
          ];

          const name = getContent(titleSelectors.map(s => `${selector} ${s}`));
          const description = getContent(descriptionSelectors.map(s => `${selector} ${s}`));

          if (name || description) {
            const projectTechs = Array.from(project.querySelectorAll('.tech, .stack, [class*="technology"], [class*="skill"], code'))
              .map(tech => tech.textContent?.trim())
              .filter((t): t is string => !!t && t.length > 1);

            const links = Array.from(project.querySelectorAll('a'));
            const projectUrl = links.find(link => {
              const href = (link as HTMLAnchorElement).href;
              return href && (href.includes('github.com') || href.includes('demo') || href.includes('live'));
            });
            
            projects.push({
              name: name || 'Untitled Project',
              description: description || '',
              technologies: projectTechs,
              url: projectUrl ? (projectUrl as HTMLAnchorElement).href : undefined
            });
          }
        });
      });

      // If no projects found, try to find sections that might contain project information
      if (projects.length === 0) {
        const sections = doc.querySelectorAll('section, div');
        sections.forEach(section => {
          const heading = section.querySelector('h2, h3, h4');
          const text = section.textContent?.trim() || '';
          if (heading && text.length > 100) {
            projects.push({
              name: heading.textContent?.trim() || 'Untitled Project',
              description: text,
              technologies: [],
              url: undefined
            });
          }
        });
      }
      
      return projects;
    };

    const getSkills = (): string[] => {
      const skillSelectors = [
        '.skill', '[class*="skill"]', '[data-skill]',
        '.expertise', '[class*="expertise"]',
        '.competency', '[class*="competency"]',
        'li[class*="skill"]', 'span[class*="skill"]'
      ];

      const skills = new Set<string>();
      skillSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => {
          const skill = el.textContent?.trim();
          if (skill && skill.length > 1) skills.add(skill);
        });
      });

      return Array.from(skills);
    };

    const getSocialLinks = (): Record<string, string> => {
      const social: Record<string, string> = {};
      const socialPlatforms = ['github', 'linkedin', 'twitter', 'medium', 'dev.to', 'stackoverflow'];
      
      socialPlatforms.forEach(platform => {
        const links = Array.from(doc.querySelectorAll('a')).filter(link => {
          const href = (link as HTMLAnchorElement).href;
          return href && href.toLowerCase().includes(platform);
        });
        
        if (links[0]) {
          social[platform] = (links[0] as HTMLAnchorElement).href;
        }
      });

      return social;
    };

    const portfolioData: PortfolioData = {
      title: doc.title || getContent(['h1', '.title', '#title', '.name', '.profile-name']),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                  getContent([
                    '.about', '.bio', '.introduction', '#about', '[class*="about"]',
                    '.summary', '.profile-summary', '.description',
                    'section p', '.content p'
                  ]),
      technologies: getTechnologies(),
      projects: getProjects(),
      skills: getSkills(),
      contact: {
        email: (doc.querySelector('a[href^="mailto:"]') as HTMLAnchorElement)?.href?.replace('mailto:', '') || '',
        social: getSocialLinks(),
      },
      metadata: {
        lastUpdated: doc.querySelector('time, .last-updated')?.getAttribute('datetime') || new Date().toISOString(),
        pageLoadTime: performance.now(),
        wordCount: doc.body.textContent?.split(/\s+/).length || 0,
      },
    };

    console.log('Scraped Portfolio Data:', portfolioData);

    // Cache the data
    localStorage.setItem(`portfolio_${url}`, JSON.stringify(portfolioData));

    // Enhanced analysis with more detailed scoring
    const analysis = analyzePortfolio(portfolioData);
    localStorage.setItem(`portfolio_analysis_${url}`, JSON.stringify(analysis));

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
  if (data.technologies.length > 8) {
    strengths.push('Extensive technical skill set');
    technicalScore += 35;
  } else if (data.technologies.length > 4) {
    strengths.push('Good variety of technical skills');
    technicalScore += 25;
  } else if (data.technologies.length > 0) {
    weaknesses.push('Limited technology stack');
    suggestions.push('Consider expanding your technology expertise');
    technicalScore += 15;
  } else {
    weaknesses.push('No technologies listed');
    suggestions.push('Add your technical skills and technologies you work with');
  }

  // Project Analysis
  if (data.projects.length >= 4) {
    strengths.push('Strong portfolio of projects');
    technicalScore += 35;
  } else if (data.projects.length >= 2) {
    strengths.push('Good portfolio of projects');
    technicalScore += 25;
  } else if (data.projects.length > 0) {
    weaknesses.push('Limited project showcase');
    suggestions.push('Add more project examples to demonstrate your capabilities');
    technicalScore += 15;
  } else {
    weaknesses.push('No projects found');
    suggestions.push('Add some projects to showcase your work');
  }

  // Content Quality Analysis
  if (data.description && data.description.length > 200) {
    strengths.push('Comprehensive professional profile');
    presentationScore += 30;
  } else if (data.description && data.description.length > 100) {
    strengths.push('Well-described professional profile');
    presentationScore += 20;
  } else if (data.description) {
    weaknesses.push('Brief professional description');
    suggestions.push('Expand your professional summary to better highlight your expertise');
    presentationScore += 10;
  } else {
    weaknesses.push('Missing professional description');
    suggestions.push('Add a detailed description about yourself and your work');
  }

  // Contact Information Analysis
  const socialLinksCount = Object.keys(data.contact?.social || {}).length;
  if (data.contact?.email && socialLinksCount >= 2) {
    strengths.push('Strong professional networking presence');
    presentationScore += 30;
  } else if (data.contact?.email || socialLinksCount > 0) {
    weaknesses.push('Limited contact information');
    suggestions.push('Add more professional networking links and contact methods');
    presentationScore += 15;
  } else {
    weaknesses.push('Missing contact information');
    suggestions.push('Add your contact information and professional social media links');
  }

  // Skills Analysis
  if (data.skills.length > 10) {
    strengths.push('Comprehensive skill set');
    technicalScore += 15;
  } else if (data.skills.length > 5) {
    strengths.push('Good range of skills');
    technicalScore += 10;
  }

  // Project Details Analysis
  const projectsWithTech = data.projects.filter(p => p.technologies.length > 0);
  if (projectsWithTech.length === data.projects.length && data.projects.length > 0) {
    strengths.push('Well-documented projects with technology details');
    technicalScore += 15;
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
