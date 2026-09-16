import { load } from 'cheerio';
export const normalizeGroup = value => String(value || '').normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
export function groupListingUrl(origin, make, model, page) {
  return `${origin}/stock-list?${new URLSearchParams({country:'Japan',make,maker:model,perPage:'10',page:String(page)})}`;
}
export async function* rotateGroups({ makes, modelsFor, cursor = {} }) {
  let cycle = Number.isInteger(cursor.cycle) && cursor.cycle > 0 ? cursor.cycle : 1;
  const start = Math.max(0, makes.indexOf(cursor.make));
  let initial = true;
  const models = new Map();
  for (;;) {
    let addedThisRound = 0;
    for (let i = initial ? start : 0; i < makes.length; i++) {
      const make = makes[i];
      if (!models.has(make)) models.set(make, await modelsFor(make));
      const names = models.get(make);
      const first = initial && make === cursor.make ? Math.max(0, names.indexOf(cursor.model)) : 0;
      for (let j = first; j < names.length; j++) {
        const accepted = initial && make === cursor.make && names[j] === cursor.model ? Math.min(5, Math.max(0, Number(cursor.accepted) || 0)) : 0;
        const page = initial && make === cursor.make && names[j] === cursor.model ? Math.max(1, Number(cursor.page) || 1) : 1;
        const turn = {make,model:names[j],cycle,accepted,page};
        yield turn;
        addedThisRound += turn.accepted - accepted;
      }
    }
    // A resumed partial round must still allow a complete round from the beginning.
    if (!addedThisRound && !(initial && cursor.make)) return;
    initial = false; cycle++;
  }
}
export function readMakes(payload) {
  if (typeof payload.data !== 'string') throw new Error('Invalid source make catalog.');
  const $ = load(payload.data);
  return [...new Set($('option[value]').map((_,v)=>$(v).attr('value').trim()).get().filter(Boolean))];
}
export function readModels(payload) {
  if (!Array.isArray(payload.data)) throw new Error('Invalid source model catalog.');
  return [...new Set(payload.data.map(v=>typeof v.value === 'string' ? v.value.trim() : '').filter(Boolean))];
}
