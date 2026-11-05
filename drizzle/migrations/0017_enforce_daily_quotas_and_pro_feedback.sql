CREATE OR REPLACE FUNCTION public.increment_daily_usage(p_user_id uuid, p_date_key text, p_type text)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_count integer; v_day text := to_char(now() AT TIME ZONE 'Europe/Vienna','YYYY-MM-DD');
BEGIN
 IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE='42501'; END IF;
 IF p_type NOT IN ('video','game') OR p_type IS NULL THEN RAISE EXCEPTION 'Invalid usage type'; END IF;
 IF p_date_key IS DISTINCT FROM v_day THEN RAISE EXCEPTION 'Invalid usage date'; END IF;
 IF public.can_access_plan('BASIC') THEN RETURN 0; END IF;
 INSERT INTO public.daily_usage(user_id,date_key,videos_started,games_started)
 VALUES(p_user_id,v_day,CASE WHEN p_type='video' THEN 1 ELSE 0 END,CASE WHEN p_type='game' THEN 1 ELSE 0 END)
 ON CONFLICT(user_id,date_key) DO UPDATE SET
 videos_started=daily_usage.videos_started+CASE WHEN p_type='video' THEN 1 ELSE 0 END,
 games_started=daily_usage.games_started+CASE WHEN p_type='game' THEN 1 ELSE 0 END, updated_at=now()
 WHERE CASE WHEN p_type='video' THEN daily_usage.videos_started ELSE daily_usage.games_started END < 3
 RETURNING CASE WHEN p_type='video' THEN daily_usage.videos_started ELSE daily_usage.games_started END INTO v_count;
 RETURN coalesce(v_count,4);
