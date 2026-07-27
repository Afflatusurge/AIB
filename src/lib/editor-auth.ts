import { supabaseAdmin } from './supabase';
import { hashEditorToken } from './editor-token';

export { hashEditorToken } from './editor-token';

const TOKEN_PREFIX = 'aib_ed_';
const MIN_TOKEN_LENGTH = 32;

export interface EditorIdentity {
  keyId: string;
  name: string;
}

function readBearerToken(request: Request): string {
  const header = request.headers.get('authorization') || '';
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
}

export async function authenticateEditor(
  request: Request
): Promise<EditorIdentity | null> {
  const token = readBearerToken(request);
  if (!token.startsWith(TOKEN_PREFIX) || token.length < MIN_TOKEN_LENGTH) return null;

  const db = supabaseAdmin();
  const tokenHash = hashEditorToken(token);
  const { data, error } = await db
    .from('editor_access_keys')
    .select('id, name')
    .eq('token_hash', tokenHash)
    .eq('enabled', true)
    .maybeSingle();

  if (error) {
    console.error('[editor-auth] credential lookup failed:', error.message);
    return null;
  }
  if (!data) return null;

  const { error: touchError } = await db
    .from('editor_access_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id);
  if (touchError) {
    console.warn('[editor-auth] last-used update failed:', touchError.message);
  }

  return { keyId: data.id, name: data.name };
}
