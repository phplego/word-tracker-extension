class WordHistoryService {
  constructor(dbName = 'WordTrackerDB', storeName = 'history') {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  async addEntry(word, explanation, sentence = '') {
    const entry = {
      word,
      explanation,
      sentence,
      timestamp: Date.now()
    };
    return this._transaction('readwrite', (store) => store.add(entry));
  }

  async deleteEntry(id) {
    return this._transaction('readwrite', (store) => store.delete(id));
  }

  async updateEntry(id, updatedFields) {
    return this._transaction('readwrite', async (store) => {
      const request = store.get(id);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const data = request.result;
          if (!data) return reject(`No record with id ${id}`);
          Object.assign(data, updatedFields);
          const updateRequest = store.put(data);
          updateRequest.onsuccess = () => resolve(data);
          updateRequest.onerror = () => reject(updateRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  async getEntries(limit = 10, sortDesc = true) {
    return this._transaction('readonly', (store) => {
      const index = store.index('timestamp');
      const direction = sortDesc ? 'prev' : 'next';
      const request = index.openCursor(null, direction);

      return new Promise((resolve, reject) => {
        const results = [];
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor && results.length < limit) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };
        request.onerror = () => reject(request.error);
      });
    });
  }

  _transaction(mode, callback) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.storeName, mode);
      const store = tx.objectStore(this.storeName);
      const result = callback(store);
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Export the class
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WordHistoryService;
}
