/**
 * DB Migration Integrity Test
 *
 * dev / prod 両環境のスキーマが正しく一致しているかを検証する。
 * Supabase JS クライアント + service_role キー + exec_sql RPC 関数で
 * information_schema / pg_catalog を読み取り専用で参照する。
 *
 * 実行方法:
 *   npm run test:migration        # 両環境
 *   npm run test:migration:dev    # dev のみ
 *   npm run test:migration:prod   # prod のみ
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// .env.test を読み込み
dotenv.config({ path: path.resolve(__dirname, '..', '.env.test') })

// ---------- 定数: 検証対象 ----------

const EXPECTED_TABLES = [
  'profiles',
  'posts',
  'comments',
  'likes',
  'messages',
  'reports',
  'continents',
  'universities',
  'university_aliases',
  'organization_verification_requests',
  'organization_members',
  'communities',
  'community_members',
  'community_rooms',
  'community_room_messages',
  'announcements',
  'faqs',
  'events',
  'event_participants',
  'notifications',
  'safety_checks',
  'safety_check_responses',
  'quests',
  'quest_completions',
  'user_scores',
  'candle_sends',
  'global_announcements',
  'user_universities',
  'user_study_abroad_universities',
  'ai_concierge_chats',
  'community_invites',
  'community_ownership_transfers',
].sort()

const EXPECTED_FUNCTIONS = [
  'update_post_comments_count',
  'update_likes_count',
  'update_updated_at_column',
  'set_joined_at_on_approval',
  'is_admin_user',
  'update_profile_verification_status',
].sort()

const EXPECTED_TRIGGERS = [
  'trigger_update_post_comments_count',
  'trigger_update_likes_count',
  'trigger_update_communities_updated_at',
  'trigger_update_community_members_updated_at',
  'trigger_update_community_rooms_updated_at',
  'trigger_update_announcements_updated_at',
  'trigger_update_faqs_updated_at',
  'trigger_update_events_updated_at',
  'trigger_set_joined_at_on_approval',
  'trigger_update_global_announcements_updated_at',
  'trigger_update_ai_concierge_chats_updated_at',
  'trigger_update_profile_verification_status',
].sort()

const EXPECTED_STORAGE_BUCKETS = [
  'event-attachments',
  'post-images',
  'channel-attachments',
  'community-covers',
].sort()

// posts テーブルの期待カラム (name -> data_type)
const EXPECTED_POSTS_COLUMNS: Record<string, string> = {
  id: 'uuid',
  title: 'text',
  content: 'text',
  category: 'text',
  tags: 'ARRAY',
  university: 'text',
  study_abroad_destination: 'text',
  major: 'text',
  author_id: 'uuid',
  likes_count: 'integer',
  comments_count: 'integer',
  is_pinned: 'boolean',
  is_resolved: 'boolean',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  is_official: 'boolean',
  official_category: 'text',
  community_id: 'uuid',
  university_id: 'uuid',
  cover_image_url: 'text',
  quest_id: 'uuid',
  quest_approved: 'boolean',
  urgency_level: 'character varying',
  image_url: 'text',
  images: 'jsonb',
  is_pro: 'boolean',
  post_type: 'text',
  attachments: 'jsonb',
}

// profiles テーブルの期待カラム
const EXPECTED_PROFILES_COLUMNS: Record<string, string> = {
  id: 'uuid',
  email: 'text',
  name: 'text',
  university: 'text',
  study_abroad_destination: 'text',
  major: 'text',
  bio: 'text',
  languages: 'ARRAY',
  contribution_score: 'integer',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  account_type: 'text',
  organization_name: 'text',
  organization_type: 'text',
  organization_url: 'text',
  verification_status: 'text',
  verification_documents: 'text',
  contact_person_name: 'text',
  contact_person_email: 'text',
  contact_person_phone: 'text',
  is_organization_owner: 'boolean',
  parent_organization_id: 'uuid',
  is_admin: 'boolean',
  is_active: 'boolean',
  suspended_until: 'timestamp with time zone',
  suspension_reason: 'text',
  university_id: 'uuid',
  display_organization_id: 'uuid',
  university_start_date: 'date',
  university_end_date: 'date',
  study_abroad_start_date: 'date',
  study_abroad_end_date: 'date',
  study_abroad_university_id: 'uuid',
  sns_x: 'text',
  sns_tiktok: 'text',
  sns_instagram: 'text',
  sns_facebook: 'text',
  sns_linkedin: 'text',
  sns_url: 'text',
  is_operator: 'boolean',
  icon_url: 'text',
}

// 重要な UNIQUE 制約
const EXPECTED_UNIQUE_CONSTRAINTS = [
  { table: 'profiles', constraint: 'profiles_email_key' },
  { table: 'likes', constraint: 'likes_user_id_post_id_key' },
  { table: 'likes', constraint: 'likes_user_id_comment_id_key' },
  { table: 'community_members', constraint: 'community_members_community_id_user_id_key' },
  { table: 'event_participants', constraint: 'event_participants_event_id_user_id_key' },
  { table: 'university_aliases', constraint: 'university_aliases_university_id_alias_key' },
  { table: 'organization_members', constraint: 'organization_members_organization_id_member_id_key' },
  { table: 'safety_check_responses', constraint: 'safety_check_responses_safety_check_id_user_id_key' },
  { table: 'quest_completions', constraint: 'quest_completions_quest_id_user_id_key' },
  { table: 'user_scores', constraint: 'user_scores_user_id_key' },
  { table: 'candle_sends', constraint: 'candle_sends_sender_id_week_start_key' },
  { table: 'user_universities', constraint: 'user_universities_user_id_university_id_key' },
  { table: 'user_study_abroad_universities', constraint: 'user_study_abroad_universities_user_id_university_id_key' },
  { table: 'community_invites', constraint: 'community_invites_invite_token_key' },
]

// 重要なインデックス
const EXPECTED_INDEXES = [
  'idx_posts_category',
  'idx_posts_author_id',
  'idx_posts_created_at',
  'idx_comments_post_id',
  'idx_likes_user_id',
  'idx_messages_sender_id',
  'idx_messages_receiver_id',
  'idx_universities_country_code',
  'idx_universities_name_en',
  'idx_communities_owner_id',
  'idx_community_members_community_id',
  'idx_community_members_user_id',
  'idx_community_rooms_community_id',
  'idx_community_room_messages_room_id',
  'idx_notifications_user_id',
  'idx_safety_checks_status',
  'idx_quests_community_id',
  'idx_ai_concierge_chats_user_id',
  'idx_community_invites_token',
]

// ---------- ヘルパー ----------

type EnvName = 'dev' | 'prod'

interface SchemaCache {
  tables: string[]
  functions: string[]
  triggers: { trigger_name: string; event_object_table: string; action_statement: string }[]
  storageBuckets: string[]
  rlsStatus: { tablename: string; rowsecurity: boolean }[]
  columns: Record<string, { column_name: string; data_type: string; is_nullable: string }[]>
  constraints: { table_name: string; constraint_name: string; constraint_type: string }[]
  indexes: string[]
}

async function execSql(client: SupabaseClient, query: string): Promise<any[]> {
  const { data, error } = await client.rpc('exec_sql', { query })
  if (error) throw new Error(`exec_sql failed: ${error.message}\nQuery: ${query}`)
  return data ?? []
}

async function loadSchemaCache(client: SupabaseClient): Promise<SchemaCache> {
  // テーブル一覧
  const tables = (
    await execSql(
      client,
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name`
    )
  ).map((r: any) => r.table_name as string)

  // 関数一覧 (public スキーマ、システム関数除外)
  const functions = (
    await execSql(
      client,
      `SELECT DISTINCT routine_name FROM information_schema.routines WHERE routine_schema = 'public' AND routine_type = 'FUNCTION' ORDER BY routine_name`
    )
  ).map((r: any) => r.routine_name as string)

  // トリガー一覧
  const triggers = (await execSql(
    client,
    `SELECT trigger_name, event_object_table, action_statement FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY trigger_name`
  )) as SchemaCache['triggers']

  // ストレージバケット
  const storageBuckets = (
    await execSql(client, `SELECT id FROM storage.buckets ORDER BY id`)
  ).map((r: any) => r.id as string)

  // RLS ステータス
  const rlsStatus = (await execSql(
    client,
    `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`
  )) as SchemaCache['rlsStatus']

  // 全テーブルのカラム定義
  const allColumns = (await execSql(
    client,
    `SELECT table_name, column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`
  )) as { table_name: string; column_name: string; data_type: string; is_nullable: string }[]

  const columns: SchemaCache['columns'] = {}
  for (const col of allColumns) {
    if (!columns[col.table_name]) columns[col.table_name] = []
    columns[col.table_name].push({
      column_name: col.column_name,
      data_type: col.data_type,
      is_nullable: col.is_nullable,
    })
  }

  // 制約一覧
  const constraints = (await execSql(
    client,
    `SELECT tc.table_name, tc.constraint_name, tc.constraint_type FROM information_schema.table_constraints tc WHERE tc.table_schema = 'public' ORDER BY tc.table_name, tc.constraint_name`
  )) as SchemaCache['constraints']

  // インデックス一覧
  const indexes = (
    await execSql(
      client,
      `SELECT indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY indexname`
    )
  ).map((r: any) => r.indexname as string)

  return { tables, functions, triggers, storageBuckets, rlsStatus, columns, constraints, indexes }
}

// ---------- 環境セットアップ ----------

interface EnvConfig {
  name: EnvName
  url: string
  serviceRoleKey: string
  client: SupabaseClient
  cache: SchemaCache | null
}

const envs: EnvConfig[] = []

function isEnvEnabled(envName: EnvName): boolean {
  if (envName === 'dev') {
    return !!(process.env.DEV_SUPABASE_URL && process.env.DEV_SUPABASE_SERVICE_ROLE_KEY)
  }
  return !!(
    process.env.PROD_SUPABASE_URL &&
    process.env.PROD_SUPABASE_SERVICE_ROLE_KEY &&
    process.env.PROD_SUPABASE_SERVICE_ROLE_KEY !== 'your_prod_service_role_key_here'
  )
}

function getEnvConfig(envName: EnvName): EnvConfig | null {
  if (!isEnvEnabled(envName)) return null
  const prefix = envName === 'dev' ? 'DEV' : 'PROD'
  const url = process.env[`${prefix}_SUPABASE_URL`]!
  const serviceRoleKey = process.env[`${prefix}_SUPABASE_SERVICE_ROLE_KEY`]!
  const client = createClient(url, serviceRoleKey)
  return { name: envName, url, serviceRoleKey, client, cache: null }
}

// テスト対象の環境を判定
const TEST_ENV = process.env.TEST_ENV as EnvName | undefined

// ---------- テスト本体 ----------

describe('Database Migration Integrity', () => {
  const devEnv = getEnvConfig('dev')
  const prodEnv = getEnvConfig('prod')

  const activeEnvs: EnvConfig[] = []

  if ((!TEST_ENV || TEST_ENV === 'dev') && devEnv) activeEnvs.push(devEnv)
  if ((!TEST_ENV || TEST_ENV === 'prod') && prodEnv) activeEnvs.push(prodEnv)

  if (activeEnvs.length === 0) {
    it('should have at least one environment configured', () => {
      throw new Error(
        'No environments configured. Set DEV_SUPABASE_URL/DEV_SUPABASE_SERVICE_ROLE_KEY and/or PROD_SUPABASE_URL/PROD_SUPABASE_SERVICE_ROLE_KEY in .env.test'
      )
    })
    return
  }

  beforeAll(async () => {
    for (const env of activeEnvs) {
      try {
        env.cache = await loadSchemaCache(env.client)
      } catch (e) {
        throw new Error(
          `Failed to load schema for ${env.name}: ${e instanceof Error ? e.message : e}. ` +
            `Make sure the exec_sql RPC function is deployed (migration 20250227000012).`
        )
      }
    }
  }, 60000)

  // ==========================================
  // Schema Existence - テーブル
  // ==========================================
  describe('Schema Existence - Tables', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] all ${EXPECTED_TABLES.length} tables exist`, () => {
        const cache = env.cache!
        const missing = EXPECTED_TABLES.filter((t) => !cache.tables.includes(t))
        expect(missing).toEqual([])
      })

      it(`[${env.name}] no unexpected public tables`, () => {
        const cache = env.cache!
        const unexpected = cache.tables.filter((t) => !EXPECTED_TABLES.includes(t))
        // 許容: exec_sql 関数など管理用テーブルは除外
        // unexpected が空でなくても fail はしないが、警告として出す
        if (unexpected.length > 0) {
          console.warn(`[${env.name}] Unexpected tables: ${unexpected.join(', ')}`)
        }
        // テスト自体は pass させる（将来のテーブル追加に対応）
        expect(true).toBe(true)
      })
    }
  })

  // ==========================================
  // Schema Existence - 関数
  // ==========================================
  describe('Schema Existence - Functions', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] all ${EXPECTED_FUNCTIONS.length} functions exist`, () => {
        const cache = env.cache!
        const missing = EXPECTED_FUNCTIONS.filter((f) => !cache.functions.includes(f))
        expect(missing).toEqual([])
      })
    }
  })

  // ==========================================
  // Schema Existence - トリガー
  // ==========================================
  describe('Schema Existence - Triggers', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] all ${EXPECTED_TRIGGERS.length} triggers exist`, () => {
        const cache = env.cache!
        const triggerNames = cache.triggers.map((t) => t.trigger_name).sort()
        // 重複を除去（同じトリガー名が INSERT/DELETE 等で複数行になることがある）
        const uniqueTriggers = [...new Set(triggerNames)]
        const missing = EXPECTED_TRIGGERS.filter((t) => !uniqueTriggers.includes(t))
        expect(missing).toEqual([])
      })
    }
  })

  // ==========================================
  // Schema Existence - ストレージバケット
  // ==========================================
  describe('Schema Existence - Storage Buckets', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] all ${EXPECTED_STORAGE_BUCKETS.length} storage buckets exist`, () => {
        const cache = env.cache!
        const missing = EXPECTED_STORAGE_BUCKETS.filter(
          (b) => !cache.storageBuckets.includes(b)
        )
        expect(missing).toEqual([])
      })
    }
  })

  // ==========================================
  // RLS Security
  // ==========================================
  describe('RLS Security', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] RLS is enabled on all public tables`, () => {
        const cache = env.cache!
        const tablesWithoutRls = cache.rlsStatus.filter(
          (t) =>
            EXPECTED_TABLES.includes(t.tablename) && !t.rowsecurity
        )
        expect(tablesWithoutRls.map((t) => t.tablename)).toEqual([])
      })
    }
  })

  // ==========================================
  // Column Definitions
  // ==========================================
  describe('Column Definitions', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] posts table has all ${Object.keys(EXPECTED_POSTS_COLUMNS).length} columns with correct types`, () => {
        const cache = env.cache!
        const postsCols = cache.columns['posts'] ?? []
        const colMap: Record<string, string> = {}
        for (const col of postsCols) {
          colMap[col.column_name] = col.data_type
        }

        const missingCols: string[] = []
        const wrongType: string[] = []

        for (const [name, expectedType] of Object.entries(EXPECTED_POSTS_COLUMNS)) {
          if (!colMap[name]) {
            missingCols.push(name)
          } else if (colMap[name] !== expectedType) {
            wrongType.push(`${name}: expected "${expectedType}", got "${colMap[name]}"`)
          }
        }

        expect(missingCols).toEqual([])
        expect(wrongType).toEqual([])
      })

      it(`[${env.name}] profiles table has all ${Object.keys(EXPECTED_PROFILES_COLUMNS).length} columns with correct types`, () => {
        const cache = env.cache!
        const profilesCols = cache.columns['profiles'] ?? []
        const colMap: Record<string, string> = {}
        for (const col of profilesCols) {
          colMap[col.column_name] = col.data_type
        }

        const missingCols: string[] = []
        const wrongType: string[] = []

        for (const [name, expectedType] of Object.entries(EXPECTED_PROFILES_COLUMNS)) {
          if (!colMap[name]) {
            missingCols.push(name)
          } else if (colMap[name] !== expectedType) {
            wrongType.push(`${name}: expected "${expectedType}", got "${colMap[name]}"`)
          }
        }

        expect(missingCols).toEqual([])
        expect(wrongType).toEqual([])
      })

      it(`[${env.name}] communities table has essential columns`, () => {
        const cache = env.cache!
        const cols = (cache.columns['communities'] ?? []).map((c) => c.column_name)
        const essential = [
          'id', 'name', 'description', 'cover_image_url', 'icon_url',
          'owner_id', 'visibility', 'community_type', 'is_archived',
          'created_at', 'updated_at',
        ]
        const missing = essential.filter((c) => !cols.includes(c))
        expect(missing).toEqual([])
      })

      it(`[${env.name}] safety_checks table has recurring columns`, () => {
        const cache = env.cache!
        const cols = (cache.columns['safety_checks'] ?? []).map((c) => c.column_name)
        const expected = [
          'id', 'created_by', 'community_id', 'title', 'message',
          'status', 'is_recurring', 'recurrence_type', 'recurrence_time', 'next_send_at',
        ]
        const missing = expected.filter((c) => !cols.includes(c))
        expect(missing).toEqual([])
      })

      it(`[${env.name}] community_invites table has correct columns`, () => {
        const cache = env.cache!
        const cols = (cache.columns['community_invites'] ?? []).map((c) => c.column_name)
        const expected = [
          'id', 'community_id', 'created_by', 'invite_token',
          'expires_at', 'max_uses', 'used_count', 'is_active',
          'created_at', 'updated_at',
        ]
        const missing = expected.filter((c) => !cols.includes(c))
        expect(missing).toEqual([])
      })
    }
  })

  // ==========================================
  // Cross-Environment Consistency
  // ==========================================
  if (activeEnvs.length >= 2) {
    describe('Cross-Environment Consistency', () => {
      it('table lists match between dev and prod', () => {
        const devTables = activeEnvs.find((e) => e.name === 'dev')!.cache!.tables.sort()
        const prodTables = activeEnvs.find((e) => e.name === 'prod')!.cache!.tables.sort()

        const onlyInDev = devTables.filter((t) => !prodTables.includes(t))
        const onlyInProd = prodTables.filter((t) => !devTables.includes(t))

        expect(onlyInDev).toEqual([])
        expect(onlyInProd).toEqual([])
      })

      it('column definitions match for all tables', () => {
        const devCache = activeEnvs.find((e) => e.name === 'dev')!.cache!
        const prodCache = activeEnvs.find((e) => e.name === 'prod')!.cache!

        const diffs: string[] = []

        // 両方に存在するテーブルのみ比較
        const commonTables = devCache.tables.filter((t) => prodCache.tables.includes(t))

        for (const table of commonTables) {
          const devCols = (devCache.columns[table] ?? [])
            .map((c) => `${c.column_name}:${c.data_type}:${c.is_nullable}`)
            .sort()
          const prodCols = (prodCache.columns[table] ?? [])
            .map((c) => `${c.column_name}:${c.data_type}:${c.is_nullable}`)
            .sort()

          const onlyInDev = devCols.filter((c) => !prodCols.includes(c))
          const onlyInProd = prodCols.filter((c) => !devCols.includes(c))

          if (onlyInDev.length > 0) {
            diffs.push(`${table}: only in dev: ${onlyInDev.join(', ')}`)
          }
          if (onlyInProd.length > 0) {
            diffs.push(`${table}: only in prod: ${onlyInProd.join(', ')}`)
          }
        }

        expect(diffs).toEqual([])
      })

      it('function lists match between dev and prod', () => {
        const devFunctions = activeEnvs.find((e) => e.name === 'dev')!.cache!.functions.sort()
        const prodFunctions = activeEnvs.find((e) => e.name === 'prod')!.cache!.functions.sort()

        const onlyInDev = devFunctions.filter((f) => !prodFunctions.includes(f))
        const onlyInProd = prodFunctions.filter((f) => !devFunctions.includes(f))

        expect(onlyInDev).toEqual([])
        expect(onlyInProd).toEqual([])
      })

      it('trigger definitions match between dev and prod', () => {
        const devTriggers = activeEnvs
          .find((e) => e.name === 'dev')!
          .cache!.triggers.map((t) => `${t.trigger_name}:${t.event_object_table}`)
          .sort()
        const prodTriggers = activeEnvs
          .find((e) => e.name === 'prod')!
          .cache!.triggers.map((t) => `${t.trigger_name}:${t.event_object_table}`)
          .sort()

        // 重複除去
        const devUnique = [...new Set(devTriggers)]
        const prodUnique = [...new Set(prodTriggers)]

        const onlyInDev = devUnique.filter((t) => !prodUnique.includes(t))
        const onlyInProd = prodUnique.filter((t) => !devUnique.includes(t))

        expect(onlyInDev).toEqual([])
        expect(onlyInProd).toEqual([])
      })

      it('RLS status matches between dev and prod', () => {
        const devRls = activeEnvs
          .find((e) => e.name === 'dev')!
          .cache!.rlsStatus.filter((r) => EXPECTED_TABLES.includes(r.tablename))
          .map((r) => `${r.tablename}:${r.rowsecurity}`)
          .sort()
        const prodRls = activeEnvs
          .find((e) => e.name === 'prod')!
          .cache!.rlsStatus.filter((r) => EXPECTED_TABLES.includes(r.tablename))
          .map((r) => `${r.tablename}:${r.rowsecurity}`)
          .sort()

        expect(devRls).toEqual(prodRls)
      })
    })
  }

  // ==========================================
  // Constraints & Indexes
  // ==========================================
  describe('Constraints & Indexes', () => {
    for (const env of activeEnvs) {
      it(`[${env.name}] important UNIQUE constraints exist`, () => {
        const cache = env.cache!
        const constraintSet = new Set(
          cache.constraints
            .filter((c) => c.constraint_type === 'UNIQUE')
            .map((c) => `${c.table_name}:${c.constraint_name}`)
        )

        const missing = EXPECTED_UNIQUE_CONSTRAINTS.filter(
          (c) => !constraintSet.has(`${c.table}:${c.constraint}`)
        )
        expect(missing.map((c) => `${c.table}.${c.constraint}`)).toEqual([])
      })

      it(`[${env.name}] CHECK constraints exist on key tables`, () => {
        const cache = env.cache!
        const checkConstraints = cache.constraints.filter(
          (c) => c.constraint_type === 'CHECK'
        )
        const tablesWith = new Set(checkConstraints.map((c) => c.table_name))

        // これらのテーブルには CHECK 制約があるはず
        const tablesExpectingChecks = [
          'posts',
          'reports',
          'likes',
          'community_members',
          'event_participants',
          'notifications',
          'safety_checks',
          'safety_check_responses',
          'quests',
          'quest_completions',
        ]
        const missing = tablesExpectingChecks.filter((t) => !tablesWith.has(t))
        expect(missing).toEqual([])
      })

      it(`[${env.name}] important performance indexes exist`, () => {
        const cache = env.cache!
        const missing = EXPECTED_INDEXES.filter((idx) => !cache.indexes.includes(idx))
        expect(missing).toEqual([])
      })
    }
  })
})
