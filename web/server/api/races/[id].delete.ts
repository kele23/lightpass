import { defineEventHandler, getRouterParam, HTTPError } from 'nitro/h3';
import { verifyAdministrator } from '../../utils/auth.ts';
import { useCouchAdmin } from '../../utils/couch.ts';

export default defineEventHandler(async (event) => {
  const user = await verifyAdministrator(event);
  const couch = useCouchAdmin(user.name, event);
  const id = getRouterParam(event, 'id');

  if (!id) {
    throw new HTTPError('Missing name', { status: 400 });
  }

  // 1. Delete the race database
  try {
    await couch.request(`/${id}`, { method: 'DELETE' });
  } catch (e) {
    console.warn(`Failed to delete race database ${id}:`, e);
    // We continue to try cleaning up the entry in lightpass-dbs
  }

  // 2. Delete the doc from lightpass-dbs
  try {
    // We need the revision to delete the document
    const doc = await couch.request(`/lightpass-dbs/${id}`);
    if (doc && doc._rev) {
      await couch.request(`/lightpass-dbs/${id}?rev=${doc._rev}`, { method: 'DELETE' });
    }
  } catch (e) {
    console.warn(`Failed to delete race info from lightpass-dbs ${id}:`, e);
    // If the doc doesn't exist, we consider it "deleted"
  }

  return { success: true };
});
