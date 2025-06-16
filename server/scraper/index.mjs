import puppeteer from "puppeteer";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

/**
 * Job Scraper
 *
 * This script scrapes job listings from multiple websites and combines them
 * into a single JSON file. The code has been refactored for:
 * - Better organization with class-based architecture
 * - Improved error handling and logging
 * - Enhanced configurability
 * - Better separation of concerns
 */

// Configuration
const CONFIG = {
  DEFAULT_SCROLL_ATTEMPTS: 3,
  DEFAULT_TIMEOUT: 100000, // Reduced from 1000000 to a more reasonable 60 seconds
  VIEWPORT_SIZE: { width: 1280, height: 800 },
  COMBINED_OUTPUT_FILE: "./scraper/current_jobs.json",
  MAX_RETRIES: 2,
  RETRY_DELAY: 3000,
};

// Enhanced Logger with different levels
class Logger {
  static info(message, ...args) {
    console.log(`[${new Date().toISOString()}] INFO: ${message}`, ...args);
  }

  static error(message, ...args) {
    console.error(`[${new Date().toISOString()}] ERROR: ${message}`, ...args);
  }

  static warn(message, ...args) {
    console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
  }

  static debug(message, ...args) {
    if (process.env.DEBUG) {
      console.log(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
    }
  }

  static success(message, ...args) {
    console.log(
      `[${new Date().toISOString()}] ✅ SUCCESS: ${message}`,
      ...args
    );
  }
}

// Text processing utilities
class TextUtils {
  static clean(text) {
    if (!text || text === "N/A") return text;
    return text.replace(/\s+/g, " ").trim();
  }

  static sanitize(value) {
    if (!value || value === "N/A") return value;
    return value
      .replace(/[^\w\s-]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  static extractDate(dateString) {
    if (!dateString || dateString === "N/A") return "N/A";

    // Try to parse various date formats
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0]; // Return YYYY-MM-DD format
    }
    return dateString; // Return original if parsing fails
  }
}

// Request blocking utility
class RequestBlocker {
  static shouldBlock(url) {
    const blockedPatterns = [
      "wonderpush",
      "popup",
      "newsletter",
      "analytics",
      "tracking",
      "ads",
      "facebook.com",
      "google-analytics",
      "googletagmanager",
      "doubleclick",
      ".gif",
      ".png",
      ".jpg",
      ".jpeg",
      ".webp",
      ".svg",
    ];

    return blockedPatterns.some((pattern) =>
      url.toLowerCase().includes(pattern)
    );
  }

