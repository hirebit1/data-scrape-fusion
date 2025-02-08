import { JSDOM } from 'jsdom';
import axios from 'axios';

interface PortfolioData {
  title: string;
  description: string;
  technologies: string[];
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    images?: string[];
    status?: string;
    duration?: string;
    teamSize?: string;
    role?: string;
  }>;
  skills: string[];
  experience?: Array<{
    company: string;
    role: string;
    duration: string;
    description: string;
    achievements?: string[];
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    duration: string;
    achievements?: string[];
  }>;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    social?: Record<string, string>;
  };
  metadata: {
    lastUpdated: string;
    pageLoadTime: number;
    wordCount: number;
    seoScore: number;
    hasResume?: boolean;
    hasBlog?: boolean;
  };
}

interface PortfolioAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  technicalScore: number;
  presentationScore: number;
  seoScore: number;
  contentScore: number;
  detailedAnalysis: {
    projectQuality: string;
    skillPresentation: string;
    professionalImage: string;
    technicalDepth: string;
  };
}

export const fetchPortfolioData = async (url: string): Promise<{ data: PortfolioData; analysis: PortfolioAnalysis }> => {
  try {
    console.log('Fetching portfolio data from:', url);
    
    // Try direct fetch first
    let html = '';
    try {
      const directResponse = await fetch(url);
      if (directResponse.ok) {
        html = await directResponse.text();
      }
    } catch {
      // If direct fetch fails, try using allorigins
      const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
      if (!response.ok) throw new Error('Failed to fetch portfolio');
      const data = await response.json();
      html = data.contents;
    }

    if (!html) throw new Error('Failed to get HTML content');

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('Full HTML document length:', html.length);
    console.log('Document title:', doc.title);

    const getContent = (selectors: string[], context: Document | Element = doc): string => {
      for (const selector of selectors) {
        try {
          const elements = context.querySelectorAll(selector);
          for (const element of elements) {
            const content = element?.textContent?.trim();
            if (content && content.length > 10) {
              console.log(`Found content using selector ${selector}:`, content.substring(0, 50) + '...');
              return content;
            }
          }
        } catch (error) {
          console.warn(`Selector ${selector} failed:`, error);
          continue;
        }
      }
      return '';
    };

    // Enhanced technology detection
    const getTechnologies = (): string[] => {
      const technologies = new Set<string>();
      
      // Common tech keywords to look for
      const techKeywords = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'React', 'Angular', 'Vue',
        'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'AWS', 'Docker', 'Git',
        'HTML5', 'CSS3', 'Sass', 'Tailwind', 'Bootstrap', 'jQuery', 'PHP',
        'Ruby', 'Go', 'Rust', 'C++', 'C#', '.NET', 'Django', 'Flask',
        'GraphQL', 'REST', 'Redux', 'Vuex', 'Next.js', 'Gatsby', 'Firebase',
        'Azure', 'GCP', 'Kubernetes', 'Jenkins', 'CI/CD', 'Webpack', 'Babel'
      ];

      // Search in common locations
      const searchLocations = [
        'p', 'li', 'div', 'span', 'section',
        '[class*="skill"]', '[class*="tech"]', '[class*="stack"]',
        '[class*="language"]', '[class*="framework"]', 'code'
      ];

      searchLocations.forEach(location => {
        const elements = doc.querySelectorAll(location);
        elements.forEach(element => {
          const text = element.textContent || '';
          techKeywords.forEach(tech => {
            if (text.includes(tech)) {
              console.log(`Found technology: ${tech}`);
              technologies.add(tech);
            }
          });
        });
      });

      // Look for script tags and their technologies
      const scripts = doc.querySelectorAll('script[src]');
      scripts.forEach(script => {
        const src = script.getAttribute('src') || '';
        if (src.includes('react')) technologies.add('React');
        if (src.includes('vue')) technologies.add('Vue.js');
        if (src.includes('angular')) technologies.add('Angular');
        // ... add more framework detection
      });

      return Array.from(technologies);
    };

    // Enhanced project detection
    const getProjects = (): any[] => {
      const projectIndicators = [
        'project', 'portfolio', 'work', 'case-study',
        'showcase', 'featured', 'application', 'app'
      ];
      
      const projects: any[] = [];
      const projectElements = new Set<Element>();

      // Find potential project sections
      projectIndicators.forEach(indicator => {
        doc.querySelectorAll(`[class*="${indicator}"], [id*="${indicator}"], section, article`).forEach(element => {
          const text = element.textContent?.toLowerCase() || '';
          if (projectIndicators.some(ind => text.includes(ind))) {
            projectElements.add(element);
          }
        });
      });

      projectElements.forEach(element => {
        const name = getContent(['h2', 'h3', 'h4', '.title', '[class*="title"]'], element);
        const description = getContent(['p', '.description', '[class*="description"]'], element);
        
        if (name || description) {
          console.log(`Found project: ${name}`);
          const project = {
            name: name || 'Untitled Project',
            description: description || '',
            technologies: Array.from(element.querySelectorAll('[class*="tech"], [class*="stack"], code'))
              .map(tech => tech.textContent?.trim())
              .filter(Boolean),
            url: Array.from(element.querySelectorAll('a'))
              .map(a => a.href)
              .find(href => href.includes('github.com') || href.includes('demo')),
          };
          projects.push(project);
        }
      });

      return projects;
    };

    const getEducation = (): Array<{
      institution: string;
      degree: string;
      duration: string;
      achievements?: string[];
    }> => {
      const educationSelectors = [
        '#education', '.education',
        'section[id*="education"]', 'div[id*="education"]',
        'section[class*="education"]', 'div[class*="education"]',
        'h2, h3, h4'
      ];

      const education: Array<{
        institution: string;
        degree: string;
        duration: string;
        achievements?: string[];
      }> = [];

      educationSelectors.forEach(selector => {
        const sections = doc.querySelectorAll(selector);
        sections.forEach(section => {
          const text = section.textContent?.toLowerCase() || '';
          if (text.includes('education') || text.includes('university') || text.includes('degree')) {
            const container = section.closest('section') || section.closest('div') || section;
            
            const institution = getContent([
              'h3', '.institution', '.university', '.school',
              'strong', '.name', '[class*="institution"]'
            ], container);

            const degree = getContent([
              '.degree', '.major', '.course',
              'p', '.description', '[class*="degree"]'
            ], container);

            const duration = getContent([
              '.duration', '.period', '.date',
              'time', '.year', '[class*="duration"]'
            ], container);

            if (institution || degree) {
              const achievements = Array.from(container.querySelectorAll('li, .achievement'))
                .map(li => li.textContent?.trim())
                .filter((a): a is string => !!a && a.length > 10);

              education.push({
                institution: institution || 'Unknown Institution',
                degree: degree || 'Unspecified Degree',
                duration: duration || '',
                achievements: achievements.length > 0 ? achievements : undefined
              });
            }
          }
        });
      });

      return education;
    };

    const getExperience = (doc: Document): Array<{
      company: string;
      role: string;
      duration: string;
      description: string;
      achievements?: string[];
    }> => {
      const experienceSelectors = [
        '[class*="experience"]', '#experience',
        '[class*="work"]', '.work-history',
        'section h2, section h3'
      ];

      const experience: Array<{
        company: string;
        role: string;
        duration: string;
        description: string;
        achievements?: string[];
      }> = [];

      experienceSelectors.forEach(selector => {
        const sections = doc.querySelectorAll(selector);
        sections.forEach(section => {
          const company = getContent([
            '.company', '.organization', '.employer',
            'h3', '.title', 'strong'
          ], section);

          const role = getContent([
            '.role', '.position', '.job-title',
            'h4', '.subtitle'
          ], section);

          const duration = getContent([
            '.duration', '.period', '.dates',
            'time', '.year'
          ], section);

          const description = getContent([
            '.description', '.summary', '.details',
            'p', '.content'
          ], section);

          if (company || role) {
            const achievements = Array.from(section.querySelectorAll('li, p'))
              .map(li => li.textContent?.trim())
              .filter((a): a is string => !!a);

            experience.push({
              company: company || 'Unknown Company',
              role: role || 'Unspecified Role',
              duration: duration || '',
              description: description || '',
              achievements: achievements.length > 0 ? achievements : undefined
            });
          }
        });
      });

      return experience;
    };

    const getSocialLinks = (): Record<string, string> => {
      const social: Record<string, string> = {};
      const socialPlatforms = [
        'github', 'linkedin', 'twitter', 'medium', 'dev.to',
        'stackoverflow', 'dribbble', 'behance', 'instagram',
        'youtube', 'facebook', 'gitlab', 'bitbucket'
      ];
      
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

    const calculateSEOScore = (doc: Document): number => {
      let score = 0;
      
      // Check title
      if (doc.title) score += 10;
      if (doc.title.length > 20 && doc.title.length < 60) score += 5;

      // Check meta description
      const metaDesc = doc.querySelector('meta[name="description"]');
      if (metaDesc) score += 10;
      if (metaDesc?.getAttribute('content')?.length || 0 > 120) score += 5;

      // Check headings hierarchy
      if (doc.querySelector('h1')) score += 10;
      if (doc.querySelectorAll('h2, h3').length > 0) score += 5;

      // Check images
      const images = doc.querySelectorAll('img');
      const imagesWithAlt = Array.from(images).filter(img => img.alt).length;
      if (imagesWithAlt === images.length && images.length > 0) score += 10;

      // Check links
      const links = doc.querySelectorAll('a');
      if (links.length > 0) score += 5;

      // Check content length
      const contentLength = doc.body.textContent?.length || 0;
      if (contentLength > 1000) score += 10;

      return Math.min(100, score);
    };

    const portfolioData: PortfolioData = {
      title: doc.title || getContent(['h1', '.title', '#title']),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                  getContent(['.about', '.bio', '.introduction', '#about']),
      technologies: getTechnologies(),
      projects: getProjects(),
      skills: Array.from(new Set([...getTechnologies()])),
      experience: getExperience(doc),
      education: getEducation(),
      contact: {
        email: (doc.querySelector('a[href^="mailto:"]') as HTMLAnchorElement)?.href?.replace('mailto:', '') || '',
        phone: getContent(['.phone', '.tel', '[class*="phone"]']),
        location: getContent(['.location', '.address', '[class*="location"]']),
        social: getSocialLinks(),
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        pageLoadTime: performance.now(),
        wordCount: doc.body.textContent?.split(/\s+/).length || 0,
        seoScore: calculateSEOScore(doc),
        hasResume: !!doc.querySelector('a[href*="resume"], a[href*="cv"]'),
        hasBlog: !!doc.querySelector('a[href*="blog"]'),
      },
    };

    console.log('Scraped Portfolio Data:', portfolioData);

    // Cache the data
    localStorage.setItem(`portfolio_${url}`, JSON.stringify(portfolioData));

    const analysis = analyzePortfolio(portfolioData);
    console.log('Portfolio Analysis:', analysis);
    localStorage.setItem(`portfolio_analysis_${url}`, JSON.stringify(analysis));

    return { data: portfolioData, analysis };
  } catch (error) {
    console.error('Portfolio scraping error:', error);
    throw new Error(`Failed to scrape portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

function analyzePortfolio(data: PortfolioData): PortfolioAnalysis {
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const suggestions: string[] = [];
  let technicalScore = 0;
  let presentationScore = 0;
  let seoScore = data.metadata.seoScore;
  let contentScore = 0;

  // Technical Stack Analysis
  if (data.technologies.length > 12) {
    strengths.push('Extensive and diverse technical skill set');
    technicalScore += 35;
  } else if (data.technologies.length > 8) {
    strengths.push('Strong technical skill variety');
    technicalScore += 25;
  } else if (data.technologies.length > 4) {
    strengths.push('Good foundation of technical skills');
    technicalScore += 15;
  } else {
    weaknesses.push('Limited technology stack presentation');
    suggestions.push('Expand your technology expertise showcase');
  }

  // Project Analysis
  if (data.projects.length >= 5) {
    strengths.push('Comprehensive project portfolio');
    technicalScore += 35;
  } else if (data.projects.length >= 3) {
    strengths.push('Good project showcase');
    technicalScore += 25;
  } else if (data.projects.length > 0) {
    weaknesses.push('Limited project showcase');
    suggestions.push('Add more detailed project examples');
    technicalScore += 15;
  } else {
    weaknesses.push('No projects showcased');
    suggestions.push('Add project examples to demonstrate your capabilities');
  }

  // Buzzword Analysis
  const buzzwords = ['passionate', 'ninja', 'guru', 'rockstar', 'expert', 'specialist'];
  const description = data.description?.toLowerCase() || '';
  const buzzwordCount = buzzwords.filter(word => description.includes(word)).length;
  
  if (buzzwordCount > 3) {
    weaknesses.push('Overuse of industry buzzwords');
    suggestions.push('Replace generic terms with specific achievements and skills');
    presentationScore -= 15;
  }

  // Content Quality Analysis
  if (data.description && data.description.length > 300) {
    strengths.push('Detailed professional profile');
    contentScore += 30;
  } else if (data.description && data.description.length > 150) {
    strengths.push('Clear professional description');
    contentScore += 20;
  } else {
    weaknesses.push('Brief or missing professional description');
    suggestions.push('Expand your professional summary with specific achievements');
  }

  // Professional Experience Analysis
  if (data.experience && data.experience.length > 2) {
    strengths.push('Rich professional experience well documented');
    contentScore += 25;
  } else if (data.experience && data.experience.length > 0) {
    contentScore += 15;
  } else {
    suggestions.push('Add more detailed professional experience');
  }

  // Project Details Quality
  const detailedProjects = data.projects.filter(p => 
    p.description.length > 100 && 
    p.technologies.length > 2 &&
    (p.images?.length || 0) > 0
  );

  if (detailedProjects.length === data.projects.length && data.projects.length > 0) {
    strengths.push('Highly detailed project documentation');
    presentationScore += 30;
  } else if (data.projects.length > 0) {
    weaknesses.push('Inconsistent project documentation');
    suggestions.push('Enhance project descriptions with technical details and visuals');
  }

  // Portfolio Uniqueness
  if (data.projects.every(p => p.description.length > 200)) {
    strengths.push('Unique and detailed project presentations');
  } else {
    weaknesses.push('Generic project descriptions');
    suggestions.push('Make project descriptions more specific and unique');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Portfolio under development'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Initial analysis pending'],
    suggestions: suggestions.length > 0 ? suggestions : ['Start by adding basic portfolio information'],
    technicalScore: Math.min(100, technicalScore),
    presentationScore: Math.min(100, presentationScore),
    seoScore: Math.min(100, seoScore),
    contentScore: Math.min(100, contentScore),
    detailedAnalysis: {
      projectQuality: getQualityLevel(technicalScore),
      skillPresentation: getQualityLevel(presentationScore),
      professionalImage: getQualityLevel(contentScore),
      technicalDepth: getQualityLevel(Math.floor((technicalScore + contentScore) / 2))
    }
  };
}

function getQualityLevel(score: number): string {
  if (score >= 90) return 'Exceptional';
  if (score >= 80) return 'Excellent';
  if (score >= 70) return 'Very Good';
  if (score >= 60) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Improvement';
}
