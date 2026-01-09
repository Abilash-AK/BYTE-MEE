const STORAGE_PREFIX = 'colearn_realtime_';

const getKey = (docId) => `${STORAGE_PREFIX}${docId}`;

export const subscribeToDocument = (docId, callback) => {
  const key = getKey(docId);
  const initial = localStorage.getItem(key);
  if (initial) {
    callback(initial, true);
  }

  const handler = (event) => {
    if (event.key === key && event.newValue !== null) {
      callback(event.newValue, false);
    }
  };

  window.addEventListener('storage', handler);
  window.addEventListener('colearn-realtime', (event) => {
    if (event.detail?.key === key) {
      callback(event.detail.value, false);
    }
  });

  return () => {
    window.removeEventListener('storage', handler);
  };
};

export const updateDocument = (docId, value) => {
  const key = getKey(docId);
  localStorage.setItem(key, value);
  window.dispatchEvent(new CustomEvent('colearn-realtime', { detail: { key, value } }));
};