  static async setupRequestInterception(page) {
    await page.setRequestInterception(true);

    page.on("request", (req) => {
      const url = req.url();

      if (this.shouldBlock(url)) {
        Logger.debug("Blocking request:", url);
        req.abort();
      } else {
        req.continue();
      }
    });

    Logger.info("Request interception enabled");
  }
}

// Site configurations
const sitesConfig = [
  {
    name: "careersmw",
    url: "https://careersmw.com/",
    outputFile: "career_jobs.json",
    listingSelector: "li",
    fieldSelectors: {
      link: "a",
      companyLogo: ".company_logo",
      position: ".position",
      companyName: ".company",
      location: ".location",
      jobType: ".job-type",
      datePosted: ".meta time",
      applicationDeadline: ".application-deadline",
    },
    loadStrategy: "full-scroll",
  },
  {
    name: "ntchito",
    url: "https://ntchito.com/jobs-in-malawi/",
    outputFile: "nchito_jobs.json",
    listingSelector: "article",
    fieldSelectors: {
      link: "a",
      companyLogo: ".company_logo",
      position: ".entry-title",
      companyName: ".company-name",
      location: ".google_map_link",
      jobType: ".job-type",
      datePosted: ".date time",
      applicationDeadline: ".application-deadline",
    },
    loadStrategy: "full-scroll",
  },
  {
    name: "jobsearchmalawi",
    url: "https://jobsearchmalawi.com/",
    outputFile: "job_search_malawi.json",
    listingSelector: "li",
    fieldSelectors: {
      link: "a",
      companyLogo: ".company_logo",
      position: ".position",
      companyName: ".company",
      location: ".location",
      jobType: ".job-type",
      datePosted: ".date time",
      applicationDeadline: ".application-deadline",
    },
    loadStrategy: "load-more",
    buttonSelector: ".load_more_jobs",
    maxAttempts: 4,
  },
  {
    name: "unicef-careers",
    url: "https://jobs.unicef.org/en-us/listing/",
    outputFile: "unicef_jobs.json",
    listingSelector: "#recent-jobs-content .list-view--item",
    fieldSelectors: {
      link: "a.job-link, a",
      position: ".job-link, .list-title, a",
      location: ".location, .list-location",
      datePosted: ".date time, .list-date time",
      applicationDeadline: ".close-date",
    },
    loadStrategy: null,
    isUnicef: true,
  },
  {
    name: "opportunitiesforyouth",
    url: "https://opportunitiesforyouth.org/category/scholarships/",
    outputFile: "opportunitiesforyouth_jobs.json",
    listingSelector: ".et_pb_column_1_3",
    fieldSelectors: {
      article: "article",
      link: "a",
      logo: "img",
      position: "h2, h3, h4",
      companyName: ".company-name",
      location:
        "div:nth-child(2) > div:nth-child(2) > p:nth-child(1) > a:nth-child(2)",
      datePosted:
        "div:nth-child(2) > div:nth-child(2) > p:nth-child(1) > span:nth-child(1)",
      type: ".module-head h1",
    },
    loadStrategy: "partial-scroll",
    isOpportunitiesForYouth: true,
  },
];

// Enhanced scrolling strategies
class ScrollStrategies {
  static async fullScroll(page) {
    Logger.info("Executing full-scroll strategy");
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let lastHeight = document.body.scrollHeight;
        let attempts = 0;
        const maxAttempts = 10;

        const interval = setInterval(() => {
          window.scrollTo(0, document.body.scrollHeight);
          attempts++;

          setTimeout(() => {
            const newHeight = document.body.scrollHeight;
            if (newHeight === lastHeight || attempts >= maxAttempts) {
              clearInterval(interval);
              resolve();
            } else {
              lastHeight = newHeight;
            }
          }, 1000);
        }, 1000);
      });
    });
  }

  static async partialScroll(page) {
    Logger.info("Executing partial-scroll strategy");
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight * 0.25);
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  static async loadMore(page, config) {
    Logger.info("Executing load-more strategy");
    let previousCount = 0;
    let currentCount = await page.$$eval(
      config.listingSelector,
      (el) => el.length
    );
    let attempts = 0;
    const maxAttempts = config.maxAttempts || CONFIG.DEFAULT_SCROLL_ATTEMPTS;

    while (attempts < maxAttempts) {
      previousCount = currentCount;

      try {
        await page.waitForSelector(config.buttonSelector, { timeout: 5000 });
        await page.click(config.buttonSelector);
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 });
        await this.fullScroll(page);
      } catch (error) {
        Logger.warn(
          `Load more button not found or error clicking it (attempt ${attempts + 1
          }/${maxAttempts})`
        );
        attempts++;
        if (attempts >= maxAttempts) break;
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      currentCount = await page.$$eval(
        config.listingSelector,
        (el) => el.length
      );
      Logger.info(`Loaded ${currentCount} items (previous: ${previousCount})`);

      if (currentCount === previousCount) {
        Logger.info("No new items loaded, stopping");
        break;
      }

      attempts++;
    }
  }

  static async execute(strategy, page, config) {
    switch (strategy) {
      case "full-scroll":
        return this.fullScroll(page);
      case "partial-scroll":
        return this.partialScroll(page);
      case "load-more":
        return this.loadMore(page, config);
      default:
        Logger.info("No scroll strategy specified or needed");
        return Promise.resolve();
    }
  }
}

// Enhanced extraction strategies with better validation
class ExtractionStrategies {
  static async standard(page, config) {
    return page.evaluate(({ listingSelector, fieldSelectors }) => {
      const parseText = (el, selector) => {
        const element = el.querySelector(selector);
        const text = element?.textContent || element?.innerText;
        return text ? text.replace(/\s+/g, " ").trim() : "N/A";
      };

      const parseLink = (el, selector) => {
        const linkEl = el.querySelector(selector);
        const href = linkEl?.href;
        if (!href) return "N/A";

        // Ensure absolute URL
        try {
          return new URL(href, window.location.origin).href;
        } catch {
          return href;
        }
      };

      return Array.from(document.querySelectorAll(listingSelector))
        .map((el) => {
          const result = {
            link: parseLink(el, fieldSelectors.link),
            companyLogo:
              el.querySelector(fieldSelectors.companyLogo)?.src || "N/A",
            position: parseText(el, fieldSelectors.position),
            companyName: parseText(el, fieldSelectors.companyName),
            location: parseText(el, fieldSelectors.location),
            jobType: parseText(el, fieldSelectors.jobType),
            datePosted:
              el
                .querySelector(fieldSelectors.datePosted)
                ?.getAttribute("datetime") ||
              parseText(el, fieldSelectors.datePosted),
            applicationDeadline: parseText(
              el,
              fieldSelectors.applicationDeadline
            ).replace(/Closes:\s*/i, ""),
          };

          // Validate required fields
          return result.link !== "N/A" &&
            result.position !== "N/A" &&
            result.position.length > 2
            ? result
            : null;
        })
        .filter(Boolean);
    }, config);
  }

