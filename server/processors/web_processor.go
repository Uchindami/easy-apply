package processors

import (
	"fmt"
	"net/http"
	"regexp"
	"strings"

	"golang.org/x/net/html"
)

// WebProcessor handles web link processing
type WebProcessor struct {
	UploadDir string
}

// NewWebProcessor creates a new web processor
func NewWebProcessor(uploadDir string) *WebProcessor {
	return &WebProcessor{
		UploadDir: uploadDir,
	}
}

// ProcessWebLink extracts text from a webpage and returns the text content
func (w *WebProcessor) ProcessWebLink(url string) (string, error) {
	text, err := w.extractMainTextFromURL(url)
	if err != nil {
		return "", fmt.Errorf("error extracting text from URL: %v", err)
	}

	return text, nil
}

// Extract raw text from HTML node
func (w *WebProcessor) extractText(n *html.Node) string {
	if n.Type == html.TextNode {
		return n.Data
	}
	var sb strings.Builder
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		sb.WriteString(w.extractText(c))
	}
	return sb.String()
}

// Find main content in <main> or <article> tags
func (w *WebProcessor) findMainContentNode(n *html.Node, tags []string) *html.Node {
	var match *html.Node
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode {
			for _, tag := range tags {
				if n.Data == tag {
					match = n
					return
				}
			}
		}
		for c := n.FirstChild; c != nil && match == nil; c = c.NextSibling {
			f(c)
		}
	}
	f(n)
	return match
}

// Fallback: Find <div> with most text
func (w *WebProcessor) findLargestTextDiv(n *html.Node) *html.Node {
	var best *html.Node
	maxLen := 0
	var f func(*html.Node)
	f = func(n *html.Node) {
		if n.Type == html.ElementNode && n.Data == "div" {
			text := strings.TrimSpace(w.extractText(n))
			if len(text) > maxLen {
				maxLen = len(text)
				best = n
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			f(c)
		}
	}
	f(n)
	return best
}

// Clean up text for LLMs: removes junk and normalizes spacing
func (w *WebProcessor) cleanText(text string) string {
	// Remove excessive whitespace and line breaks
	text = strings.ReplaceAll(text, "\t", " ")
	text = strings.ReplaceAll(text, "\r", "")
	text = regexp.MustCompile(`\s+`).ReplaceAllString(text, " ")

	// Break into sentences more cleanly
	text = regexp.MustCompile(`([.!?])\s+`).ReplaceAllString(text, "$1\n")

	// Remove nav/footer junk phrases
	junk := []string{
		"Post navigation", "Share this:", "Follow us", "Related Posts",
	}
	for _, phrase := range junk {
		text = strings.ReplaceAll(text, phrase, "")
	}

	// Trim outer spaces
	text = strings.TrimSpace(text)

	return text
}

// Fetch and extract cleaned text from a webpage
func (w *WebProcessor) extractMainTextFromURL(url string) (string, error) {
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("HTTP Error: %s", resp.Status)
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return "", err
	}

	mainTags := []string{"main", "article"}
	mainNode := w.findMainContentNode(doc, mainTags)
	if mainNode == nil {
		mainNode = w.findLargestTextDiv(doc)
	}
	if mainNode == nil {
		return "", fmt.Errorf("could not find main content")
	}

	rawText := w.extractText(mainNode)
	cleanedText := w.cleanText(rawText)
	return cleanedText, nil
}
