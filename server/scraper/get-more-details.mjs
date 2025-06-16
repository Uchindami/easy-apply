import { chromium } from 'playwright';
import fs from 'fs/promises';

// Configuration
const CONFIG = {
  concurrency: 20, // Number of concurrent browser contexts to use
  timeout: 30000,  // Navigation timeout in ms
  selectorTimeout: 5000, // Selector timeout in ms
  inputPath: "./scraper/new_jobs.json",
  outputPath: "./scraper/new_jobs.json"
};

// Selector mapping by source
const SELECTORS = {
  default: '.job_description',
  'opportunitiesforyouth': '.entry-content',
  'unicef-careers': '#job-details'
};

async function scrapeJobDescriptions(jobs) {
  // Launch a single browser instance
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    headless: true,
  });

  // Process jobs in batches for controlled concurrency
  const results = [];
  for (let i = 0; i < jobs.length; i += CONFIG.concurrency) {
    const batch = jobs.slice(i, i + CONFIG.concurrency);
    const batchPromises = batch.map(job => processJob(browser, job));

    // Wait for the current batch to complete
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    console.log(`Processed ${results.length}/${jobs.length} jobs`);
  }

  await browser.close();
  return results;
}

async function processJob(browser, job) {
  // Create a new context for each job (like an incognito window)
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Set shorter timeout for better performance
    await page.goto(job.link, {
      waitUntil: 'domcontentloaded',
      timeout: CONFIG.timeout
    });

    // Get the appropriate selector
    const selector = SELECTORS[job.source] || SELECTORS.default;

    // Wait for the selector with a timeout
    try {
      await page.waitForSelector(selector, { timeout: CONFIG.selectorTimeout });
    } catch (err) {
      console.warn(`Selector ${selector} not found for ${job.link}`);
    }

    // Process unicef-careers specific data
    if (job.source === 'unicef-careers') {
      await extractUnicefMetadata(page, job);
    }

    // Extract job description
    job.jobDescription = await extractJobDescription(page, selector);

  } catch (err) {
    console.warn(`Failed to scrape ${job.link}:`, err.message);
    job.jobDescription = 'Could not fetch description';
  } finally {
    // Always close the context to free resources
    await context.close();
  }

  return job;
}

async function extractUnicefMetadata(page, job) {
  try {
    const openDate = await page.locator('.open-date > time').textContent().catch(() => null);
    if (openDate) job.datePosted = openDate.trim();

    const closeDate = await page.locator('.close-date > time').textContent().catch(() => null);
    if (closeDate) job.applicationDeadline = closeDate.trim();

    const contractType = await page.locator('.work-type').textContent().catch(() => null);
    if (contractType) job.jobType = contractType.trim();
  } catch (err) {
    console.warn('Error extracting UNICEF metadata:', err.message);
  }
}

async function extractJobDescription(page, selector) {
  try {
    // Try to get text description first
    const textContent = await page.locator(selector).textContent().catch(() => '');
    if (textContent && textContent.trim()) {
      return textContent.trim();
    }

    // If no text, try to get images
    const imgUrls = await page.locator(`${selector} img`).evaluateAll(
      imgs => imgs.map(img => img.src).filter(Boolean)
    );

    if (imgUrls.length > 0) {
      return imgUrls.join(', ');
    }

    return 'No description found';
  } catch (err) {
    console.warn('Error extracting job description:', err.message);
    return 'Error extracting description';
  }
}

async function main() {
  try {
    // Read input file
    const data = await fs.readFile(CONFIG.inputPath, 'utf-8');
    const jobs = JSON.parse(data);

    console.log(`Starting to process ${jobs.length} jobs...`);
    const startTime = Date.now();

    // Process jobs
    const updatedJobs = await scrapeJobDescriptions(jobs);

    // Write output
    await fs.writeFile(CONFIG.outputPath, JSON.stringify(updatedJobs, null, 2));

    const duration = (Date.now() - startTime) / 1000;
    console.log(`Completed in ${duration.toFixed(2)} seconds. Updated jobs saved to ${CONFIG.outputPath}`);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();