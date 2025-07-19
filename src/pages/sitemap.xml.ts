import type { APIRoute } from 'astro';
import { getExamData, type ExamData } from '../data/exam-data';

// Helper to escape XML special characters
const escapeXML = (str: string | undefined) => {
  if (typeof str !== 'string') return '';
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
};

export const GET: APIRoute = async () => {
  const exams = getExamData();
  const baseUrl = 'https://timekeeper.edbn.me';

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily', lastmod: new Date().toISOString().split('T')[0] },
    { url: 'about', priority: '0.7', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    { url: 'contact', priority: '0.6', changefreq: 'monthly', lastmod: new Date().toISOString().split('T')[0] },
    { url: 'privacy', priority: '0.5', changefreq: 'yearly', lastmod: new Date().toISOString().split('T')[0] },
    { url: 'terms', priority: '0.5', changefreq: 'yearly', lastmod: new Date().toISOString().split('T')[0] }
  ];

  const examPages = exams.map((exam: ExamData) => ({
    url: `exams/${exam.slug}`,
    priority: '0.9',
    changefreq: 'daily',
    lastmod: new Date().toISOString().split('T')[0]
  }));

  const categories = [...new Set(exams.map((exam: ExamData) => exam.category))];
  const categoryPages = categories.map(category => ({
    url: `category/${category.toLowerCase().replace(/\s+/g, '-')}`,
    priority: '0.8',
    changefreq: 'weekly',
    lastmod: new Date().toISOString().split('T')[0]
  }));

  const allPages = [...staticPages, ...examPages, ...categoryPages];

  let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  allPages.forEach(page => {
    sitemapContent += `  <url>\n`;
    sitemapContent += `    <loc>${baseUrl}/${page.url}</loc>\n`;
    sitemapContent += `    <lastmod>${page.lastmod}</lastmod>\n`;
    sitemapContent += `    <changefreq>${page.changefreq}</changefreq>\n`;
    sitemapContent += `    <priority>${page.priority}</priority>\n`;

    const exam = page.url.startsWith('exams/')
      ? exams.find((e: ExamData) => e.slug === page.url.replace('exams/', ''))
      : null;

    if (exam) {
      sitemapContent += `    <image:image>\n`;
      sitemapContent += `      <image:loc>${baseUrl}/favicon.svg</image:loc>\n`;
      sitemapContent += `      <image:title>${escapeXML(exam.name)} Countdown Timer</image:title>\n`;
      sitemapContent += `      <image:caption>Real-time countdown for ${escapeXML(exam.fullName)}</image:caption>\n`;
      sitemapContent += `    </image:image>\n`;
    }

    sitemapContent += `  </url>\n`;
  });

  sitemapContent += `</urlset>`;

  return new Response(sitemapContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'X-Content-Type-Options': 'nosniff',
    }
  });
};
