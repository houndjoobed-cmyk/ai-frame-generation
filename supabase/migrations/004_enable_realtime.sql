-- Enable Realtime replication for notifications and ai_credits tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_credits;
