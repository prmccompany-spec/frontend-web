// Minimal pub/sub so any code — including non-component modules like
// AuthContext's logout() — can trigger a toast without needing to consume a
// React context (avoids provider-ordering issues).
let listeners = [];
let idCounter = 0;

export const subscribeToToasts = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
};

export const showToast = (message, type = 'info') => {
  idCounter += 1;
  const toast = { id: idCounter, message, type };
  listeners.forEach((fn) => fn(toast));
};
