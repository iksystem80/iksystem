import { defineStore, acceptHMRUpdate } from 'pinia';
import { ref } from 'vue';
import type { RouteLocationNormalized } from 'vue-router';

export const useTagsViewStore = defineStore('tagsView', () => {
  const visitedViews = ref<RouteLocationNormalized[]>([]);
  const cachedViews = ref<string[]>([]);

  /**
     * Add a view to visited and cached views.
     */
  function addView(view: RouteLocationNormalized) {
    addVisitedView(view);
    addCachedView(view);
  }

  /**
     * Add a view to visited views.
     */
  function addVisitedView(view: RouteLocationNormalized) {
    if (visitedViews.value.some(v => v.path === view.path)) {
      return;
    }

    visitedViews.value.push({
      ...view,
      meta: {
        ...view.meta,
        title: view.meta?.title || 'no-name'
      }
    });
  }

  /**
     * Add a view to cached views.
     */
  function addCachedView(view: RouteLocationNormalized) {
    const name = view.name?.toString();

    if (!name) {
      return;
    }

    if (cachedViews.value.includes(name)) {
      return;
    }

    if (!view.meta?.noCache) {
      cachedViews.value.push(name);
    }
  }

  /**
     * Delete a view.
     */
  function delView(view: RouteLocationNormalized) {
    delVisitedView(view);
    delCachedView(view);
  }

  /**
     * Delete a view from visited views.
     */
  function delVisitedView(view: RouteLocationNormalized) {
    const index = visitedViews.value.findIndex(v => v.path === view.path);

    if (index > -1) {
      visitedViews.value.splice(index, 1);
    }
  }

  /**
     * Delete a view from cached views.
     */
  function delCachedView(view: RouteLocationNormalized) {
    const name = view.name?.toString();

    if (!name) {
      return;
    }

    const index = cachedViews.value.indexOf(name);

    if (index > -1) {
      cachedViews.value.splice(index, 1);
    }
  }

  /**
     * Delete all other views except the current view.
     */
  function delOthersViews(view: RouteLocationNormalized) {
    delOthersVisitedViews(view);
    delOthersCachedViews(view);
  }

  /**
     * Delete all other visited views.
     * Affix views are always kept.
     */
  function delOthersVisitedViews(view: RouteLocationNormalized) {
    visitedViews.value = visitedViews.value.filter(
      v => v.meta?.affix || v.path === view.path
    );
  }

  /**
     * Delete all other cached views.
     */
  function delOthersCachedViews(view: RouteLocationNormalized) {
    const name = view.name?.toString();

    if (!name) {
      cachedViews.value = [];
      return;
    }

    const index = cachedViews.value.indexOf(name);

    if (index > -1) {
      cachedViews.value = cachedViews.value.slice(
        index,
        index + 1
      );
    } else {
      cachedViews.value = [];
    }
  }

  /**
     * Delete all views.
     */
  function delAllViews() {
    delAllVisitedViews();
    delAllCachedViews();
  }

  /**
     * Delete all visited views except affix views.
     */
  function delAllVisitedViews() {
    visitedViews.value = visitedViews.value.filter(
      tag => tag.meta?.affix
    );
  }

  /**
     * Delete all cached views.
     */
  function delAllCachedViews() {
    cachedViews.value = [];
  }

  /**
     * Update an existing visited view.
     */
  function updateVisitedView(view: RouteLocationNormalized) {
    const index = visitedViews.value.findIndex(
      v => v.path === view.path
    );

    if (index > -1) {
      visitedViews.value[index] = {
        ...visitedViews.value[index],
        ...view
      };
    }
  }

  return {
    visitedViews,
    cachedViews,
    addView,
    addVisitedView,
    addCachedView,
    delView,
    delVisitedView,
    delCachedView,
    delOthersViews,
    delOthersVisitedViews,
    delOthersCachedViews,
    delAllViews,
    delAllVisitedViews,
    delAllCachedViews,
    updateVisitedView
  };
});

/**
 * Hot Module Replacement
 */
if (import.meta.hot) {
  import.meta.hot.accept(
    acceptHMRUpdate(
      useTagsViewStore,
      import.meta.hot
    )
  );
}
