/**
 * Tiny key-value store for the hero Studio (saved config, unlock flag),
 * backed by a JSON file in the app's document directory via expo-file-system.
 */
const FILE_NAME = 'hero-studio.json';

function file() {
  const { File, Paths } = require('expo-file-system');
  return new File(Paths.document, FILE_NAME);
}

async function readAll(): Promise<Record<string, string>> {
  try {
    const f = file();
    if (!f.exists) return {};
    return JSON.parse(await f.text()) as Record<string, string>;
  } catch {
    return {};
  }
}

export async function heroGetItem(key: string): Promise<string | null> {
  const all = await readAll();
  return key in all ? all[key] : null;
}

export async function heroSetItem(key: string, value: string): Promise<void> {
  const all = await readAll();
  all[key] = value;
  const f = file();
  if (!f.exists) f.create();
  await f.write(JSON.stringify(all));
}
