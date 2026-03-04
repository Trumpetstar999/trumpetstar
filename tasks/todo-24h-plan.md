# 24-Hour Execution Plan
**Project:** Trumpetstar SEO & TIM Hilfe-Center  
**Created:** 2026-02-24 05:15 UTC  
**Owner:** Valentin  
**Status:** In Progress

---

## Phase 1: Complete SEO Pages (0-8 hours)

### Task 1.1: Technik-Guide - Tonumfang
- [ ] Create /trompete-tonumfang page (HowTo schema)
- [ ] Target keywords: "tonumfang erhöhen", "hohe töne", "range"
- [ ] Include: 5-step progression, exercises, warning about pressure
- [ ] Add FAQ section (5 questions)
- [ ] Link from: /trompete-ansatz-atmung, /trompete-erster-ton
- [ ] **Verify:** Schema validates, mobile responsive, CTA functional

### Task 1.2: Technik-Guide - Intonation  
- [ ] Create /trompete-intonation page
- [ ] Target keywords: "intonation verbessern", "schiefe töne"
- [ ] Include: ear training, tuner usage, pitch bending exercises
- [ ] Add FAQ section (5 questions)
- [ ] **Verify:** Schema markup correct, internal links working

### Task 1.3: Problem-Seite - Schiefe Töne
- [ ] Create /hilfe/trompete-schiefe-toene page
- [ ] High-intent: users with specific problem = high conversion
- [ ] Include: diagnosis tool, quick fixes, long-term solutions
- [ ] Link to: Intonation guide, Support chat
- [ ] **Verify:** Page loads < 2s, forms functional

### Task 1.4: Problem-Seite - Hohe Töne
- [ ] Create /hilfe/hohe-toene page  
- [ ] Target: "hohe töne gehen nicht", "high notes"
- [ ] Include: pressure vs. air speed explanation, exercises
- [ ] Cross-link with: Tonumfang guide
- [ ] **Verify:** All links working, mobile optimized

### Task 1.5: Übungs-Datenbank
- [ ] Create /trompete-uebungen page (major pillar)
- [ ] Categorize: Ansatz, Atmung, Artikulation, Range, Endurance
- [ ] Include: 50+ exercises with difficulty levels
- [ ] Filter: by category, difficulty, duration
- [ ] **Verify:** Filter works, all exercises load

---

## Phase 2: EN International Expansion (8-14 hours)

### Task 2.1: EN Main Pillar
- [ ] Create /en/learn-trumpet page
- [ ] Translate & adapt: Not literal, but culturally appropriate
- [ ] Target: "learn trumpet online", "trumpet lessons online"
- [ ] Include: US/UK specific examples, terminology
- [ ] **Verify:** Hreflang tags correct, EN keywords in meta

### Task 2.2: EN Technical Guides
- [ ] Create /en/trumpet-embouchure (adapt from DE)
- [ ] Create /en/trumpet-range (adapt from DE)
- [ ] Consistent: Navigation, styling, CTAs
- [ ] **Verify:** No broken EN links, proper localization

---

## Phase 3: TIM Database Integration (14-18 hours)

### Task 3.1: Supabase Setup
- [ ] Create `faqs` table with schema:
  ```sql
  id, question, answer, category, tags[], 
  views, helpful, related_pages[], created_at
  ```
- [ ] Enable RLS policies for read/write
- [ ] Add 20+ seed FAQs covering:
  - Navigation (5)
  - Technical (5)  
  - Billing/Account (3)
  - Content (4)
  - Troubleshooting (3)
- [ ] **Verify:** API calls work, data returns correctly

### Task 3.2: Frontend Connection
- [ ] Update HilfeCenterPage.tsx to fetch from Supabase
- [ ] Implement: Real-time search, category filter, pagination
- [ ] Add: "Was this helpful?" tracking
- [ ] **Verify:** Search returns results < 500ms, filters work

### Task 3.3: Navigation & Onboarding FAQs
- [ ] Document: How to get from A to B in app
- [ ] Include: Screenshots/descriptions of key flows
- [ ] Cover: Lektionen → Videos → Übungen → Fortschritt
- [ ] **Verify:** Instructions clear, no dead ends

---

## Phase 4: Interlinking & Optimization (18-22 hours)

### Task 4.1: Internal Link Network
- [ ] Add breadcrumb navigation to all pages
- [ ] Cross-link: Every pillar → 3-5 cluster pages
- [ ] Cross-link: Every cluster → pillar + 2 related
- [ ] Anchor text: Keyword-rich but natural
- [ ] **Verify:** No orphan pages, link checker passes

### Task 4.2: Technical SEO Polish
- [ ] Update sitemap.xml with all new URLs
- [ ] Add canonical tags where needed
- [ ] Optimize images (WebP, lazy loading, alt tags)
- [ ] Test Core Web Vitals (LCP < 2.5s, CLS < 0.1)
- [ ] **Verify:** Google Search Console ready

### Task 4.3: Meta & Social
- [ ] Write unique meta titles (50-60 chars)
- [ ] Write meta descriptions (150-160 chars)  
- [ ] Create OG images for social sharing
- [ ] Add Twitter Cards markup
- [ ] **Verify:** Facebook/Twitter preview looks good

---

## Phase 5: Testing & Documentation (22-24 hours)

### Task 5.1: End-to-End Testing
- [ ] Click through all 12+ pages
- [ ] Test: Mobile (iPhone SE, iPhone 14, Android)
- [ ] Test: Tablet, Desktop
- [ ] Test: All CTAs, forms, links
- [ ] **Verify:** 0 console errors, 0 404s

### Task 5.2: GitHub Sync
- [ ] Final git commit with all changes
- [ ] Push to origin/main
- [ ] Verify: Lovable auto-deploys
- [ ] Check: Live URLs are accessible
- [ ] **Verify:** Production build succeeds

### Task 5.3: Report Creation
- [ ] Document: All created pages with URLs
- [ ] List: Target keywords per page
- [ ] Screenshot: Key pages (hero, FAQ, CTA)
- [ ] Metrics: Expected traffic, ranking positions
- [ ] Deliver: Report to Mario via Telegram

---

## Success Criteria

✅ **Must Have (Blocking):**
- All 5 DE pages created and pushed
- TIM FAQ database connected and working
- All pages mobile-responsive
- Zero broken links

✅ **Should Have (Important):**
- 2 EN pages live
- Internal linking complete
- Core Web Vitals passing

✅ **Nice to Have (If Time):**
- OG images created
- Advanced filtering in TIM
- Analytics tracking setup

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Git merge conflicts | Stash local, pull, reapply changes |
| Supabase RLS issues | Test with anon key immediately |
| Build failures | Check TypeScript errors before push |
| Time overrun | Prioritize Phase 1, defer Phase 2 if needed |

---

## Check-in Points

- **Hour 8:** Phase 1 complete? (5 DE pages)
- **Hour 14:** Phase 2 complete? (EN pages)  
- **Hour 18:** Phase 3 complete? (TIM DB)
- **Hour 24:** All phases done? Report ready.

---

## Notes

- **Auto-continue:** If no response from Mario, proceed with plan
- **Blockers:** If any task blocks for >30min, escalate via Telegram
- **Quality gate:** Each task has "Verify" step - don't skip!
- **Subagents:** Can spawn for parallel research if needed

**Next Action:** Start Task 1.1 (Tonumfang page)
