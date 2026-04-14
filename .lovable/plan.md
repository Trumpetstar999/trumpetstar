

## Plan: Redesign Login Page with Video Background

### Overview
Redesign the AuthPage to use the provided sign-in component layout: a two-column design with the form on the left and a Vimeo HLS video playing in the background on the right (instead of a static image). All existing auth functionality (magic link, login, signup tabs, Google/Apple OAuth, forgot password, language switcher, i18n, redirect logic) will be preserved.

### Changes

**1. Add CSS animations to `src/index.css`**
- Add the three keyframe animations (`fadeSlideIn`, `slideRightIn`, `testimonialIn`) needed by the new design.

**2. Rewrite `src/pages/AuthPage.tsx`**
- **Layout**: Change from single centered card to a two-column layout (left: form, right: video background).
- **Left column**: Dark/glass-styled form area containing:
  - Language switcher (top-right)
  - Trumpetstar logo + header with `t()` translations
  - Google + Apple OAuth buttons (existing handlers)
  - Divider
  - Tabs (Magic Link / Login / Signup) with all existing form logic preserved
  - Forgot password, remember me, error handling -- all kept
  - Footer with Terms/Privacy links
- **Right column**: Full-height section with the Vimeo HLS video as background:
  - Use an HTML `<video>` element with HLS.js to play `https://player.vimeo.com/external/1182895999.m3u8?s=79486abc8212f3e32ae79db02772c8c750c1f891&logging=false`
  - Video: autoplay, muted, loop, no controls, `object-fit: cover`
  - Dark gradient overlay for readability
  - Optional: testimonial cards overlaid on the video (can use existing student reviews or placeholder content)
- **Mobile**: On small screens, hide the right column and show full-width form (with video as subtle background if desired).
- **No functionality changes**: All handlers (`handleSignIn`, `handleSignUp`, `handleMagicLink`, `handleGoogleSignIn`, `handleAppleSignIn`, `handleForgotPassword`) remain identical.

**3. Install `hls.js` dependency**
- Required to play the `.m3u8` HLS stream in the `<video>` element on non-Safari browsers. Safari supports HLS natively.

### Technical Details
- HLS.js will be loaded in a `useEffect` that attaches to the video element ref, checking for native HLS support first (Safari) before falling back to hls.js.
- The dark glass styling from the provided component will be adapted to match the existing Trumpetstar blue gradient theme.
- Animations will use the CSS keyframes for fade-in effects on form elements.
- The `magicLinkSent` confirmation screen will also be updated to match the new design.

