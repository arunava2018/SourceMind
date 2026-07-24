import { YoutubeTranscript } from 'youtube-transcript';
import * as cheerio from 'cheerio';
import { chunkText } from './chunker';

// --- 1. YouTube Transcript Loader ---
export async function loadYoutubeTranscript(videoUrl: string) {
  try {
    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoUrl);
    
    // Combine the text from all transcript segments
    const fullText = transcript.map(t => t.text).join(' ');
    
    // Pass the combined text to existing chunker
    const chunks = await chunkText(fullText);
    
    let title = "YouTube Video";
    try {
      const response = await fetch(videoUrl);
      if (response.ok) {
        const html = await response.text();
        const $ = cheerio.load(html);
        const fetchedTitle = $('title').text().replace(' - YouTube', '').trim();
        if (fetchedTitle) title = fetchedTitle;
      }
    } catch (e) {
      console.error("Failed to fetch YouTube title", e);
    }
    
    return {
      source: videoUrl,
      title,
      fullText,
      chunks,
    };
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    throw error;
  }
}

// --- 2. Web URL Scraper ---
export async function loadWebPage(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Load the HTML into Cheerio
    const $ = cheerio.load(html);
    
    let title = "Web Page";
    const fetchedTitle = $('title').text().trim();
    if (fetchedTitle) title = fetchedTitle;
    
    // Remove scripts, styles, and non-content tags to clean up the text
    $('script, style, noscript, iframe, img, svg, video, audio').remove();
    
    // Extract the text content (compacting multiple spaces/newlines)
    const rawText = $('body').text().replace(/\s+/g, ' ').trim();
    
    // Pass the extracted text to your existing chunker
    const chunks = await chunkText(rawText);
    
    return {
      source: url,
      title,
      fullText: rawText,
      chunks,
    };
  } catch (error) {
    console.error("Error scraping web page:", error);
    throw error;
  }
}
