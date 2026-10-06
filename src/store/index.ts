import { createPinia } from 'pinia';
import type { App } from 'vue';

const pinia = createPinia();

/**
 * Setup Pinia
 */
export function setupStore(app: App) {
  app.use(pinia);
}

/**
 * Pinia HMR support
 *
 * Stores can also define their own HMR handling
 * when imported directly.
 */
export { pinia };

export default pinia;
