-- rls_check.sql – checks the security rules (plan, phase 2).
-- Run it in Supabase -> SQL Editor (or: npx supabase db query -f supabase/tests/rls_check.sql --linked).
-- It creates two temporary test accounts, runs the checks and deletes everything again.
-- Result: a table with one row per check; the "ok" column must be true everywhere.

create temp table if not exists rls_results (nr int, test text, expected text, actual text, ok boolean);
truncate rls_results;

do $$
declare
  v_seller uuid := gen_random_uuid();
  v_buyer uuid := gen_random_uuid();
  v_listing uuid;
  v_n int;
  v_text text;
  v_phone text;
  v_imei text;
  r text[] := '{}';
  -- each entry: test | expected | actual
begin
  -- ---------- setup (as postgres) ----------
  insert into auth.users (id, email, raw_user_meta_data, aud, role)
  values
    (v_seller, 'rls-seller-' || v_seller || '@example.invalid', '{"display_name":"Test Seller"}', 'authenticated', 'authenticated'),
    (v_buyer, 'rls-buyer-' || v_buyer || '@example.invalid', '{"display_name":"Test Buyer"}', 'authenticated', 'authenticated');

  update public.profile_private set phone = '+37360000000' where user_id = v_seller;

  insert into public.listings (user_id, category_id, title, price, locality_id, condition, attributes)
  values (v_seller, 1, 'Test iPhone RLS', 1000, 1, 'used', '{"brand":"Apple"}')
  returning id into v_listing;

  insert into public.listing_private (listing_id, imei) values (v_listing, '490154203237518');

  -- ---------- 1) visitor (not logged in) ----------
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;

  select count(*) into v_n from public.listings where id = v_listing;
  r := r || array['Vizitator: vede anunțul activ', '1', v_n::text];

  select count(*) into v_n from public.profiles where id = v_seller;
  r := r || array['Vizitator: vede profilul public', '1', v_n::text];

  begin
    select count(*) into v_n from public.profile_private;
    v_text := 'a citit ' || v_n || ' rânduri';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Vizitator: NU citește telefoanele (profile_private)', 'acces refuzat', v_text];

  begin
    select count(*) into v_n from public.listing_private;
    v_text := 'a citit ' || v_n || ' rânduri';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Vizitator: NU citește IMEI/VIN (listing_private)', 'acces refuzat', v_text];

  begin
    select phone, imei into v_phone, v_imei from public.get_listing_contact(v_listing);
    v_text := 'a primit ' || coalesce(v_phone, '-') || ' / ' || coalesce(v_imei, '-');
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Vizitator: NU primește telefon/IMEI prin get_listing_contact', 'acces refuzat', v_text];

  begin
    insert into public.listings (user_id, category_id, title, price, locality_id, condition)
    values (v_seller, 1, 'Hack', 1, 1, 'new');
    v_text := 'a reușit';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Vizitator: NU poate publica anunțuri', 'acces refuzat', v_text];

  reset role;

  -- ---------- 2) another logged-in user (buyer) ----------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_buyer, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select count(*) into v_n from public.profile_private where user_id = v_seller;
  r := r || array['Cumpărător: NU citește direct telefonul vânzătorului', '0', v_n::text];

  select count(*) into v_n from public.listing_private where listing_id = v_listing;
  r := r || array['Cumpărător: NU citește direct IMEI-ul', '0', v_n::text];

  select phone, imei into v_phone, v_imei from public.get_listing_contact(v_listing);
  r := r || array['Cumpărător: primește telefonul prin „Arată telefonul”', '+37360000000', coalesce(v_phone, '-')];
  r := r || array['Cumpărător: primește IMEI-ul prin „Arată telefonul”', '490154203237518', coalesce(v_imei, '-')];

  begin
    update public.listings set price = 1 where id = v_listing;
    get diagnostics v_n = row_count;
    v_text := v_n || ' rânduri modificate';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Cumpărător: NU poate modifica anunțul altcuiva', '0 rânduri modificate', v_text];

  begin
    update public.profiles set role = 'admin' where id = v_buyer;
    v_text := 'a reușit';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Cumpărător: NU își poate da singur rol de admin', 'acces refuzat', v_text];

  -- added in phase 8 (0016): reporting used to fail with "infinite recursion detected in policy"
  begin
    insert into public.reports (reporter_id, listing_id, reason) values (v_buyer, v_listing, 'scam');
    v_text := 'raportare trimisă';
  exception when others then
    v_text := sqlerrm;
  end;
  r := r || array['Cumpărător: poate raporta un anunț', 'raportare trimisă', v_text];

  select count(*) into v_n from public.reports;
  r := r || array['Cumpărător: NU citește raportările (doar adminii)', '0', v_n::text];

  -- added in 0017 ("Contul meu"): the buyer saves the listing; only the seller sees the number
  insert into public.favorites (user_id, listing_id) values (v_buyer, v_listing);
  select count(*) into v_n from public.my_listing_saves();
  r := r || array['Cumpărător: NU vede salvările anunțurilor altcuiva', '0', v_n::text];

  begin
    update public.profiles set avatar_path = v_seller || '/' || gen_random_uuid() || '.webp' where id = v_buyer;
    v_text := 'a reușit';
  exception when check_violation then
    v_text := 'refuzat';
  end;
  r := r || array['Cumpărător: NU poate folosi poza din dosarul altcuiva', 'refuzat', v_text];

  -- added in 0018 (security): the log of opened phone numbers is internal
  begin
    select count(*) into v_n from public.contact_reveals;
    v_text := 'a citit';
  exception when insufficient_privilege then
    v_text := 'acces refuzat';
  end;
  r := r || array['Cumpărător: NU citește jurnalul telefoanelor deschise', 'acces refuzat', v_text];

  begin
    perform public.delete_my_account();
    v_text := 'cont șters';
  exception when insufficient_privilege then
    v_text := sqlerrm;
  end;
  r := r || array['Ștergere cont fără parolă introdusă recent: refuzată', 'REAUTH_REQUIRED', v_text];

  reset role;

  -- ---------- 3) anti-spam: new account, max 3 listings in 24h ----------
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_seller, 'role', 'authenticated')::text, true);
  set local role authenticated;

  -- the seller already has 1 listing; 2 more are allowed, the 4th must be refused
  insert into public.listings (user_id, category_id, title, price, locality_id, condition)
  values (v_seller, 1, 'Test 2', 10, 1, 'new'), (v_seller, 1, 'Test 3', 10, 1, 'new');

  begin
    insert into public.listings (user_id, category_id, title, price, locality_id, condition)
    values (v_seller, 1, 'Test 4', 10, 1, 'new');
    v_text := 'a fost publicat';
  exception when raise_exception then
    v_text := sqlerrm;
  end;
  r := r || array['Cont nou: al 4-lea anunț în 24h este refuzat', 'LISTING_LIMIT_REACHED', v_text];

  select coalesce(sum(saves), 0) into v_n from public.my_listing_saves();
  r := r || array['Vânzător: vede câte salvări are anunțul său', '1', v_n::text];

  reset role;

  -- ---------- 4) delete account (0018): password login older than 10 minutes / just now ----------
  perform set_config('request.jwt.claims', json_build_object(
    'sub', v_buyer, 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'password',
      'timestamp', extract(epoch from now())::bigint - 3600)))::text, true);
  set local role authenticated;
  begin
    perform public.delete_my_account();
    v_text := 'cont șters';
  exception when insufficient_privilege then
    v_text := sqlerrm;
  end;
  r := r || array['Ștergere cont cu parola introdusă acum o oră: refuzată', 'REAUTH_REQUIRED', v_text];
  reset role;

  perform set_config('request.jwt.claims', json_build_object(
    'sub', v_buyer, 'role', 'authenticated',
    'amr', json_build_array(json_build_object('method', 'password',
      'timestamp', extract(epoch from now())::bigint)))::text, true);
  set local role authenticated;
  begin
    perform public.delete_my_account();
    v_text := 'cont șters';
  exception when others then
    v_text := sqlerrm;
  end;
  r := r || array['Ștergere cont cu parola introdusă chiar acum: reușește', 'cont șters', v_text];
  reset role;

  -- ---------- cleanup ----------
  delete from auth.users where id in (v_seller, v_buyer);

  for i in 1 .. array_length(r, 1) / 3 loop
    insert into rls_results values (
      i, r[i * 3 - 2], r[i * 3 - 1], r[i * 3], r[i * 3 - 1] = r[i * 3]);
  end loop;
end;
$$;

select nr, test, expected as asteptat, actual as obtinut, ok from rls_results order by nr;
