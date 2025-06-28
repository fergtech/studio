CREATE TABLE IF NOT EXISTS images (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by TEXT NOT NULL REFERENCES users(id),
    initiative_id TEXT REFERENCES initiatives(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
); 