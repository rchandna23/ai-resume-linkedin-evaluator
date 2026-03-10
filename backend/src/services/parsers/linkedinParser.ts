import * as cheerio from "cheerio";
import type { LinkedInProfile } from "../../models/LinkedInProfile";

export function parseLinkedInHtml(html: string): LinkedInProfile {
  const $ = cheerio.load(html);

  const fullName = $("h1").first().text().trim() || undefined;
  const headline =
    $('[class*="top-card-layout__headline"]').first().text().trim() ||
    $('[class*="pv-top-card-section__headline"]').first().text().trim() ||
    undefined;
  const about =
    $('[class*="about__summary"]').text().trim() ||
    $('[class*="summary"]').text().trim() ||
    undefined;

  const experiences: LinkedInProfile["experiences"] = [];
  $('[class*="experience__list"] li,[data-section="experience"] li').each(
    (_i, el) => {
      const container = $(el);
      const title =
        container.find("h3").first().text().trim() ||
        container.find('[class*="experience-item__title"]').text().trim();
      const company =
        container.find("p").first().text().trim() ||
        container.find('[class*="experience-item__subtitle"]').text().trim();
      const description = container
        .find("p")
        .slice(1)
        .text()
        .trim();

      if (title || company || description) {
        experiences.push({
          title,
          company,
          description,
        });
      }
    }
  );

  const skills: string[] = [];
  $('[class*="pv-skill-category-entity__name-text"]').each((_i, el) => {
    const text = $(el).text().trim();
    if (text) skills.push(text);
  });
  $('[data-endpoint*="skills"],[class*="skill-pill"]').each((_i, el) => {
    const text = $(el).text().trim();
    if (text && !skills.includes(text)) skills.push(text);
  });

  return {
    fullName,
    headline,
    about,
    experiences,
    skills,
    rawHtml: html,
  };
}

