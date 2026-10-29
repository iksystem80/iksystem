<template>
  <div v-if="!isItemHidden" class="root-sidebar-item">
    <template v-if="
      hasOneShowingChild(item.children, item) &&
        (!onlyOneChild.children || onlyOneChild.noShowingChildren) &&
        !(item.meta && item.meta.alwaysShow)
    ">
      <app-link class="link"
                :to="resolvePath(onlyOneChild.path)">
        <el-menu-item v-if="onlyOneChild.meta"
                      class="left-menu-item"
                      :index="resolvePath(onlyOneChild.path)"
                      :class="{
                        'submenu-title-noDropdown': !isNest
                      }">
          <template v-if="
            get2MetaIconPath(
              onlyOneChild,
              item
            )
          ">
            <template v-if="
              typeof get2MetaIconPath(
                onlyOneChild,
                item
              ) === 'string'
            ">
              <svg-icon :icon-class="
                get2MetaIconPath(
                  onlyOneChild,
                  item
                )
              " />

              <span v-if="
                      secondMenuPopup &&
                        isTopRoute
                    "
                    class="text text-one text-one-added">
                {{ onlyOneChild.meta.title }}
              </span>
            </template>

            <el-icon v-else
                     class="svg-icon el-svg-icon">
              <component :is="
                get2MetaIconPath(
                  onlyOneChild,
                  item
                )
              " />
            </el-icon>
          </template>

          <template #title>
            <span class="text text-one">
              {{ onlyOneChild.meta.title }}
            </span>
          </template>
        </el-menu-item>
      </app-link>
    </template>

    <el-sub-menu v-else
                 ref="subMenu"
                 class="left-sub-menu"
                 :index="resolvePath(item.path)"
                 teleported>
      <template v-if="item.meta"
                #title>
        <template v-if="getMetaIconPath(item)">
          <svg-icon v-if="
                      typeof getMetaIconPath(item) ===
                        'string'
                    "
                    :icon-class="getMetaIconPath(item)" />

          <el-icon v-else
                   class="svg-icon el-svg-icon">
            <component :is="getMetaIconPath(item)" />
          </el-icon>
        </template>

        <span class="text text-two">
          {{ item.meta.title }}
        </span>
      </template>

      <sidebar-item v-for="child in item.children"
                    :key="child.path"
                    :is-nest="true"
                    :item="child"
                    :base-path="resolvePath(child.path)"
                    class="nest-menu" />
    </el-sub-menu>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import path from 'path-browserify';
import { isExternal } from '@/utils/validate';
import AppLink from './link';
import FixiOSBug from './fixiosbug';
import { useSettingsStore } from '@/store/modules/settings';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

const elementIcons = ElementPlusIconsVue;

export default defineComponent({
  name: 'SidebarItem',

  components: {
    AppLink
  },

  mixins: [FixiOSBug],

  props: {
    item: {
      type: Object,
      required: true
    },

    isNest: {
      type: Boolean,
      default: false
    },

    basePath: {
      type: String,
      default: ''
    },

    isTopRoute: {
      type: Boolean,
      default: false
    }
  },

  data() {
    this.onlyOneChild = null;

    return {};
  },

  computed: {
    secondMenuPopup() {
      const settingsStore = useSettingsStore();

      return settingsStore.secondMenuPopup;
    },

    isItemHidden() {
      return this.item.meta?.hidden === true;
    }
  },

  methods: {
    getMetaIconPath(item) {
      const icon = item?.meta?.icon;

      if (!icon) {
        return null;
      }

      // Element Plus icon
      if (elementIcons[icon]) {
        return elementIcons[icon];
      }

      // Custom SVG icon
      return icon;
    },

    get2MetaIconPath(onlyOneChild, item) {
      const icon =
                    onlyOneChild?.meta?.icon ||
                    item?.meta?.icon;

      if (!icon) {
        return null;
      }

      // Element Plus icon
      if (elementIcons[icon]) {
        return elementIcons[icon];
      }

      // Custom SVG icon
      return icon;
    },

    hasOneShowingChild(
      children = [],
      parent
    ) {
      const showingChildren =
                    children.filter(child => {
                      if (child.meta?.hidden) {
                        return false;
                      }

                      this.onlyOneChild = child;

                      return true;
                    });

      if (showingChildren.length === 1) {
        return true;
      }

      if (showingChildren.length === 0) {
        this.onlyOneChild = {
          ...parent,
          path: '',
          noShowingChildren: true
        };

        return true;
      }

      return false;
    },

    resolvePath(routePath) {
      if (isExternal(routePath)) {
        return routePath;
      }

      if (isExternal(this.basePath)) {
        return this.basePath;
      }

      return path.resolve(
        this.basePath,
        routePath
      );
    }
  }
});
</script>

<style lang="scss" scoped>
    .link :deep(.el-menu-tooltip__trigger) {
        position: relative;
        padding: 0;
    }

    .left-menu-item,
    .left-sub-menu :deep(.el-sub-menu__title) {
        display: block;
    }

    .el-svg-icon {
        width: 1em;
        height: 1em;
        vertical-align: -0.15em;
        fill: currentColor;
        overflow: hidden;
    }

    .sub-el-icon {
        color: currentColor;
        width: 1em;
        height: 1em;
    }
</style>
