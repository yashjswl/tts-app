import { json } from '../../_lib/http.js';
import { publicUser } from '../../_lib/db.js';

export async function onRequestGet({ data }) {
  return json({ user: data.user ? publicUser(data.user) : null });
}
