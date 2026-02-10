/*
  # Deprecate consortium_groups table

  ## Reason
  The `consortium_groups` table is a duplicate of `groups` with fewer fields.
  - `groups` has: name, description, asset_value, monthly_value, total_quotas, admin_id, company_id, adjustment_type, adjustment_value, is_active
  - `consortium_groups` has: description, asset_value, monthly_value, total_quotas (subset)

  All application code uses the `groups` table. The `consortium_groups` table
  has zero references in any API route, hook, or component.

  ## Action
  Mark as deprecated. Data preserved for safety. Can be dropped in a future migration.
*/

COMMENT ON TABLE public.consortium_groups IS 'DEPRECATED: Use public.groups instead. This table is a legacy duplicate and will be removed in a future migration.';
