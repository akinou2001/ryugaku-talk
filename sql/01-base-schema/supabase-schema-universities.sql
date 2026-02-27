-- 大学マスターデータベーススキーマ

-- 大陸マスタテーブル
CREATE TABLE IF NOT EXISTS continents (
  id SERIAL PRIMARY KEY,
  name_en TEXT NOT NULL UNIQUE,
  name_ja TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 大学マスタテーブル
CREATE TABLE IF NOT EXISTS universities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  continent_id INTEGER REFERENCES continents(id),
  name_en TEXT NOT NULL,
  name_ja TEXT,
  city TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 大学エイリアステーブル（表記ゆれ・略称管理）
CREATE TABLE IF NOT EXISTS university_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE NOT NULL,
  alias TEXT NOT NULL,
  alias_type TEXT CHECK (alias_type IN ('abbreviation', 'variant', 'old_name', 'other')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(university_id, alias)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_universities_country_code ON universities(country_code);
CREATE INDEX IF NOT EXISTS idx_universities_continent_id ON universities(continent_id);
CREATE INDEX IF NOT EXISTS idx_universities_name_en ON universities(name_en);
CREATE INDEX IF NOT EXISTS idx_universities_name_ja ON universities(name_ja);
CREATE INDEX IF NOT EXISTS idx_university_aliases_university_id ON university_aliases(university_id);
CREATE INDEX IF NOT EXISTS idx_university_aliases_alias ON university_aliases(alias);

-- RLS (Row Level Security) ポリシー
ALTER TABLE continents ENABLE ROW LEVEL SECURITY;
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE university_aliases ENABLE ROW LEVEL SECURITY;

-- 大陸データは誰でも閲覧可能
CREATE POLICY "大陸データは誰でも閲覧可能" ON continents FOR SELECT USING (true);

-- 大学データは誰でも閲覧可能
CREATE POLICY "大学データは誰でも閲覧可能" ON universities FOR SELECT USING (true);

-- エイリアスデータは誰でも閲覧可能
CREATE POLICY "エイリアスデータは誰でも閲覧可能" ON university_aliases FOR SELECT USING (true);

-- 大陸マスタデータの初期投入
INSERT INTO continents (name_en, name_ja) VALUES
  ('North America', '北アメリカ'),
  ('Asia', 'アジア'),
  ('Europe', 'ヨーロッパ'),
  ('Oceania', 'オセアニア'),
  ('South America', '南アメリカ'),
  ('Africa', 'アフリカ')
ON CONFLICT (name_en) DO NOTHING;

