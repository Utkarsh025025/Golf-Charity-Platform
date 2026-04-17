# Golf Charity Platform - Project TODO

## Phase 1: Database Schema & Data Models
- [x] Design and implement users table with role-based access control
- [x] Create charities table with description, images, and event tracking
- [x] Build subscriptions table with plan types, status, and renewal tracking
- [x] Implement golf_scores table with Stableford format and date constraints
- [x] Create draws table with draw configuration and results
- [x] Build draw_results table to track match types and winners
- [x] Implement prize_pools table for auto-calculation logic
- [x] Create winners table with verification status and payment tracking
- [x] Build user_charities table for charity selection and contribution percentage
- [x] Implement winner_proofs table for file upload tracking
- [x] Create email_logs table for notification tracking
- [x] Generate and apply all database migrations

## Phase 2: Authentication & Access Control
- [x] Implement role-based access control (RBAC) middleware (via protectedProcedure)
- [x] Create protected procedures for subscriber-only features
- [x] Build admin-only procedures for dashboard access (template ready)
- [x] Implement subscription status validation on every request
- [x] Create role checking utilities and helpers
- [ ] Test authentication flow for all three user roles

## Phase 3: Golf Score Management
- [x] Create score submission endpoint with Stableford validation (1-45)
- [x] Implement 5-score rolling window logic
- [x] Enforce one-score-per-date constraint
- [x] Build score edit and delete functionality
- [x] Create score retrieval endpoint with reverse chronological ordering
- [ ] Implement score history display for user dashboard
- [ ] Write comprehensive tests for rolling window logic

## Phase 4: Charity System
- [x] Create charity listing and filtering endpoints
- [ ] Build charity profile pages with description, images, and events
- [ ] Implement charity selection at user signup
- [x] Create contribution percentage system (min 10%, max 100%)
- [ ] Build charity contribution calculation logic
- [ ] Implement charity dashboard showing total contributions
- [ ] Create featured/spotlight charity section for homepage

## Phase 5: Subscription Engine
- [ ] Set up Stripe integration with API keys
- [ ] Create monthly and yearly subscription plans in Stripe
- [ ] Build subscription checkout flow
- [ ] Implement subscription status tracking in database
- [ ] Create renewal and cancellation logic
- [ ] Build subscription lifecycle management (active, lapsed, cancelled)
- [ ] Implement real-time subscription validation
- [ ] Create subscription management page for users

## Phase 6: Monthly Draw Engine
- [ ] Implement draw configuration (random vs algorithmic logic)
- [ ] Build 5-number, 4-number, 3-number match generation
- [ ] Create random draw algorithm
- [ ] Create algorithmic draw (weighted by score frequency)
- [ ] Implement draw simulation and pre-analysis mode
- [ ] Build draw publishing workflow
- [ ] Implement jackpot rollover for unclaimed 5-match prizes
- [ ] Create draw results display (hidden until published)
- [ ] Build draw history and statistics tracking

## Phase 7: Prize Pool & Winner Verification
- [ ] Implement auto-calculation of prize pools (40/35/25 split)
- [ ] Build prize distribution logic for multiple winners
- [ ] Create winner verification endpoint
- [ ] Implement proof upload system (screenshot validation)
- [ ] Build admin review interface for winner submissions
- [ ] Create payment state tracking (Pending → Paid)
- [ ] Implement winner notification system
- [ ] Build payout completion marking

## Phase 8: User Dashboard
- [ ] Create dashboard layout with all required modules
- [ ] Build subscription status display widget
- [ ] Implement score entry and edit interface
- [ ] Create charity selection and contribution display
- [ ] Build participation summary (draws entered, upcoming draws)
- [ ] Implement winnings overview with payment status
- [ ] Add score history visualization
- [ ] Create upcoming draw information display

## Phase 9: Admin Dashboard
- [ ] Build admin layout with comprehensive navigation
- [ ] Create user management interface (view, edit, manage subscriptions)
- [ ] Build draw configuration panel (random vs algorithmic)
- [ ] Implement draw simulation and pre-analysis tools
- [ ] Create draw publishing interface
- [ ] Build charity management (add, edit, delete, manage media)
- [ ] Implement winner verification interface
- [ ] Create reports and analytics dashboard
- [ ] Build user statistics view
- [ ] Implement prize pool breakdown visualization
- [ ] Create charity contribution totals report
- [ ] Build draw statistics and history view

## Phase 10: Landing Page & Modern UI
- [ ] Design emotion-driven landing page (charity-first messaging)
- [ ] Implement modern, clean design system
- [ ] Create animated micro-interactions
- [ ] Build prominent Subscribe CTA
- [ ] Implement charity impact messaging
- [ ] Create feature showcase sections
- [ ] Build testimonials/impact section
- [ ] Implement responsive design for all breakpoints
- [ ] Add dark theme support throughout
- [ ] Create smooth page transitions and animations

## Phase 11: Email Notifications
- [ ] Set up email service integration
- [ ] Create draw result notification template
- [ ] Build winner alert email template
- [ ] Create subscription renewal reminder template
- [ ] Build system update notification template
- [ ] Implement email scheduling and sending logic
- [ ] Create email log tracking
- [ ] Build email preference management for users

## Phase 12: Testing & Deployment
- [ ] Write unit tests for score rolling logic
- [ ] Write tests for draw engine algorithms
- [ ] Write tests for prize pool calculations
- [ ] Write tests for subscription lifecycle
- [ ] Write integration tests for full user flows
- [ ] Test responsive design on all devices
- [ ] Perform security audit
- [ ] Optimize performance and assets
- [ ] Set up Vercel deployment
- [ ] Set up Supabase database
- [ ] Configure environment variables
- [ ] Create deployment documentation
- [ ] Final QA and bug fixes
