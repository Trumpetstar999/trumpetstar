-- Delete test email log entries
DELETE FROM public.email_log
WHERE recipient_email IN ('test-debug@example.com', 'smtp-test-fix@example.com');

-- Delete test leads
DELETE FROM public.leads
WHERE email IN ('test-debug@example.com', 'smtp-test-fix@example.com');

-- Also clean up any queued emails for test leads
DELETE FROM public.email_queue
WHERE lead_id IN (
  SELECT id FROM public.leads WHERE email IN ('test-debug@example.com', 'smtp-test-fix@example.com')
);