/**
 * Security utilities for safe HTML handling
 * Provides XSS protection and secure DOM manipulation
 */

window.SecurityUtils = {
    /**
     * Escapes HTML entities to prevent XSS attacks
     * @param {string} unsafe - Potentially unsafe HTML string
     * @returns {string} - Escaped safe string
     */
    escapeHtml: function(unsafe) {
        if (typeof unsafe !== 'string') {
            return String(unsafe);
        }
        
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    /**
     * Creates a text node safely
     * @param {string} text - Text content
     * @returns {Text} - DOM text node
     */
    createTextNode: function(text) {
        return document.createTextNode(String(text));
    },

    /**
     * Safely sets text content of an element
     * @param {Element} element - Target element
     * @param {string} text - Text content to set
     */
    setTextContent: function(element, text) {
        if (element && element.textContent !== undefined) {
            element.textContent = String(text);
        }
    },

    /**
     * Creates an element with safe text content
     * @param {string} tagName - HTML tag name
     * @param {string} textContent - Text content
     * @param {Object} attributes - Optional attributes object
     * @returns {Element} - Created element
     */
    createElement: function(tagName, textContent, attributes) {
        const element = document.createElement(tagName);
        
        if (textContent) {
            this.setTextContent(element, textContent);
        }
        
        if (attributes) {
            for (const [key, value] of Object.entries(attributes)) {
                if (key === 'className') {
                    element.className = String(value);
                } else if (key === 'id') {
                    element.id = String(value);
                } else {
                    element.setAttribute(key, String(value));
                }
            }
        }
        
        return element;
    },

    /**
     * Sanitizes HTML by allowing only specific safe tags and attributes
     * WARNING: This is a basic sanitizer. For production use, consider DOMPurify
     * @param {string} html - HTML string to sanitize
     * @returns {string} - Sanitized HTML
     */
    sanitizeHtml: function(html) {
        if (typeof html !== 'string') {
            return this.escapeHtml(html);
        }

        // Allow only basic formatting tags with no attributes
        const allowedTags = ['b', 'i', 'em', 'strong', 'br', 'p', 'div', 'span'];
        const tagRegex = /<\/?([a-zA-Z0-9]+)(?:\s[^>]*)?>/g;
        
        return html.replace(tagRegex, (match, tagName) => {
            const lowerTagName = tagName.toLowerCase();
            if (allowedTags.includes(lowerTagName)) {
                // Return tag without attributes for security
                if (match.startsWith('</')) {
                    return `</${lowerTagName}>`;
                } else {
                    return `<${lowerTagName}>`;
                }
            }
            // Remove disallowed tags completely
            return '';
        });
    },

    /**
     * Safely replaces innerHTML with sanitized content
     * @param {Element} element - Target element
     * @param {string} html - HTML content to set
     */
    setSafeInnerHTML: function(element, html) {
        if (!element) return;
        
        // Clear existing content
        element.innerHTML = '';
        
        // If content is simple text, use textContent
        if (typeof html === 'string' && !html.includes('<')) {
            this.setTextContent(element, html);
            return;
        }
        
        // For HTML content, sanitize first
        const sanitizedHtml = this.sanitizeHtml(html);
        element.innerHTML = sanitizedHtml;
    },

    /**
     * Safely appends content to an element
     * @param {Element} parent - Parent element
     * @param {string|Element} content - Content to append
     */
    safeAppend: function(parent, content) {
        if (!parent) return;
        
        if (typeof content === 'string') {
            parent.appendChild(this.createTextNode(content));
        } else if (content instanceof Element) {
            parent.appendChild(content);
        }
    }
};

// Log initialization
if (typeof devLog !== 'undefined') {
    devLog.success('Security utilities initialized');
}