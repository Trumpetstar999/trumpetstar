CREATE OR REPLACE FUNCTION public.feedback_video_upload_allowed(p_path text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF p_path IS NULL OR p_path !~ '^feedback/[0-9a-f-]{36}/[0-9a-f-]{36}/[0-9a-f-]{36}\.(mp4|mov|webm|m4v)$' THEN RETURN false; END IF;
 RETURN split_part(p_path,'/',3)=auth.uid()::text AND EXISTS(SELECT 1 FROM public.video_chats c WHERE c.id::text=split_part(p_path,'/',2) AND c.context_type='teacher_chat' AND public.feedback_pair_allowed(c.id));
END $$;
CREATE OR REPLACE FUNCTION public.feedback_video_read_allowed(p_path text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT EXISTS(SELECT 1 FROM public.video_chat_messages m JOIN public.video_chats c ON c.id=m.chat_id WHERE m.video_storage_path=p_path AND c.context_type='teacher_chat' AND c.id::text=split_part(p_path,'/',2) AND public.feedback_pair_allowed(c.id));
$$;
REVOKE ALL ON FUNCTION public.feedback_video_upload_allowed(text), public.feedback_video_read_allowed(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.feedback_video_upload_allowed(text), public.feedback_video_read_allowed(text) TO authenticated, service_role;
CREATE POLICY "Feedback video upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK(bucket_id='feedback-videos' AND public.feedback_video_upload_allowed(name) AND lower(coalesce(metadata->>'mimetype','')) IN ('video/mp4','video/quicktime','video/webm','video/x-m4v') AND coalesce((metadata->>'size')::bigint,0) BETWEEN 1 AND 52428800);
CREATE POLICY "Feedback video read" ON storage.objects FOR SELECT TO authenticated USING(bucket_id='feedback-videos' AND public.feedback_video_read_allowed(name));
CREATE POLICY "Feedback pending video cleanup" ON storage.objects FOR DELETE TO authenticated USING(bucket_id='feedback-videos' AND public.feedback_video_upload_allowed(name) AND NOT EXISTS(SELECT 1 FROM public.video_chat_messages m WHERE m.video_storage_path=name));
CREATE OR REPLACE FUNCTION public.feedback_send_video(p_student uuid, p_path text, p_content text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE t jsonb; cid uuid; teacher uuid; old_message public.video_chat_messages; obj record;
BEGIN
 t:=public.feedback_thread(p_student); cid:=(t->>'chatId')::uuid;
 IF NOT public.feedback_video_upload_allowed(p_path) OR split_part(p_path,'/',2)<>cid::text THEN RAISE EXCEPTION 'Forbidden video' USING ERRCODE='42501'; END IF;
 IF length(coalesce(p_content,''))>5000 THEN RAISE EXCEPTION 'Invalid message'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_path,0));
 SELECT * INTO old_message FROM public.video_chat_messages WHERE video_storage_path=p_path LIMIT 1;
 IF FOUND THEN
  IF old_message.chat_id<>cid OR old_message.sender_user_id<>auth.uid() THEN RAISE EXCEPTION 'Forbidden video' USING ERRCODE='42501'; END IF;
  RETURN public.feedback_thread(p_student);
 END IF;
 SELECT metadata INTO obj FROM storage.objects WHERE bucket_id='feedback-videos' AND name=p_path FOR SHARE;
 IF NOT FOUND OR lower(coalesce(obj.metadata->>'mimetype','')) NOT IN ('video/mp4','video/quicktime','video/webm','video/x-m4v') OR coalesce((obj.metadata->>'size')::bigint,0) NOT BETWEEN 1 AND 52428800 THEN RAISE EXCEPTION 'Invalid video'; END IF;
 SELECT teacher_id INTO teacher FROM public.teacher_assignments WHERE user_id=p_student AND is_active AND auth.uid() IN(user_id,teacher_id);
 INSERT INTO public.video_chat_messages(chat_id,sender_user_id,sender_role,message_type,content,video_storage_path) VALUES(cid,auth.uid(),CASE WHEN auth.uid()=teacher THEN 'teacher' ELSE 'user' END,'video',nullif(trim(p_content),''),p_path);
 UPDATE public.video_chats SET updated_at=now() WHERE id=cid;
 RETURN public.feedback_thread(p_student);
END $$;
REVOKE ALL ON FUNCTION public.feedback_send_video(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.feedback_send_video(uuid,text,text) TO authenticated, service_role;