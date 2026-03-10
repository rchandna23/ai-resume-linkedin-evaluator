export interface Experience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  descriptionBullets: string[];
  technologies?: string[];
  achievements?: string[];
}

export interface Education {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
}

export interface Resume {
  fullName?: string;
  contactEmail?: string;
  location?: string;
  summary?: string;
  experiences: Experience[];
  educations: Education[];
  skills: string[];
  certifications: string[];
  projects: string[];
  rawText: string;
}

