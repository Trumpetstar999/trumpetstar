

## Plan: Freunde finden, Sterneranking und Datenschutz-Einstellung

### Was wird gebaut

1. **Freunde finden** -- Suche nach anderen Nutzern (nur offentliche Profile), Freundschaftsanfragen senden/annehmen/ablehnen, Freundesliste anzeigen
2. **Offentliches Sterneranking** -- Top-20 aller offentlichen Nutzer nach Gesamtsternen
3. **Freunde-Sterneranking** -- Ranking nur unter akzeptierten Freunden
4. **Profil-Datenschutz-Einstellung** -- Toggle im Profil-Bearbeiten-Dialog: offentlich (alle konnen dich sehen/finden) vs. privat (unsichtbar in Suche und Rankings)

### Datenbank

Keine neuen Tabellen notig. Es existieren bereits:
- `profiles` mit `privacy_setting` (default: 'private')
- `friendships` mit `requester_id`, `addressee_id`, `status` und passenden RLS-Policies

Benotigte RLS-Anderung:
- **Neue SELECT-Policy auf `profiles`**: Authentifizierte Nutzer konnen Profile lesen, bei denen `privacy_setting = 'public'` ist (fur die Suche und das offentliche Ranking). Die eigene Zeile bleibt immer lesbar.
- **Neue SELECT-Policy auf `video_completions`**: Aggregierter Lesezugriff fur offentliche Rankings -- hier wird eine DB-Funktion `get_public_star_ranking()` als SECURITY DEFINER erstellt, die die Sterne zahlt und nur offentliche Profile zuruckgibt. Gleiches fur `get_friends_star_ranking(user_id)`.

Migration:
```sql
-- Allow reading public profiles
CREATE POLICY "Authenticated can read public profiles"
ON public.profiles FOR SELECT TO authenticated
USING (privacy_setting = 'public' OR id = auth.uid());

-- Function: public star ranking
CREATE OR REPLACE FUNCTION public.get_public_star_ranking()
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, star_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, COUNT(vc.id) as star_count
  FROM profiles p
  LEFT JOIN video_completions vc ON vc.user_id = p.id
  WHERE p.privacy_setting = 'public'
  GROUP BY p.id
  ORDER BY star_count DESC
  LIMIT 20;
$$;

-- Function: friends star ranking
CREATE OR REPLACE FUNCTION public.get_friends_star_ranking(_user_id uuid)
RETURNS TABLE(user_id uuid, display_name text, avatar_url text, star_count bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, p.display_name, p.avatar_url, COUNT(vc.id) as star_count
  FROM profiles p
  LEFT JOIN video_completions vc ON vc.user_id = p.id
  WHERE p.id = _user_id
     OR p.id IN (
       SELECT CASE WHEN requester_id = _user_id THEN addressee_id ELSE requester_id END
       FROM friendships
       WHERE (requester_id = _user_id OR addressee_id = _user_id) AND status = 'accepted'
     )
  GROUP BY p.id
  ORDER BY star_count DESC
  LIMIT 50;
$$;
```

### Neue Komponenten

1. **`src/components/social/FriendSearch.tsx`**
   - Textfeld zur Namenssuche, fragt `profiles` mit `privacy_setting = 'public'` ab
   - Zeigt Avatar + Name + "Anfrage senden"-Button
   - Verhindert doppelte Anfragen

2. **`src/components/social/FriendsList.tsx`**
   - Zeigt akzeptierte Freunde und offene Anfragen (eingehend/ausgehend)
   - Annehmen/Ablehnen/Entfernen-Aktionen

3. **`src/components/social/StarRanking.tsx`**
   - Tabs: "Offentlich" / "Freunde"
   - Ruft `get_public_star_ranking()` bzw. `get_friends_star_ranking(user_id)` auf
   - Zeigt Rang, Avatar, Name, Sternezahl
   - Eigene Position hervorgehoben

4. **`src/components/social/SocialPage.tsx`** (oder als neue Dashboard-Widgets)
   - Kombiniert FriendSearch, FriendsList und StarRanking

### Integration ins Profil

- **ProfileWidget**: Neuer Button "Freunde & Ranking" der ein Dialog/Sheet offnet mit den Social-Komponenten
- **EditProfileDialog**: Neuer Switch "Offentliches Profil" der `privacy_setting` zwischen 'public' und 'private' toggled
- Alternativ: Neue Dashboard-Widgets `friends` und `star-ranking` hinzufugen

### Dateien die geandert werden

| Datei | Anderung |
|-------|----------|
| `src/components/profile/EditProfileDialog.tsx` | Privacy-Toggle hinzufugen |
| `src/components/dashboard/widgets/ProfileWidget.tsx` | Social-Button hinzufugen |
| `src/components/social/FriendSearch.tsx` | Neu |
| `src/components/social/FriendsList.tsx` | Neu |
| `src/components/social/StarRanking.tsx` | Neu |
| `src/components/social/SocialDialog.tsx` | Neu -- Hauptcontainer mit Tabs |
| `src/hooks/useDashboardLayout.tsx` | Ggf. neues Widget-ID |
| DB-Migration | RLS Policy + 2 Funktionen |

