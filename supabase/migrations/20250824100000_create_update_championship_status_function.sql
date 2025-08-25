CREATE OR REPLACE FUNCTION public.update_championship_status(
    p_championship_id UUID,
    p_new_status public.championship_status
)
RETURNS TABLE(id UUID, tenant_id UUID, nome TEXT, status public.championship_status) AS $$
DECLARE
    v_tenant_id UUID;
    v_user_role public.app_role;
BEGIN
    -- First, get the tenant_id of the championship
    SELECT cs.tenant_id INTO v_tenant_id
    FROM public.championships cs
    WHERE cs.id = p_championship_id;

    -- If no championship is found, raise an exception
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Championship not found with id %', p_championship_id;
    END IF;

    -- Then, get the role of the current user for that tenant
    SELECT u.role INTO v_user_role
    FROM public.users u
    WHERE u.auth_user_id = auth.uid() AND u.tenant_id = v_tenant_id;

    -- Check if the user has the required role
    IF v_user_role NOT IN ('manager', 'co-manager') THEN
        RAISE EXCEPTION 'User does not have permission to update championship status.';
    END IF;

    -- If authorized, update the status
    UPDATE public.championships
    SET status = p_new_status,
        updated_at = NOW()
    WHERE championships.id = p_championship_id;

    -- Return the updated championship details
    RETURN QUERY
    SELECT cs.id, cs.tenant_id, cs.nome, cs.status
    FROM public.championships cs
    WHERE cs.id = p_championship_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_championship_status(UUID, public.championship_status) TO authenticated;