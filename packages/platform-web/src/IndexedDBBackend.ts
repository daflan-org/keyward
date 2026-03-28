import type { KeywardBackend } from '@daflan/keyward-core';
import { openDB } from 'idb';

const DB_NAME = 'keyward';
const STORE_NAME = 'kv';
const DB_VERSION = 1;

export class IndexedDBBackend implements KeywardBackend {
  private dbPromise: ReturnType<typeof openDB> | null = null;

  private getDb(): ReturnType<typeof openDB> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        },
      });
      this.dbPromise.catch(() => {
        this.dbPromise = null;
      });
    }
    return this.dbPromise;
  }

  async get(resolvedKey: string): Promise<string | null> {
    const db = await this.getDb();
    const value = await db.get(STORE_NAME, resolvedKey);
    return (value as string | undefined) ?? null;
  }

  async set(resolvedKey: string, value: string): Promise<void> {
    const db = await this.getDb();
    await db.put(STORE_NAME, value, resolvedKey);
  }

  async remove(resolvedKey: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(STORE_NAME, resolvedKey);
  }

  async keys(): Promise<string[]> {
    const db = await this.getDb();
    return db.getAllKeys(STORE_NAME) as Promise<string[]>;
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    await db.clear(STORE_NAME);
  }
}
