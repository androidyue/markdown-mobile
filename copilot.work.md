# Building Markdown Studio: A Mobile-First Markdown Editor for WeChat Official Accounts

## Project Overview
Markdown Studio is a web-based markdown editor designed specifically for creating content for WeChat Official Accounts (公众号). It features real-time preview, syntax highlighting, and intelligent HTML copying that preserves formatting when pasted into the WeChat editor.

## Development Journey

### Phase 1: Core Functionality & WeChat Optimization
The project started with basic markdown editing capabilities but quickly evolved to solve specific WeChat Official Account challenges:

**WeChat-Specific Formatting Issues Fixed:**
- **Ordered list numbering** - Numbers were breaking to new lines before bold text, requiring special handling to insert numbers inside `<strong>` tags
- **Paragraph alignment** - Changed from left to justify alignment with letter-spacing for better WeChat compatibility
- **List rendering** - WeChat doesn't render CSS `list-style` properly, so bullets (•) and numbers are added as actual text content
- **Font family** - Used `-apple-system-font` (with trailing hyphen) for proper WeChat rendering
- **Inline code handling** - Prevented bold text and punctuation from breaking across lines by moving punctuation inside strong tags

### Phase 2: UI/UX Improvements
**Modern Design Overhaul:**
- Migrated to clean, modern interface with improved spacing and typography
- Changed button layouts from text to icon-only for cleaner appearance
- Renamed "Markdown" pane to "Editor" for clarity
- Added visual feedback for copy operations with active button states

**Icon Integration:**
- Generated complete set of PWA icons (favicon, apple-touch-icon, android-chrome icons)
- Created icons using `generate-icons.sh` script
- Added Buy and Feedback icons to preview panel header

**Mobile Optimization:**
- Responsive design for mobile browsers (max-width: 768px, 480px breakpoints)
- Collapsible editor and preview panes on mobile
- Touch-friendly button sizes (44px minimum on mobile)
- Added Paste button for easier clipboard access on mobile devices

### Phase 3: Onboarding Experience
**Interactive User Tour:**
- Initially tried Driver.js but encountered loading errors
- Switched to Intro.js (v7.2.0) for better reliability
- Created 8-step guided tour covering:
  1. Editor pane introduction
  2. Paste button functionality
  3. Upload markdown files
  4. Clear content button
  5. Live preview panel
  6. Sync scroll feature
  7. Feedback/GitHub issues link
  8. Copy HTML for WeChat

**Mobile Tour Challenges & Solutions:**
- **Problem:** Tooltips positioned off-screen on mobile, blocking user interaction
- **Solution:** 
  - Force fixed positioning at bottom of viewport on mobile
  - Hide arrow indicators for cleaner appearance
  - Auto-scroll to highlighted elements
  - Increased z-index to prevent blocking
  - Adjusted button heights for better mobile fit

### Phase 4: Technical Refinements

**Copy Functionality:**
- Multi-format clipboard support (HTML + plain text)
- Inline CSS styles for maximum WeChat compatibility
- Syntax highlighting preservation in code blocks
- Whitespace normalization to prevent formatting breaks

**Build & Deployment:**
- Added build ID for cache busting verification
- Systemd service configuration for production deployment
- Node.js server with auto-reload in development

## Key Technical Decisions

1. **Library Choices:**
   - marked.js for markdown parsing
   - highlight.js for code syntax highlighting
   - Intro.js for onboarding (after Driver.js failed)
   - No build process - vanilla JavaScript for simplicity

2. **Mobile-First Approach:**
   - Fixed tooltip positioning on mobile
   - Touch-friendly UI elements
   - Responsive breakpoints at 768px and 480px
   - Collapsible panels to maximize screen space

3. **WeChat-Specific Optimizations:**
   - Manual list bullet/number insertion as text
   - Inline CSS for all styling
   - Special font-family handling
   - Punctuation placement fixes to prevent line breaks

## Lessons Learned

1. **Third-party library compatibility** - Always test on target devices; Driver.js worked on desktop but failed on mobile
2. **Mobile tooltip positioning** - Fixed positioning at viewport bottom is more reliable than auto-positioning
3. **WeChat editor quirks** - Requires extensive testing and custom formatting that differs from standard HTML rendering
4. **Progressive enhancement** - Started simple, added features based on actual usage needs

## Final Features

- ✅ Real-time markdown preview
- ✅ Syntax-highlighted code blocks
- ✅ Auto-save to localStorage
- ✅ File upload support (.md, .markdown, .txt)
- ✅ Synchronized scrolling between editor and preview
- ✅ One-click copy with WeChat-optimized formatting
- ✅ Interactive onboarding tour for new users
- ✅ Mobile-responsive design
- ✅ PWA-ready with complete icon set
- ✅ Collapsible panels on mobile

## Repository
The project is open source and available at: `androidyue/markdown-mobile`

## Development Timeline

### Commit History
```
6747b4b Reduce Intro.js button height on mobile
f995b55 Fix Intro.js tooltip positioning for mobile browsers
e04c44d Add Intro.js tour steps for Sync Scroll checkbox and Feedback icon
e6c47fc Replace Driver.js with Intro.js for onboarding tour
30fea06 Fix Driver.js loading error
f478a6e Add interactive onboarding tour for first-time users
eb6a1ab Add paste button to editor pane
26c8aaa Change editor pane label from 'Markdown' to 'Editor'
c6ea519 Change Clear and Upload Markdown buttons to icon-only buttons
707ca6f Add Buy icon to preview panel header
e934389 Add feedback icon to preview panel header
9c21f79 Update theme to modern, clean design
29b0fc9 Fix OL number insertion - handle P tag wrapper from marked.js
7b29eb1 Add detailed logging to debug OL strong tag detection
cbc4f9a Fix OL number insertion logic to properly detect strong tags
f54528e Fix ordered list numbering for WeChat Official Account editor
d968ee8 Fix paragraph left alignment in WeChat Official Account editor
```

## Technical Stack

- **Frontend:** Vanilla JavaScript (ES6+)
- **Markdown Parser:** marked.js v12.0.1
- **Syntax Highlighting:** highlight.js v11.9.0
- **Onboarding:** Intro.js v7.2.0
- **Icons:** Font Awesome v6.5.1
- **Backend:** Node.js static server
- **Deployment:** systemd service

## Conclusion

This project demonstrates how focused iteration and user feedback can transform a simple markdown editor into a specialized tool optimized for a specific use case (WeChat Official Accounts). The key was identifying pain points (formatting issues, mobile usability, onboarding) and addressing them systematically.

The journey from basic functionality to a polished, mobile-friendly application with guided onboarding shows the importance of:
- Testing on actual target devices
- Being willing to switch libraries when needed
- Optimizing for specific platforms (WeChat)
- Prioritizing mobile experience
- Providing clear user guidance through interactive tours

The result is a tool that makes it significantly easier to create well-formatted content for WeChat Official Accounts, with a smooth user experience on both desktop and mobile devices.
