-- ============================================================
-- 育英祭OS — Supabase スキーマ & サンプルデータ
-- ------------------------------------------------------------
-- 何度実行しても安全な idempotent / migration-safe スクリプトです。
-- Supabase ダッシュボード → SQL Editor に貼り付けて「Run」。
--
-- 設計方針:
--   - テーブルは create table if not exists で作成
--   - カラムは alter table ... add column if not exists で個別追加
--     （既存テーブルにも不足分を追加できる = migration-safe）
--   - 制約・ポリシーは drop if exists → 再作成（再実行可能）
--   - サンプルデータはテーブルが空のときだけ投入（再実行で重複しない）
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. shops テーブル（出店）
-- ════════════════════════════════════════════════════════════

-- テーブル本体（無ければ作成）
create table if not exists public.shops (
  id bigint generated always as identity primary key
);

-- カラム定義（既存テーブルにも不足分を追加。NOT NULL には default を付与）
alter table public.shops add column if not exists sort       integer     not null default 0;
alter table public.shops add column if not exists room       text        not null default '';
alter table public.shops add column if not exists name       text        not null default '';
alter table public.shops add column if not exists org        text        not null default '';
alter table public.shops add column if not exists category   text        not null default '';
alter table public.shops add column if not exists status     text        not null default 'normal';
alter table public.shops add column if not exists floor      text        not null default '1F';
alter table public.shops add column if not exists price      text;
alter table public.shops add column if not exists wait       text;
alter table public.shops add column if not exists comment    text;
alter table public.shops add column if not exists updated_at timestamptz not null default now();

-- status の値を制限（drop → add で再実行可能）
alter table public.shops drop constraint if exists shops_status_check;
alter table public.shops add  constraint shops_status_check
  check (status in ('free', 'normal', 'busy', 'soldout', 'closed'));


-- ════════════════════════════════════════════════════════════
-- 2. notices テーブル（お知らせ）
-- ════════════════════════════════════════════════════════════

create table if not exists public.notices (
  id bigint generated always as identity primary key
);

alter table public.notices add column if not exists level      text        not null default 'info';
alter table public.notices add column if not exists title      text        not null default '';
alter table public.notices add column if not exists body       text        not null default '';
alter table public.notices add column if not exists created_at timestamptz not null default now();

alter table public.notices drop constraint if exists notices_level_check;
alter table public.notices add  constraint notices_level_check
  check (level in ('info', 'important'));


-- ════════════════════════════════════════════════════════════
-- 3. Row Level Security
--    文化祭デモ用に anon（公開キー）からの読み書きを許可しています。
--    本番運用では書き込みを認証ユーザー限定に変更してください。
-- ════════════════════════════════════════════════════════════

alter table public.shops   enable row level security;
alter table public.notices enable row level security;

-- ポリシーは drop → create で再実行可能に
drop policy if exists "shops_public_read"     on public.shops;
drop policy if exists "shops_public_update"   on public.shops;
drop policy if exists "notices_public_read"   on public.notices;
drop policy if exists "notices_public_insert" on public.notices;

create policy "shops_public_read"
  on public.shops   for select using (true);
create policy "shops_public_update"
  on public.shops   for update using (true) with check (true);
create policy "notices_public_read"
  on public.notices for select using (true);
create policy "notices_public_insert"
  on public.notices for insert with check (true);


-- ════════════════════════════════════════════════════════════
-- 4. サンプルデータ
--    テーブルが空のときだけ投入するため、再実行しても重複しません。
--    insert の列順は上の add column の型定義と完全一致しています。
-- ════════════════════════════════════════════════════════════

-- shops（sort, room, name, org, category, status, floor, price, wait, comment）
insert into public.shops (sort, room, name, org, category, status, floor, price, wait, comment)
select v.sort, v.room, v.name, v.org, v.category, v.status, v.floor, v.price, v.wait, v.comment
from (values
  (1,  '1-A教室', '育英カレー食堂',     '3年3組',     'フード',   'busy',    '1F', '¥400', '約15分',       'スパイス香る本格カレー！'),
  (2,  '1-B教室', 'クレープ夢工房',     '2年4組',     'フード',   'normal',  '1F', '¥350', '約8分',        '20種類のトッピングから選べます'),
  (3,  '1-C教室', '射的屋台',           '1年3組',     'ゲーム',   'normal',  '1F', '¥300', '約3分',        '景品まだまだあります🎁'),
  (4,  '1-D教室', 'たこ焼きスタンド',   '3年5組',     'フード',   'soldout', '1F', '¥300', '—',            '本日分は完売しました'),
  (5,  '1-E教室', '焼きそば屋',         '2年1組',     'フード',   'normal',  '1F', '¥400', '約5分',        'ソース・塩から選べます'),
  (6,  '中庭',    'ラムネ釣り',         '1年1組',     'ゲーム',   'free',    '1F', '¥200', '約1分',        '今ならすぐ遊べます！'),
  (7,  '体育館',  '軽音ライブ',         '軽音部',     'ステージ', 'busy',    '1F', '無料', '次回 13:30〜', '人気バンドが続々登場'),
  (8,  '体育館',  'ダンスステージ',     'ダンス部',   'ステージ', 'closed',  '1F', '無料', '次回 14:00〜', '転換のため一時停止中'),
  (9,  '2-B教室', '書道作品展',         '書道部',     '展示',     'free',    '2F', '無料', '約1分',        '体験コーナーは随時受付中'),
  (10, '2-C教室', '科学マジックショー', '科学部',     '展示',     'normal',  '2F', '無料', '約10分',       '毎時30分にショー開催'),
  (11, '3-A教室', '鉄道ジオラマ展',     '鉄道研究部', '展示',     'free',    '3F', '無料', '約2分',        '毎時00分にデモ運行🚆'),
  (12, '3-B教室', 'VRゲーム体験',       'パソコン部', 'ゲーム',   'busy',    '3F', '¥500', '約20分',       '最新VRが体験できる'),
  (13, '3-C教室', '喫茶ノスタルジア',   '2年2組',     'ドリンク', 'normal',  '3F', '¥300', '約7分',        'レトロ空間でひと休み')
) as v (sort, room, name, org, category, status, floor, price, wait, comment)
where not exists (select 1 from public.shops);

-- notices（level, title, body, created_at）
insert into public.notices (level, title, body, created_at)
select v.level, v.title, v.body, v.created_at::timestamptz
from (values
  ('important', '体育館ステージ 10分遅れています', '軽音バンドの転換に時間がかかっており、次のステージ開始が10分遅れています。少々お待ちください。', '2026-05-19T12:40:00+09:00'),
  ('info',      '3年5組 たこ焼き 売り切れ',        '本日分のたこ焼きは完売しました。ご来場ありがとうございました！',                                   '2026-05-19T12:30:00+09:00'),
  ('info',      '落とし物のお知らせ',              '落とし物・忘れ物は職員室前のカウンターにて受付しております。',                                     '2026-05-19T11:00:00+09:00'),
  ('important', '迷子のお知らせ',                  '迷子になった場合は、近くのスタッフ（赤いスタッフTシャツ）にお声がけください。',                     '2026-05-19T10:30:00+09:00'),
  ('info',      '本日のスケジュール',              '10:00 開会式 / 11:00 各出店オープン / 13:30 軽音ライブ / 14:00 ダンスステージ / 15:30 閉会式',     '2026-05-19T09:00:00+09:00')
) as v (level, title, body, created_at)
where not exists (select 1 from public.notices);
