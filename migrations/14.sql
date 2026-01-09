-- Add attachment support to community_messages
ALTER TABLE community_messages ADD COLUMN attachment_type TEXT;
ALTER TABLE community_messages ADD COLUMN attachment_url TEXT;
ALTER TABLE community_messages ADD COLUMN attachment_name TEXT;
ALTER TABLE community_messages ADD COLUMN attachment_size INTEGER;

-- Add attachment support to pod_messages
ALTER TABLE pod_messages ADD COLUMN attachment_type TEXT;
ALTER TABLE pod_messages ADD COLUMN attachment_url TEXT;
ALTER TABLE pod_messages ADD COLUMN attachment_name TEXT;
ALTER TABLE pod_messages ADD COLUMN attachment_size INTEGER;

