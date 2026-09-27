import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';

const work = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/work' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a clean kebab-case slug.'),
    type: z.string().default('Practical project'),
    summary: z.string(),
    problem: z.string(),
    constraints: z.string(),
    approach: z.string(),
    outcome: z.string(),
    resumeSummary: z.string(),
    tools: z.array(z.string()).optional(),
    cover: z.string().optional(),
    externalLink: z.url().optional(),
    repoLink: z.url().optional(),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    client: z.string().optional(),
    date: z.coerce.date(),
  }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a clean kebab-case slug.'),
    summary: z.string(),
    resumeSummary: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    cover: z.string().optional(),
    featured: z.boolean().default(false),
    published: z.boolean().default(false),
    resume: z.boolean().default(false),
    client: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
  }),
});

const principles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/principles' }),
  schema: z.object({
    statement: z.string(),
    order: z.number().default(0),
    published: z.boolean().default(true),
  }),
});

const settings = defineCollection({
  loader: file('./src/content/settings/site.yaml'),
  schema: z.object({
    name: z.string(),
    shortName: z.string(),
    title: z.string(),
    heroLead: z.string(),
    heroSentences: z.array(z.string()).min(1),
    heroDocument: z.string(),
    heroSubtitleLines: z.array(z.string()).min(1),
    description: z.string(),
    introCommand: z.string(),
    capabilities: z.array(z.string()),
    contact: z.object({
      email: z.email(),
      discord: z.string().optional(),
      discordUrl: z.url().optional(),
      telegram: z.string().optional(),
      availability: z.string(),
      github: z.url().optional(),
      linkedin: z.url().optional(),
      location: z.string().optional(),
    }),
  }),
});

const resume = defineCollection({
  loader: file('./src/content/settings/resume.yaml'),
  schema: z.object({ brand: z.string(), name: z.string().optional(), headline: z.string(), summary: z.string(), portfolioUrl: z.url(), linkedinUrl: z.url(), githubUrl: z.url(), capabilities: z.array(z.string()).min(1), education: z.array(z.object({ institution: z.string(), program: z.string(), dates: z.string(), detail: z.string().optional() })).min(1) }),
});

export const collections = { work, notes, principles, settings, resume };
