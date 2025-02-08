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
    const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    if (!response.ok) throw new Error('Failed to fetch portfolio');
    const data = await response.json();
    const html = data.contents;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    console.log('Parsed HTML document:', doc.documentElement.outerHTML.substring(0, 200) + '...');

    const getContent = (selectors: string[], context: Document | Element = doc): string => {
      for (const selector of selectors) {
        const elements = context.querySelectorAll(selector);
        for (const element of elements) {
          const content = element?.textContent?.trim();
          if (content && content.length > 10) return content;
        }
      }
      return '';
    };

    const getTechnologies = (): string[] => {
      const techSelectors = [
        '.technology', '.tech-stack', '.skills', '.languages',
        '[data-tech]', '[class*="technology"]', '[class*="skill"]',
        '.stack', '.tool', '.framework', 
        'code', '.code', '.programming-language',
        '[class*="tech"]', '[class*="lang"]', '[class*="tool"]',
        'li[class*="skill"]', 'span[class*="tech"]',
        // Additional selectors for frameworks and tools
        '.framework', '.library', '.platform', '.database',
        '[class*="framework"]', '[class*="library"]', '[class*="platform"]',
        // Look for specific tech mentions
        '[class*="react"]', '[class*="vue"]', '[class*="angular"]',
        '[class*="node"]', '[class*="python"]', '[class*="java"]'
      ];
      
      const technologies = new Set<string>();
      
      // First pass: direct selectors
      techSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => {
          const tech = el.textContent?.trim();
          if (tech && tech.length > 1) technologies.add(tech);
        });
      });

      // Second pass: look for technology keywords in text content
      const commonTechs = [
        'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'PHP', 'Ruby',
        'React', 'Vue', 'Angular', 'Node.js', 'Express', 'Django', 'Flask',
        'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes',
        'AWS', 'Azure', 'GCP', 'Firebase', 'Netlify', 'Vercel',
        'Git', 'GitHub', 'GitLab', 'Bitbucket',
        'HTML5', 'CSS3', 'SASS', 'LESS', 'Tailwind', 'Bootstrap'
      ];

      // Look for tech mentions in paragraphs and list items
      const textNodes = doc.querySelectorAll('p, li, div, span');
      textNodes.forEach(node => {
        const text = node.textContent || '';
        commonTechs.forEach(tech => {
          if (text.includes(tech)) technologies.add(tech);
        });
      });

      return Array.from(technologies);
    };

    const getProjects = (): Array<{
      name: string;
      description: string;
      technologies: string[];
      url?: string;
      images?: string[];
      status?: string;
      duration?: string;
      teamSize?: string;
      role?: string;
    }> => {
      const projectSelectors = [
        '.project', 'article', '.work', '.portfolio-item',
        '[class*="project"]', '[class*="work"]', '.card',
        '.portfolio-piece', '.showcase-item', '.work-item',
        'section[id*="project"]', 'div[id*="work"]',
        '.case-study', '.portfolio-entry'
      ];
      
      const projects: Array<{
        name: string;
        description: string;
        technologies: string[];
        url?: string;
        images?: string[];
        status?: string;
        duration?: string;
        teamSize?: string;
        role?: string;
      }> = [];
      
      projectSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(project => {
          const name = getContent([
            'h2', 'h3', '.title', '[class*="title"]',
            'h4', '.name', '[class*="name"]',
            'strong', '.heading', '[class*="heading"]'
          ], project);

          const description = getContent([
            'p', '.description', '[class*="description"]',
            '.summary', '[class*="summary"]', '.content',
            '.details', '[class*="details"]', '.text'
          ], project);

          if (name || description) {
            // Get project technologies
            const projectTechs = Array.from(project.querySelectorAll('.tech, .stack, [class*="technology"], [class*="skill"], code'))
              .map(tech => tech.textContent?.trim())
              .filter((t): t is string => !!t && t.length > 1);

            // Get project images
            const images = Array.from(project.querySelectorAll('img'))
              .map(img => img.src)
              .filter(src => src && !src.includes('placeholder'));

            // Get project status
            const status = getContent([
              '.status', '[class*="status"]',
              '.phase', '[class*="phase"]'
            ], project);

            // Get project duration
            const duration = getContent([
              '.duration', '[class*="duration"]',
              '.timeline', '[class*="timeline"]',
              '.period', '[class*="period"]'
            ], project);

            // Get team size
            const teamSize = getContent([
              '.team-size', '[class*="team"]',
              '.collaborators', '[class*="collaborators"]'
            ], project);

            // Get role in project
            const role = getContent([
              '.role', '[class*="role"]',
              '.position', '[class*="position"]'
            ], project);

            // Get project URL
            const links = Array.from(project.querySelectorAll('a')).filter(link => {
              const href = (link as HTMLAnchorElement).href;
              return href && (
                href.includes('github.com') ||
                href.includes('demo') ||
                href.includes('live') ||
                /\.(com|org|net|io)/.test(href)
              );
            });
            
            projects.push({
              name: name || 'Untitled Project',
              description: description || '',
              technologies: projectTechs,
              url: links[0] ? (links[0] as HTMLAnchorElement).href : undefined,
              images: images.length > 0 ? images : undefined,
              status: status || undefined,
              duration: duration || undefined,
              teamSize: teamSize || undefined,
              role: role || undefined
            });
          }
        });
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
        '.education', '#education',
        '[class*="education"]', 'section:has(h2:contains("Education"))'
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
          const institution = getContent([
            '.institution', '.school', '.university',
            'h3', '.title', 'strong'
          ], section);

          const degree = getContent([
            '.degree', '.major', '.qualification',
            'p', '.description'
          ], section);

          const duration = getContent([
            '.duration', '.period', '.dates',
            'time', '.year'
          ], section);

          if (institution || degree) {
            const achievements = Array.from(section.querySelectorAll('li'))
              .map(li => li.textContent?.trim())
              .filter((a): a is string => !!a);

            education.push({
              institution: institution || 'Unknown Institution',
              degree: degree || 'Unspecified Degree',
              duration: duration || '',
              achievements: achievements.length > 0 ? achievements : undefined
            });
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
      title: doc.title || getContent(['h1', '.title', '#title', '.name', '.profile-name']),
      description: doc.querySelector('meta[name="description"]')?.getAttribute('content') || 
                  getContent([
                    '.about', '.bio', '.introduction', '#about', '[class*="about"]',
                    '.summary', '.profile-summary', '.description',
                    'section p', '.content p'
                  ]),
      technologies: getTechnologies(),
      projects: getProjects(),
      skills: Array.from(new Set([...getTechnologies()])),
      experience: getExperience(doc),
      education: getEducation(),
      contact: {
        email: (doc.querySelector('a[href^="mailto:"]') as HTMLAnchorElement)?.href?.replace('mailto:', '') || '',
        phone: getContent(['.phone', '.tel', '[class*="phone"]', '[class*="tel"]']),
        location: getContent(['.location', '.address', '[class*="location"]', '[class*="address"]']),
        social: getSocialLinks(),
      },
      metadata: {
        lastUpdated: doc.querySelector('time, .last-updated')?.getAttribute('datetime') || new Date().toISOString(),
        pageLoadTime: performance.now(),
        wordCount: doc.body.textContent?.split(/\s+/).length || 0,
        seoScore: calculateSEOScore(doc),
        hasResume: !!doc.querySelector('a[href*="resume"], a[href*="cv"]'),
        hasBlog: !!doc.querySelector('a[href*="blog"], [class*="blog"]'),
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
