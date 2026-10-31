/// <reference types="vite/client" />

/** Injected at build time from package.json → version */
declare const __APP_VERSION__: string

/** Injected at build time: the deploy's commit, appended to /skillup-assets/ runtime URLs */
declare const __SKILLUP_ASSETS_VERSION__: string
