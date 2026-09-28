<template>
    <div :class="{ show: show }"
         class="header-search">
        <svg-icon class-name="search-icon"
                  icon-class="search"
                  @click.stop="click" />

        <el-select ref="headerSearchSelect"
                   v-model="search"
                   :remote-method="querySearch"
                   filterable
                   default-first-option
                   remote
                   placeholder="Search"
                   class="header-search-select"
                   @change="change">
            <el-option v-for="optItem in options"
                       :key="optItem.item.path"
                       :value="optItem.item"
                       :label="optItem.item.title.join(' > ')" />
        </el-select>
    </div>
</template>

<script>
    import { defineComponent } from 'vue'
    import Fuse from 'fuse.js'
    import path from 'path-browserify'
    import { usePermissionStore } from '@/store/modules/permission'

    export default defineComponent({
        name: 'HeaderSearch',

        data() {
            return {
                search: '',
                options: [],
                searchPool: [],
                show: false,
                fuse: undefined
            }
        },

        computed: {
            routes() {
                const permissionStore =
                    usePermissionStore()

                return permissionStore.routes
            }
        },

        watch: {
            routes: {
                handler(routes) {
                    this.searchPool =
                        this.generateRoutes(routes)
                },
                deep: true,
                immediate: true
            },

            searchPool(list) {
                this.initFuse(list)
            },

            show(value) {
                if (value) {
                    document.body.addEventListener(
                        'click',
                        this.close
                    )
                } else {
                    document.body.removeEventListener(
                        'click',
                        this.close
                    )
                }
            }
        },

        methods: {
            click() {
                this.show = !this.show

                if (this.show) {
                    if (
                        this.$refs.headerSearchSelect
                    ) {
                        this.$refs.headerSearchSelect.focus()
                    }
                }
            },

            close() {
                if (
                    this.$refs.headerSearchSelect
                ) {
                    this.$refs.headerSearchSelect.blur()
                }

                this.options = []
                this.show = false
            },

            change(val) {
                if (!val?.path) {
                    return
                }

                this.$router.push(val.path)

                this.search = ''
                this.options = []

                this.$nextTick(() => {
                    this.show = false
                })
            },

            initFuse(list) {
                if (!list || !list.length) {
                    this.fuse = undefined
                    return
                }

                this.fuse = new Fuse(list, {
                    shouldSort: true,
                    threshold: 0.4,
                    location: 0,
                    distance: 100,
                    minMatchCharLength: 1,
                    keys: [
                        {
                            name: 'title',
                            weight: 0.7
                        },
                        {
                            name: 'path',
                            weight: 0.3
                        }
                    ]
                })
            },

            /**
             * Filter routes that can be displayed
             * in the search result.
             */
            generateRoutes(
                routes,
                basePath = '/',
                prefixTitle = []
            ) {
                const res = []

                for (const router of routes) {
                    // Skip hidden routes
                    if (
                        router.meta &&
                        router.meta.hidden
                    ) {
                        continue
                    }

                    const data = {
                        path: path.resolve(
                            basePath,
                            router.path
                        ),
                        title: [...prefixTitle]
                    }

                    if (
                        router.meta &&
                        router.meta.title
                    ) {
                        data.title = [
                            ...data.title,
                            router.meta.title
                        ]

                        /*
                         * Only add routes that have a
                         * visible title.
                         */
                        if (
                            router.redirect !==
                            'noRedirect'
                        ) {
                            res.push(data)
                        }
                    }

                    // Process child routes recursively
                    if (
                        router.children &&
                        router.children.length
                    ) {
                        const tempRoutes =
                            this.generateRoutes(
                                router.children,
                                data.path,
                                data.title
                            )

                        if (tempRoutes.length) {
                            res.push(...tempRoutes)
                        }
                    }
                }

                return res
            },

            querySearch(query) {
                if (
                    !query ||
                    !this.fuse
                ) {
                    this.options = []
                    return
                }

                this.options =
                    this.fuse.search(query)
            }
        },

        beforeUnmount() {
            document.body.removeEventListener(
                'click',
                this.close
            )
        }
    })
</script>

<style lang="scss" scoped>
    .header-search {
        font-size: 0 !important;

        .search-icon {
            cursor: pointer;
            font-size: 18px;
            vertical-align: middle;
        }

        .header-search-select {
            font-size: 18px;
            transition: width 0.2s;
            width: 0;
            overflow: hidden;
            background: transparent;
            border-radius: 0;
            display: inline-block;
            vertical-align: middle;

            :deep(.el-input) {
                .el-input__wrapper {
                    padding: 0;
                    border: 0;
                    box-shadow: none !important;

                    .el-input__inner {
                        border-radius: 0;
                        padding-left: 0;
                        padding-right: 0;
                        box-shadow: none !important;
                        border-bottom: 1px solid #d9d9d9;
                        vertical-align: middle;
                    }
                }
            }
        }

        &.show {
            .header-search-select {
                width: 210px;
                margin-left: 10px;
            }
        }
    }
</style>
