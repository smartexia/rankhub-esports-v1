CREATE TYPE public.processing_status AS ENUM ('pending', 'processing', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS public.match_prints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    processing_status public.processing_status DEFAULT 'pending',
    gemini_result JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE
);

ALTER TABLE public.match_prints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable access for authenticated users based on tenant"
ON public.match_prints
FOR ALL
TO authenticated
USING (
  (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_user_id = auth.uid()) AND (users.tenant_id = match_prints.tenant_id))))
)
WITH CHECK (
  (EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.auth_user_id = auth.uid()) AND (users.tenant_id = match_prints.tenant_id))))
);

CREATE POLICY "Allow service_role to bypass RLS"
ON public.match_prints
FOR ALL
USING (auth.role() = 'service_role');