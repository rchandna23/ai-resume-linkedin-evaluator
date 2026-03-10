"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLinkedInHtml = parseLinkedInHtml;
const cheerio = __importStar(require("cheerio"));
function parseLinkedInHtml(html) {
    const $ = cheerio.load(html);
    const fullName = $("h1").first().text().trim() || undefined;
    const headline = $('[class*="top-card-layout__headline"]').first().text().trim() ||
        $('[class*="pv-top-card-section__headline"]').first().text().trim() ||
        undefined;
    const about = $('[class*="about__summary"]').text().trim() ||
        $('[class*="summary"]').text().trim() ||
        undefined;
    const experiences = [];
    $('[class*="experience__list"] li,[data-section="experience"] li').each((_i, el) => {
        const container = $(el);
        const title = container.find("h3").first().text().trim() ||
            container.find('[class*="experience-item__title"]').text().trim();
        const company = container.find("p").first().text().trim() ||
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
    });
    const skills = [];
    $('[class*="pv-skill-category-entity__name-text"]').each((_i, el) => {
        const text = $(el).text().trim();
        if (text)
            skills.push(text);
    });
    $('[data-endpoint*="skills"],[class*="skill-pill"]').each((_i, el) => {
        const text = $(el).text().trim();
        if (text && !skills.includes(text))
            skills.push(text);
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
