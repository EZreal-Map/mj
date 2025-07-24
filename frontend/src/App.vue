<template>
  <div>
    <router-view></router-view>
  </div>
</template>

<script setup></script>

<style>
html,
body,
#app {
  height: 100vh;
  width: 100vw;
  margin: 0;
  padding: 0;
}

.cesium-widget-credits {
  display: none !important;
}

/* 美化滚动条 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background: #dadbdd;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #c7c9cc;
}

::-webkit-scrollbar-track {
  background: #f5f7fa;
}
</style>