  static async unicef(page, config) {
    return page.evaluate(({ listingSelector, fieldSelectors }) => {
      const parseText = (el, selector) => {
        const element = el.querySelector(selector);
        const text = element?.textContent || element?.innerText;
        return text ? text.replace(/\s+/g, " ").trim() : "N/A";
      };

      return Array.from(document.querySelectorAll(listingSelector))
        .map((el) => {
          const linkEl = el.querySelector(fieldSelectors.link);
          const href = linkEl?.href;

          return {
            link: href ? new URL(href, window.location.origin).href : "N/A",
            position: parseText(el, fieldSelectors.position),
            location: parseText(el, fieldSelectors.location),
            datePosted:
              el
                .querySelector(fieldSelectors.datePosted)
                ?.getAttribute("datetime") ||
              parseText(el, fieldSelectors.datePosted),
            applicationDeadline: parseText(
              el,
              fieldSelectors.applicationDeadline
            ).replace(/Closes:\s*/i, ""),
          };
        })
        .filter(
          (job) =>
            job.link !== "N/A" &&
            job.position !== "N/A" &&
            job.position.length > 2
        );
    }, config);
  }

  static async opportunitiesForYouth(page, config) {
    return page.evaluate(({ listingSelector, fieldSelectors }) => {
      return Array.from(document.querySelectorAll(listingSelector)).flatMap(
        (col) => {
          const sectionTitleEl = col.querySelector(fieldSelectors.type);
          const type = sectionTitleEl ? sectionTitleEl.innerText.trim() : "";
          const articles = Array.from(
            col.querySelectorAll(fieldSelectors.article)
          );

          return articles
            .map((article) => {
              const linkEl = article.querySelector(fieldSelectors.link);
              const logoEl = article.querySelector(fieldSelectors.logo);
              const titleEl = article.querySelector(fieldSelectors.position);
              const companyEl = article.querySelector(
                fieldSelectors.companyName
              );
              const locationEl = article.querySelector(fieldSelectors.location);
              const datePostedEl = article.querySelector(
                fieldSelectors.datePosted
              );

              const href = linkEl?.href;
              const position = titleEl?.innerText?.trim();

              return {
                link: href ? new URL(href, window.location.origin).href : "N/A",
                companyLogo: logoEl?.src?.trim() || "N/A",
                position: position || "N/A",
                companyName: companyEl?.innerText?.trim() || "N/A",
                location: locationEl?.innerText?.trim() || "N/A",
                jobType: type,
                datePosted: datePostedEl?.innerText?.trim() || "N/A",
                applicationDeadline: "N/A",
              };
            })
            .filter(
              (job) =>
                job.link !== "N/A" &&
                job.position !== "N/A" &&
                job.position.length > 2
            );
        }
      );
    }, config);
  }

  static async execute(page, config) {
    try {
      let listings;

      if (config.isUnicef) {
        listings = await this.unicef(page, config);
        return listings.map((job) => ({
          ...job,
          companyLogo:
            "https://logowik.com/content/uploads/images/930_unicef.jpg",
          companyName: "UNICEF",
          source: config.name,
          position: TextUtils.sanitize(job.position),
          jobType: "International Organization",
          datePosted: TextUtils.extractDate(job.datePosted),
          scrapedAt: new Date().toISOString(),
        }));
      }

      if (config.isOpportunitiesForYouth) {
        listings = await this.opportunitiesForYouth(page, config);
      } else {
        listings = await this.standard(page, config);
      }

      return listings.map((job) => ({
        ...job,
        source: config.name,
        position: TextUtils.sanitize(job.position),
        companyName: TextUtils.sanitize(job.companyName),
        location: TextUtils.clean(job.location),
        datePosted: TextUtils.extractDate(job.datePosted),
        scrapedAt: new Date().toISOString(),
        isValidUrl: TextUtils.isValidUrl(job.link),
      }));
    } catch (error) {
      Logger.error(`Error extracting listings from ${config.name}:`, error);
      return [];
    }
  }
}

// Enhanced main scraper class
class JobScraper {
  constructor() {
    this.browser = null;
    this.stats = {
      totalAttempts: 0,
      successfulScrapes: 0,
      failedScrapes: 0,
      totalListings: 0,
    };
  }

