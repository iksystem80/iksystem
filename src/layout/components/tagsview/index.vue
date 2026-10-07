<template>
  <div>
    <div id="tags-view-container" v-if="device !== 'mobile'"
         ref="tagsViewContainer"
         class="tags-view-container">
      <ScrollPane ref="scrollPane"
                  class="tags-view-wrapper"
                  @scroll="handleScroll">
        <router-link v-for="tag in visitedViews"
                     :key="tag.path"
                     :to="{path: tag.path,query: tag.query,fullPath: tag.fullPath}"
                     custom>
          <template #default="{navigate,isActive,isExactActive}">
            <span :data-path="tag.path"
                  :class="['tags-view-item',isActive && 'router-link-active',isExactActive &&'router-link-exact-active']"
                  @click="navigate"
                  @click.middle="!isAffix(tag)? closeSelectedTag(tag): ''"
                  @contextmenu.prevent="openMenu(tag, $event)">
              {{ tag.name }}
              <el-icon v-if="!isAffix(tag)"
                       class="el-icon-close"
                       @click.prevent.stop="closeSelectedTag(tag)">
                <IconClose />
              </el-icon>
            </span>
          </template>
        </router-link>
      </ScrollPane>

      <!-- Context menu -->
      <ul v-show="visible"
          :style="{
            left: `${left}px`,
            top: `${top}px`
          }"
          class="contextmenu">
        <li @click="
          refreshSelectedTag(selectedTag)
        ">
          Refresh
        </li>

        <li v-if="!isAffix(selectedTag)"
            @click="
              closeSelectedTag(selectedTag)
            ">
          Close
        </li>

        <li @click="closeOthersTags">
          Close Other
        </li>

        <li @click="
          closeAllTags(selectedTag)
        ">
          Close All
        </li>
      </ul>
    </div>

    <div class="tags-view-container mobile-location-bar" v-if="device === 'mobile'">
      <div class="location-container">
        <div class="location-pill">
          <el-icon class="location-pill-icon">
            <Location />
          </el-icon>

          <span class="location-pill-label">
            {{ location || 'No Location' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import path from 'path-browserify';
import { storeToRefs } from 'pinia';
import { Close as IconClose, Location } from '@element-plus/icons-vue';
import ScrollPane from './scrollpane.vue';
import { useTagsViewStore } from '@/store/modules/tagsview';
import { useAppStore } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { usePermissionStore } from '@/store/modules/permission';

defineOptions({ name: 'TagsView' });

const route = useRoute();
const router = useRouter();

const appStore = useAppStore();
const userStore = useUserStore();
const tagsViewStore = useTagsViewStore();

const permissionStore = usePermissionStore();
const { location } = storeToRefs(userStore);
const device = computed(() => appStore.device);
const { visitedViews } = storeToRefs(tagsViewStore);

const { routes } = storeToRefs(permissionStore);

/**
         * Component refs
         */
const scrollPane =
            ref<{
                moveToTarget:(
                  element: HTMLElement
                ) => void
                  } | null>(null);

const tagsViewContainer =
            ref<HTMLElement | null>(null);

/**
         * Context menu
         */
const visible = ref(false);

const top = ref(0);

const left = ref(0);

const selectedTag = ref<any>(null);

/**
         * Affix tags
         */
const affixTags = ref<any[]>([]);

/**
         * Check current route
         */
function isCurrentRoute(
  view: any
): boolean {
  return view?.path === route.path;
}

/**
         * Check affix tag
         */
function isAffix(
  tag: any
): boolean {
  return tag?.meta?.affix === true;
}

/**
         * Recursively find affix routes.
         */
function filterAffixTags(
  routeList: any[],
  basePath = '/'
): any[] {
  const tags: any[] = [];

  routeList.forEach(
    routeItem => {
      const currentPath =
                        path.resolve(
                          basePath,
                          routeItem.path
                        );

      if (
        routeItem.meta?.affix
      ) {
        tags.push({
          fullPath:
                                currentPath,
          path:
                                currentPath,
          name:
                                routeItem.name,
          meta: {
            ...routeItem.meta
          }
        });
      }

      if (
        routeItem.children?.length
      ) {
        const childTags =
                            filterAffixTags(
                              routeItem.children,
                              currentPath
                            );

        tags.push(
          ...childTags
        );
      }
    }
  );

  return tags;
}

/**
         * Initialize affix tags.
         */
function initTags(): void {
  if (!routes.value?.length) {
    return;
  }

  const tags =
                filterAffixTags(
                  routes.value
                );

  affixTags.value =
                tags;

  tags.forEach(
    tag => {
      if (tag.name) {
        tagsViewStore
          .addVisitedView(
            tag
          );
      }
    }
  );
}

/**
         * Add current route.
         */
function addTags(): void {
  if (!route.name) {
    return;
  }

  tagsViewStore.addView(
    route
  );
}

/**
         * Move current tag into view.
         */
async function moveToCurrentTag(): Promise<void> {
  await nextTick();

  const container =
                tagsViewContainer.value;

  if (!container) {
    return;
  }

  const tagElements =
                container.querySelectorAll(
                  '.tags-view-item'
                );

  for (
    const element of tagElements
  ) {
    const tagElement =
                    element as HTMLElement;

    const tagPath =
                    tagElement.dataset.path;

    if (
      tagPath === route.path
    ) {
      scrollPane.value?.moveToTarget(
        tagElement
      );

      break;
    }
  }

  tagsViewStore.updateVisitedView(
    route
  );
}

/**
         * Refresh selected tag.
         */
async function refreshSelectedTag(
  view: any
): Promise<void> {
  if (!view) {
    return;
  }

  closeMenu();

  tagsViewStore.delCachedView(
    view
  );

  await nextTick();

  await router.replace({
    path:
                    '/redirect' +
                    view.fullPath
  });
}

/**
         * Close selected tag.
         */
async function closeSelectedTag(
  view: any
): Promise<void> {
  if (!view) {
    return;
  }

  closeMenu();

  tagsViewStore.delView(
    view
  );

  const views =
                tagsViewStore.visitedViews;

  if (
    isCurrentRoute(view)
  ) {
    await toLastView(
      views,
      view
    );
  }
}

/**
         * Close all tags except selected.
         */
async function closeOthersTags(): Promise<void> {
  const tag =
                selectedTag.value;

  if (!tag) {
    return;
  }

  closeMenu();

  if (
    !isCurrentRoute(tag)
  ) {
    await router.push(
      tag.fullPath
    );
  }

  tagsViewStore.delOthersViews(
    tag
  );

  await moveToCurrentTag();
}

/**
         * Close all tags.
         */
async function closeAllTags(
  view: any
): Promise<void> {
  if (!view) {
    return;
  }

  closeMenu();

  tagsViewStore.delAllViews();

  const views =
                tagsViewStore.visitedViews;

  /**
             * If the selected tag is an affix
             * tag, don't navigate away.
             */
  if (
    affixTags.value.some(
      tag =>
        tag.path ===
                        view.path
    )
  ) {
    return;
  }

  await toLastView(
    views,
    view
  );
}

/**
         * Navigate to last available view.
         */
async function toLastView(
  views: any[],
  view: any
): Promise<void> {
  const latestView =
                views.slice(-1)[0];

  if (latestView) {
    await router.push(
      latestView.fullPath
    );

    return;
  }

  if (
    view?.name ===
                'Dashboard'
  ) {
    await router.replace({
      path:
                        '/redirect' +
                        view.fullPath
    });
  } else {
    await router.push('/');
  }
}

/**
         * Open context menu.
         */
function openMenu(
  tag: any,
  event: MouseEvent
): void {
  const container =
                tagsViewContainer.value;

  if (!container) {
    return;
  }

  const menuMinWidth = 105;

  const rect =
                container.getBoundingClientRect();

  const containerWidth =
                container.offsetWidth;

  let menuLeft =
                event.clientX -
                rect.left +
                15;

  const maxLeft =
                containerWidth -
                menuMinWidth;

  if (
    menuLeft > maxLeft
  ) {
    menuLeft =
                    maxLeft;
  }

  if (
    menuLeft < 0
  ) {
    menuLeft = 0;
  }

  /**
             * IMPORTANT:
             *
             * Make top relative to the
             * tags-view-container instead
             * of the viewport.
             */
  let menuTop =
                event.clientY -
                rect.top;

  if (
    menuTop < 0
  ) {
    menuTop = 0;
  }

  left.value =
                menuLeft;

  top.value =
                menuTop;

  selectedTag.value =
                tag;

  visible.value =
                true;
}

/**
         * Close context menu.
         */
function closeMenu(): void {
  visible.value =
                false;
}

/**
         * ScrollPane scroll event.
         */
function handleScroll(): void {
  closeMenu();
}

/**
         * Close menu when clicking elsewhere.
         */
function handleDocumentClick(
  event: MouseEvent
): void {
  const target =
                event.target as Node;

  const container =
                tagsViewContainer.value;

  if (
    container &&
                !container.contains(target)
  ) {
    closeMenu();
  }
}

/**
         * Route watcher.
         */
watch(
  () => route.fullPath,
  async () => {
    addTags();

    await moveToCurrentTag();
  }
);

/**
         * Permission routes may be populated
         * after this component is mounted.
         *
         * Re-initialize affix tags when routes
         * become available.
         */
watch(
  routes,
  () => {
    if (
      routes.value?.length
    ) {
      initTags();
    }
  },
  {
    deep: true,
    immediate: true
  }
);

/**
         * Initialize.
         */
onMounted(async () => {
  initTags();

  addTags();

  await nextTick();

  await moveToCurrentTag();

  document.body.addEventListener(
    'click',
    handleDocumentClick
  );
});

/**
         * Cleanup.
         */
onBeforeUnmount(() => {
  document.body.removeEventListener(
    'click',
    handleDocumentClick
  );
});
</script>

<style lang="scss" scoped>
    .mobile-location-bar {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .location-container {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 10px;
        box-sizing: border-box;
    }

    .location-pill {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        max-width: calc(100% - 20px);
        padding: 4px 11px;
        border-radius: 999px;
        background: linear-gradient( 135deg, rgba(64, 158, 255, 0.10), rgba(103, 194, 58, 0.08) );
        border: 1px solid rgba(64, 158, 255, 0.15);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.035);
        color: var(--el-text-color-primary);
        transition: background 0.2s ease, border-color 0.2s ease;
    }

        .location-pill:hover {
            background: rgba(64, 158, 255, 0.12);
            border-color: rgba(64, 158, 255, 0.25);
        }

    .location-pill-icon {
        flex-shrink: 0;
        font-size: 14px;
        color: var(--el-color-primary);
    }

    .location-pill-label {
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        font-size: 12px;
        font-weight: 650;
        letter-spacing: 0.1px;
    }

        .tags-view-container {
            height: 27px;
            width: 100%;
            background: #fff;
            border-bottom: 1px solid #d8dce5;
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.12), 0 0 3px 0 rgba(0, 0, 0, 0.04);
            position: relative;

            .tags-view-wrapper {
                .tags-view-item {
                    user-select: none;
                    display: inline-block;
                    position: relative;
                    cursor: pointer;
                    height: 26px;
                    line-height: 26px;
                    border: 1px solid #d8dce5;
                    color: #495060;
                    background: #fff;
                    padding: 0 8px;
                    font-size: 12px;
                    margin-left: 5px;

                    &:first-of-type {
                        margin-left: 15px;
                    }

                    &:last-of-type {
                        margin-right: 15px;
                    }

                    &.router-link-exact-active {
                        background-color: #42b983;
                        color: #fff;
                        border-color: #42b983;

                        &::before {
                            content: '';
                            background: #fff;
                            display: inline-block;
                            width: 8px;
                            height: 8px;
                            border-radius: 50%;
                            position: relative;
                            margin-right: 2px;
                        }
                    }
                }
            }

            .contextmenu {
                margin: 0;
                background: #fff;
                z-index: 3000;
                position: absolute;
                list-style-type: none;
                padding: 5px 0;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 400;
                color: #333;
                box-shadow: 2px 2px 3px 0 rgba(0, 0, 0, 0.3);

                li {
                    margin: 0;
                    padding: 7px 16px;
                    cursor: pointer;

                    &:hover {
                        background: #eee;
                    }
                }
            }
        }

    @media (max-width: 700px) {
        .tags-view-container {
            height: 34px;
        }
    }
</style>

<style lang="scss">
    .tags-view-wrapper {
        .tags-view-item {
            .link {
                padding: 0 2px;
            }

            .el-icon-close {
                width: 16px;
                height: 16px;
                padding: 4px;
                margin-bottom: -4px;
                border-radius: 50%;
                text-align: center;
                transition: all 0.3s cubic-bezier( 0.645, 0.045, 0.355, 1 );
                transform-origin: 100% 50%;

                &:hover {
                    background-color: #b4bccc;
                    color: #fff;
                }
            }
        }
    }
</style>
