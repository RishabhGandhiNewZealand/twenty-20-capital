# Logo Setup Instructions

To complete the logo setup:

1. **For the header logo (no background):**
   - Delete the current placeholder file at `public/logo.png`
   - Save your actual logo image (the one you provided) as `public/logo.png`
   - This should be the logo with transparent background

2. **For the browser tab favicon (with grey background):**
   
   **Option A - Automated Method (Recommended):**
   - First, add your logo as `public/logo.png`
   - Then run: `node scripts/generate-favicon.js`
   - This will automatically create `public/logo-favicon.png` with a grey background
   
   **Option B - Manual Method:**
   - Open your logo in an image editor
   - Add a grey background (#808080)
   - Save as `public/logo-favicon.png`

3. **The logos are configured to appear in:**
   - Browser tab (favicon): Uses `logo-favicon.png` (with grey background)
   - Website header (navigation bar): Uses `logo.png` (transparent background)

4. **Logo specifications:**
   - Header logo: `/public/logo.png` - transparent background recommended
   - Favicon logo: `/public/logo-favicon.png` - grey background (#808080)
   - Recommended size: At least 512x512 pixels for best quality
   - Format: PNG

5. **After adding your logos:**
   - Clear your browser cache to see the favicon update
   - The logos will automatically scale to fit their respective locations

## Quick Command:
Once you've added your logo.png file:
```bash
node scripts/generate-favicon.js
```

This will automatically create the favicon with a grey background!

The website is now configured to use different logo versions for optimal display!