# Pre-Launch Deployment Checklist

Use this checklist before launching to production.

## ✅ Critical Security Tasks

### 1. Secrets & Environment Variables

- [ ] Generate strong JWT_SECRET (32+ characters)
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Update JWT_SECRET in production environment
- [ ] Verify GOOGLE_PLACES_API_KEY has restrictions (see SECURITY.md)
- [ ] Verify Supabase keys are correct for production project
- [ ] Set OTP_MODE to 'production'
- [ ] Never commit .env.local to git
- [ ] Configure WhatsApp Business API credentials

### 2. Database Security

- [ ] Apply RLS policies migration
  ```bash
  # Via Supabase Dashboard SQL Editor or psql
  psql -h your-db.supabase.co -U postgres -f supabase/migrations/enable_rls_policies.sql
  ```
- [ ] Verify RLS is enabled on all tables
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```
- [ ] Test that users can only access their own data
- [ ] Set up automated daily backups in Supabase dashboard

### 3. Authentication & Authorization

- [ ] Test middleware redirects unauthenticated users
- [ ] Test role-based access (technician can't access customer routes)
- [ ] Test logout functionality
- [ ] Verify HTTP-only cookies are set correctly
- [ ] Test rate limiting on auth endpoints
- [ ] Clear all test sessions from database

### 4. API Security

- [ ] Review all API endpoints for proper authorization
- [ ] Ensure all mutations verify user ownership
- [ ] Add input validation on all endpoints
- [ ] Test with malicious inputs (SQL injection, XSS attempts)
- [ ] Verify file upload restrictions (if applicable)

## ✅ Testing

### End-to-End Flows

- [ ] **Customer Flow:**
  - [ ] Sign up with OTP
  - [ ] Complete onboarding
  - [ ] Book a service
  - [ ] View booking status
  - [ ] View history
  - [ ] Logout

- [ ] **Technician Flow:**
  - [ ] Sign up with OTP
  - [ ] Complete onboarding with profile
  - [ ] View dashboard
  - [ ] See new booking request
  - [ ] Propose time slots (heat map)
  - [ ] Receive confirmation
  - [ ] Update job status
  - [ ] View customer history
  - [ ] Logout

### Device & Browser Testing

- [ ] Test on iPhone (Safari)
- [ ] Test on Android (Chrome)
- [ ] Test on various screen sizes (320px - 428px)
- [ ] Test Hebrew RTL layout
- [ ] Test with slow 3G connection
- [ ] Test offline behavior
- [ ] Test push notifications

### Error Scenarios

- [ ] Invalid OTP code
- [ ] Expired OTP code
- [ ] Network failure during booking
- [ ] Simultaneous booking conflicts
- [ ] Invalid address input
- [ ] Missing required fields

## ✅ Performance

- [ ] Run production build and check bundle size
  ```bash
  npm run build
  ```
- [ ] Optimize images (Next.js Image component)
- [ ] Add loading states to all async operations
- [ ] Test with 10+ jobs in dashboard
- [ ] Verify API response times (<500ms)
- [ ] Check Lighthouse scores (aim for >90 on mobile)

## ✅ Monitoring & Logging

- [ ] Set up error tracking (Sentry, LogRocket)
- [ ] Configure analytics (PostHog, Mixpanel)
- [ ] Set up uptime monitoring (Better Uptime)
- [ ] Create alerts for:
  - [ ] High error rates
  - [ ] Failed authentication attempts
  - [ ] Rate limit violations
  - [ ] Database errors
  - [ ] API downtime

## ✅ Infrastructure

### Hosting (Netlify)

- [ ] Domain configured and DNS propagated
- [ ] SSL certificate installed and active
- [ ] Environment variables set in Netlify dashboard
- [ ] Build settings configured correctly
- [ ] Deploy previews enabled for testing
- [ ] Production deployment successful

### Database (Supabase)

- [ ] Production project created
- [ ] Migrations applied
- [ ] Backups configured (daily)
- [ ] Connection pooling configured
- [ ] Monitor query performance
- [ ] Set up database alerts

## ✅ Legal & Compliance

- [ ] Privacy policy published and linked in app
- [ ] Terms of service published
- [ ] Cookie consent (if tracking users)
- [ ] GDPR compliance (if serving EU)
  - [ ] Data export functionality
  - [ ] Data deletion functionality
  - [ ] Cookie consent banner
- [ ] WhatsApp Business terms accepted
- [ ] Google Places API terms followed

## ✅ User Experience

- [ ] Remove all console.log statements
- [ ] Add user-friendly error messages
- [ ] Add loading indicators
- [ ] Add empty states (no jobs, no history)
- [ ] Add success confirmations
- [ ] Test accessibility (screen readers, keyboard navigation)
- [ ] Add helpful tooltips/hints
- [ ] Spell check all user-facing text
- [ ] Verify Hebrew translations

## ✅ Business Continuity

- [ ] Document deployment process
- [ ] Create rollback procedure
- [ ] Test backup restoration
- [ ] Set up staging environment
- [ ] Create runbook for common issues
- [ ] Define on-call rotation
- [ ] Set up status page (status.yourdomain.com)

## ✅ Documentation

- [ ] README updated with deployment instructions
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Team has access to all services
- [ ] Credentials stored securely (1Password, Vault)
- [ ] Emergency contacts listed

## ✅ Pre-Launch Testing

### Smoke Test (30 minutes before launch)

1. [ ] Test login flow
2. [ ] Test booking creation
3. [ ] Test technician response
4. [ ] Test status updates
5. [ ] Test notifications
6. [ ] Verify monitoring is active
7. [ ] Check error tracking works

### Soft Launch

- [ ] Launch to small group of beta users
- [ ] Monitor for 24-48 hours
- [ ] Collect feedback
- [ ] Fix critical issues
- [ ] Optimize based on real usage

## ✅ Launch Day

### Morning Of

- [ ] Verify all systems operational
- [ ] Clear test data from production
- [ ] Send launch announcement (if applicable)
- [ ] Monitor dashboards continuously

### During Launch

- [ ] Watch error rates
- [ ] Monitor user sign-ups
- [ ] Check support channels
- [ ] Be ready to rollback if needed

### Post-Launch (First Week)

- [ ] Monitor daily active users
- [ ] Track conversion funnels
- [ ] Review error logs daily
- [ ] Collect user feedback
- [ ] Plan first patch based on findings

## Emergency Contacts

- **Technical Lead:** [Name, Phone, Email]
- **Database Admin:** [Supabase Support]
- **Hosting Support:** [Netlify Support]
- **On-Call Engineer:** [Name, Phone]

## Rollback Procedure

If critical issues arise:

1. **Immediate:**
   ```bash
   # Rollback to previous deploy in Netlify
   netlify rollback
   ```

2. **Database:**
   - Do NOT rollback database migrations
   - Apply forward-only fixes
   - Use Supabase point-in-time recovery if needed

3. **Communication:**
   - Update status page
   - Notify users via email/app notification
   - Post-mortem after resolution

## Post-Launch Optimization

Week 1-4 priorities:

- [ ] Analyze user behavior
- [ ] Identify bottlenecks
- [ ] Fix top user complaints
- [ ] Improve conversion rates
- [ ] Add missing features
- [ ] Optimize performance
- [ ] Scale infrastructure as needed

---

**Status:** [ ] NOT READY | [ ] READY FOR LAUNCH

**Last Updated:** [Date]

**Reviewed By:** [Name, Date]
