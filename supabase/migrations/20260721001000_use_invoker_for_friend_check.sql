-- The function only needs the caller's existing RLS visibility over
-- friend_requests, so elevated SECURITY DEFINER privileges are unnecessary.
ALTER FUNCTION public.is_friend(uuid, uuid) SECURITY INVOKER;