  async initialize() {
    Logger.info("Initializing browser with enhanced settings");
    this.browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      headless: "new",
      // headless: false, // Set to false for debugging
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-zygote",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
      ],
    });
  }

  async close() {
    if (this.browser) {
      Logger.info("Closing browser");
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapeSiteWithRetry(config, maxRetries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        Logger.info(
          `Scraping ${config.name} (attempt ${attempt}/${maxRetries})`
        );
        const listings = await this.scrapeSite(config);
        this.stats.successfulScrapes++;
        return listings;
      } catch (error) {
        Logger.error(
          `Attempt ${attempt} failed for ${config.name}:`,
          error.message
        );

        if (attempt === maxRetries) {
          Logger.error(`All ${maxRetries} attempts failed for ${config.name}`);
          this.stats.failedScrapes++;
          return [];
        }

        Logger.info(`Waiting ${CONFIG.RETRY_DELAY}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, CONFIG.RETRY_DELAY));
      }
    }
  }

  async scrapeSite(config) {
    if (!this.browser) {
      throw new Error("Browser not initialized. Call initialize() first.");
    }

    this.stats.totalAttempts++;
    const page = await this.browser.newPage();
    let listings = [];

    try {
      Logger.info(`Starting to scrape ${config.name} (${config.url})`);

      // Setup page
      await page.setViewport(CONFIG.VIEWPORT_SIZE);
      await page.setCacheEnabled(false);

      // Set a realistic user agent
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );
      page.setDefaultTimeout(CONFIG.DEFAULT_TIMEOUT);

      // Setup request blocking
      await RequestBlocker.setupRequestInterception(page);

      // Navigate with better error handling
      Logger.info(`Navigating to ${config.url}`);
      const response = await page.goto(config.url, {
        waitUntil: "networkidle2",
        timeout: CONFIG.DEFAULT_TIMEOUT,
      });

      if (!response.ok()) {
        throw new Error(`HTTP ${response.status()}: ${response.statusText()}`);
      }

      // Wait for content to load
      await page.waitForSelector(config.listingSelector, { timeout: 10000 });

      // Execute scroll strategy
      if (config.loadStrategy) {
        await ScrollStrategies.execute(config.loadStrategy, page, config);
      }

      // Extract listings
      Logger.info(`Extracting listings from ${config.name}`);
      listings = await ExtractionStrategies.execute(page, config);

      Logger.success(
        `Found ${listings.length} valid listings for ${config.name}`
      );
      this.stats.totalListings += listings.length;

      return listings;
    } catch (error) {
      Logger.error(`Error scraping ${config.name}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  async scrapeAllSites() {
    try {
      await this.initialize();

      Logger.info(`Starting to scrape ${sitesConfig.length} sites`);
      const allListings = [];

      // Scrape each site with retry logic
      for (const config of sitesConfig) {
        const listings = await this.scrapeSiteWithRetry(config);
        allListings.push(...listings);

        // Add delay between sites to be respectful
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      // Ensure output directory exists
      await mkdir(path.dirname(CONFIG.COMBINED_OUTPUT_FILE), {
        recursive: true,
      });

      // Save combined results
      await this.saveToFile(CONFIG.COMBINED_OUTPUT_FILE, allListings);

      this.logFinalStats(allListings);
      return allListings;
    } finally {
      await this.close();
    }
  }

  logFinalStats(allListings) {
    Logger.success("=== SCRAPING COMPLETED ===");
    Logger.info(`Total sites attempted: ${this.stats.totalAttempts}`);
    Logger.info(`Successful scrapes: ${this.stats.successfulScrapes}`);
    Logger.info(`Failed scrapes: ${this.stats.failedScrapes}`);
    Logger.info(`Total listings found: ${this.stats.totalListings}`);
    Logger.info(
      `Valid URLs: ${allListings.filter((job) => job.isValidUrl).length}`
    );
    Logger.info(`Output saved to: ${CONFIG.COMBINED_OUTPUT_FILE}`);

    // Log breakdown by source
    const sourceBreakdown = {};
    allListings.forEach((job) => {
      sourceBreakdown[job.source] = (sourceBreakdown[job.source] || 0) + 1;
    });

    Logger.info("Listings by source:");
    Object.entries(sourceBreakdown).forEach(([source, count]) => {
      Logger.info(`  ${source}: ${count} listings`);
    });
  }

  async saveToFile(filePath, data) {
    try {
      await writeFile(filePath, JSON.stringify(data, null, 2));
      Logger.success(`Saved data to ${filePath}`);
    } catch (error) {
      Logger.error(`Error saving to ${filePath}:`, error);
      throw error;
    }
  }
}

// Main execution function
async function main() {
  const startTime = Date.now();
  const scraper = new JobScraper();

  try {
    Logger.info("🚀 Starting Malawi Job Scraper");
    await scraper.scrapeAllSites();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    Logger.success(
      `✅ All scraping completed successfully in ${duration} seconds`
    );
  } catch (error) {
    Logger.error("💥 Fatal error during scraping:", error);
    process.exit(1);
  }
}

// Run the scraper
main();

// Export for testing
export { JobScraper, sitesConfig, CONFIG };
