export interface LinkedInExperience {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  description?: string;
}

export interface LinkedInProfile {
  fullName?: string;
  headline?: string;
  about?: string;
  location?: string;
  industry?: string;
  openToWork?: boolean;
  experiences: LinkedInExperience[];
  skills: string[];
  rawHtml?: string;
}

