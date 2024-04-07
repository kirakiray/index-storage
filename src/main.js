const SName = Symbol("storage-name");
const IDB = Symbol("idb");

export class IndexStorage {
  constructor(id = "public") {
    this[SName] = id;

    this[IDB] = new Promise((resolve) => {
      let req = indexedDB.open("index-storage");

      req.onsuccess = (e) => {
        resolve(e.target.result);
      };

      req.onupgradeneeded = (e) => {
        e.target.result.createObjectStore(id, { keyPath: "key" });
      };
    });
  }

  async setItem(key, value) {
    return commonTask(
      this,
      (store) => store.put({ key, value }),
      () => true
    );
  }

  async getItem(key) {
    return commonTask(
      this,
      (store) => store.get(key),
      (e) => {
        const { result } = e.target;
        return result ? result.value : null;
      },
      "readonly"
    );
  }

  async removeItem(key) {
    return commonTask(
      this,
      (store) => store.delete(key),
      () => true
    );
  }

  async clear() {
    return commonTask(
      this,
      (store) => store.clear(),
      () => true
    );
  }

  async key(index) {
    return commonTask(
      this,
      (store) => store.getAllKeys(),
      (e) => e.target.result[index]
    );
  }

  get length() {
    return commonTask(
      this,
      (store) => store.count(),
      (e) => e.target.result
    );
  }
}

const commonTask = async (_this, afterStore, succeed, mode = "readwrite") => {
  const db = await _this[IDB];

  return new Promise((resolve, reject) => {
    const req = afterStore(
      db.transaction([_this[SName]], mode).objectStore(_this[SName])
    );

    req.onsuccess = (e) => {
      resolve(succeed(e));
    };
    req.onerror = (e) => {
      reject(e);
    };
  });
};
