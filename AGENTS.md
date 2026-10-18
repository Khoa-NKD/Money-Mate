# MoneyMate Coding Rules

- Use single quotes for strings in TypeScript.
- Place React components under src/components.
- Every Supabase table MUST enable RLS.
- RLS policies MUST use (select auth.uid()), never bare auth.uid().
- INSERT/UPDATE policies MUST include a WITH CHECK clause.
- NEVER put service_role key in frontend or any VITE_ variable.