END $$;
REVOKE ALL ON FUNCTION public.increment_daily_usage(uuid,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.increment_daily_usage(uuid,text,text) TO authenticated;
CREATE POLICY daily_usage_no_client_insert ON public.daily_usage AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY daily_usage_no_client_update ON public.daily_usage AS RESTRICTIVE FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY daily_usage_no_client_delete ON public.daily_usage AS RESTRICTIVE FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE OR REPLACE FUNCTION public.feedback_access_allowed() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT auth.uid() IS NOT NULL AND public.can_access_plan('PRO'); $$;
REVOKE ALL ON FUNCTION public.feedback_access_allowed() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.feedback_access_allowed() TO authenticated;
CREATE OR REPLACE FUNCTION public.feedback_pair_allowed(p_chat uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT public.feedback_access_allowed() AND EXISTS(SELECT 1 FROM teacher_assignments a JOIN video_chat_participants s ON s.user_id=a.user_id AND s.chat_id=p_chat AND s.role='user' JOIN video_chat_participants t ON t.user_id=a.teacher_id AND t.chat_id=p_chat AND t.role='teacher' WHERE a.is_active AND auth.uid() IN (a.user_id,a.teacher_id) AND a.user_id<>a.teacher_id AND (SELECT count(*) FROM video_chat_participants WHERE chat_id=p_chat)=2)
$$;
CREATE OR REPLACE FUNCTION public.feedback_inbox() RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); result jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF NOT public.feedback_access_allowed() THEN RAISE EXCEPTION 'PRO membership required' USING ERRCODE='42501'; END IF;
 SELECT coalesce(jsonb_agg(jsonb_build_object('studentId',a.user_id,'teacherId',a.teacher_id,'name',coalesce(p.display_name,'—'),'avatar',p.avatar_url,'chatId',c.id,'preview',m.content,'updatedAt',m.created_at,'unread',coalesce(u.n,0)) ORDER BY m.created_at DESC NULLS LAST),'[]'::jsonb) INTO result
 FROM teacher_assignments a JOIN profiles p ON p.id=CASE WHEN a.teacher_id=uid THEN a.user_id ELSE a.teacher_id END
 LEFT JOIN LATERAL (SELECT vc.id FROM video_chats vc WHERE vc.context_type='teacher_chat' AND EXISTS(SELECT 1 FROM video_chat_participants WHERE chat_id=vc.id AND user_id=a.user_id AND role='user') AND EXISTS(SELECT 1 FROM video_chat_participants WHERE chat_id=vc.id AND user_id=a.teacher_id AND role='teacher') AND (SELECT count(*) FROM video_chat_participants WHERE chat_id=vc.id)=2 ORDER BY vc.created_at LIMIT 1) c ON true
 LEFT JOIN LATERAL (SELECT content,created_at FROM video_chat_messages WHERE chat_id=c.id ORDER BY created_at DESC LIMIT 1) m ON true
 LEFT JOIN LATERAL (SELECT count(*) n FROM video_chat_messages WHERE chat_id=c.id AND NOT is_read AND sender_user_id<>uid) u ON true
 WHERE a.is_active AND uid IN (a.teacher_id,a.user_id) AND a.teacher_id<>a.user_id;
 RETURN jsonb_build_object('teacher',EXISTS(SELECT 1 FROM teacher_assignments WHERE teacher_id=uid AND is_active),'contacts',result);
END $$;
CREATE OR REPLACE FUNCTION public.feedback_thread(p_student uuid,p_content text DEFAULT NULL,p_before timestamptz DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE uid uuid:=auth.uid(); teacher uuid; cid uuid; result jsonb;
BEGIN
 IF uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
 IF NOT public.feedback_access_allowed() THEN RAISE EXCEPTION 'PRO membership required' USING ERRCODE='42501'; END IF;
 SELECT teacher_id INTO teacher FROM teacher_assignments WHERE user_id=p_student AND is_active AND uid IN(user_id,teacher_id) AND user_id<>teacher_id;
 IF teacher IS NULL THEN RAISE EXCEPTION 'Forbidden'; END IF;
 IF p_content IS NOT NULL AND (length(trim(p_content))=0 OR length(p_content)>5000) THEN RAISE EXCEPTION 'Invalid message'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(p_student::text||teacher::text,0));
 SELECT c.id INTO cid FROM video_chats c WHERE c.context_type='teacher_chat' AND EXISTS(SELECT 1 FROM video_chat_participants WHERE chat_id=c.id AND user_id=p_student AND role='user') AND EXISTS(SELECT 1 FROM video_chat_participants WHERE chat_id=c.id AND user_id=teacher AND role='teacher') AND (SELECT count(*) FROM video_chat_participants WHERE chat_id=c.id)=2 ORDER BY c.created_at LIMIT 1;
 IF cid IS NULL THEN
 INSERT INTO video_chats(context_type,created_by) VALUES('teacher_chat',uid) RETURNING id INTO cid;
 INSERT INTO video_chat_participants(chat_id,user_id,role) VALUES(cid,p_student,'user'),(cid,teacher,'teacher');
 END IF;
 IF p_content IS NOT NULL THEN
 INSERT INTO video_chat_messages(chat_id,sender_user_id,sender_role,message_type,content) VALUES(cid,uid,CASE WHEN uid=teacher THEN 'teacher' ELSE 'user' END,'text',trim(p_content));
 UPDATE video_chats SET updated_at=now() WHERE id=cid;
 END IF;
 UPDATE video_chat_messages SET is_read=true WHERE chat_id=cid AND sender_user_id<>uid AND NOT is_read;
 SELECT coalesce(jsonb_agg(to_jsonb(m) ORDER BY m.created_at),'[]'::jsonb) INTO result FROM (SELECT id,sender_user_id,content,message_type,video_storage_path,created_at,is_read FROM video_chat_messages WHERE chat_id=cid AND (p_before IS NULL OR created_at<p_before) ORDER BY created_at DESC LIMIT 50) m;
 RETURN jsonb_build_object('chatId',cid,'messages',result);
END $$;