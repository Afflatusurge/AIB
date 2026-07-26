-- Legacy briefs did not store a trustworthy source publication timestamp.
-- Preserve their publication status, but do not present the site's own
-- publication time as if it came from the original source.

update public.briefs
set
  source_published_at = null,
  verification_status = 'legacy_unverified',
  confidence = coalesce(confidence, 'low'),
  editorial_flags = coalesce(editorial_flags, '{}'::jsonb)
    || jsonb_build_object(
      'legacy_source_date_unknown', true,
      'legacy_audited_at', now()
    )
where candidate_id is null
  and verification_status is null
  and source_kind is null;
