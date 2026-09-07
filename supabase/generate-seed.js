const fs = require('fs');
const artists = JSON.parse(fs.readFileSync('C:/projetos/curso_arte/data/artists.json', 'utf8'));
const works = JSON.parse(fs.readFileSync('C:/projetos/curso_arte/data/works.json', 'utf8'));

function sqlValue(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'number') return String(v);
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function sqlJson(v) {
  if (v === null || v === undefined) return "'{}'::jsonb";
  return "'" + JSON.stringify(v).replace(/'/g, "''") + "'::jsonb";
}

function sqlTextArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "ARRAY[]::text[]";
  const items = arr.map(x => "'" + String(x).replace(/'/g, "''") + "'");
  return "ARRAY[" + items.join(",") + "]";
}

let sql = '';

sql += "INSERT INTO public.artists (id, name, type, role, status, title, area, subjects, image, bio, curriculum, social, advisor_id, approved_by, approved_at, moderator_votes, course, created_at, updated_at) VALUES\n";

const artistRows = artists.map(a => {
  const advisor_id = a.advisorId || a.advisor_id || null;
  const approved_by = a.approved_by || null;
  const approved_at = a.approved_at || null;
  const status = a.status || 'approved';
  const role = a.role || (a.type === 'advisor' ? 'orientador' : 'artista');
  return "(" + [
    sqlValue(a.id),
    sqlValue(a.name),
    sqlValue(a.type),
    sqlValue(role),
    sqlValue(status),
    sqlValue(a.title),
    sqlValue(a.area),
    sqlTextArray(a.subjects || []),
    sqlValue(a.image),
    sqlValue(a.bio),
    sqlValue(a.curriculum),
    sqlJson(a.social || {}),
    sqlValue(advisor_id),
    sqlValue(approved_by),
    sqlValue(approved_at),
    sqlValue(0),
    sqlValue(a.course),
    'now()',
    'now()'
  ].join(', ') + ")";
}).join(",\n");

sql += artistRows + "\n";
sql += "ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, type=EXCLUDED.type, role=EXCLUDED.role, status=EXCLUDED.status, title=EXCLUDED.title, area=EXCLUDED.area, subjects=EXCLUDED.subjects, image=EXCLUDED.image, bio=EXCLUDED.bio, curriculum=EXCLUDED.curriculum, social=EXCLUDED.social, advisor_id=EXCLUDED.advisor_id, updated_at=now();\n\n";

sql += "INSERT INTO public.works (id, artist_id, title, category, year, description, image, file_url, file_type, youtube_url, external_links, status, visibility, views, downloads, created_at, updated_at) VALUES\n";

const workRows = works.map(w => {
  const file_type = w.file_type || (w.category === 'video-arte' || w.category === 'documentario' ? 'video' : 'image');
  return "(" + [
    sqlValue(w.id),
    sqlValue(w.artistId),
    sqlValue(w.title),
    sqlValue(w.category),
    sqlValue(w.year || 2026),
    sqlValue(w.description),
    sqlValue(w.image),
    sqlValue(w.file_url || w.image || ''),
    sqlValue(file_type),
    sqlValue(w.youtube_url || ''),
    sqlJson(w.externalLinks || []),
    sqlValue(w.status || 'published'),
    sqlValue(w.visibility || 'public'),
    sqlValue(0),
    sqlValue(0),
    'now()',
    'now()'
  ].join(', ') + ")";
}).join(",\n");

sql += workRows + "\n";
sql += "ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, category=EXCLUDED.category, year=EXCLUDED.year, description=EXCLUDED.description, image=EXCLUDED.image, file_url=EXCLUDED.file_url, file_type=EXCLUDED.file_type, youtube_url=EXCLUDED.youtube_url, external_links=EXCLUDED.external_links, status=EXCLUDED.status, visibility=EXCLUDED.visibility, updated_at=now();\n";

fs.writeFileSync('C:/projetos/curso_arte/supabase/seed.sql', sql);
console.log('seed.sql gerado com sucesso');
