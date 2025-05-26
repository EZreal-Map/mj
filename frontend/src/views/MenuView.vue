<template>
  <div class="index-container">
    <el-menu mode="horizontal" :router="true" :default-active="route.path" class="menu">
      <el-menu-item index="/show">首页</el-menu-item>
      <el-sub-menu index="1">
        <template #title>系统管理</template>
        <el-sub-menu index="1-1">
          <template #title>水文数据</template>
          <el-menu-item index="/evaporation">月蒸发量</el-menu-item>
          <el-menu-item index="/flow/daily-average">日平均流量</el-menu-item>
          <el-menu-item index="/flow/monthly-average">月平均流量</el-menu-item>
          <el-menu-item index="/flow/ten-day-average">旬平均流量</el-menu-item>
        </el-sub-menu>
        <el-sub-menu index="1-2">
          <template #title>电站数据</template>
          <el-menu-item index="1-2-1">水位库容关系</el-menu-item>
          <el-menu-item index="1-2-2">厂址水位流量关系</el-menu-item>
          <el-menu-item index="1-2-3">水库特征水位</el-menu-item>
          <el-menu-item index="1-2-4">水电站参数</el-menu-item>
          <el-menu-item index="1-2-5">水库特征水位</el-menu-item>
        </el-sub-menu>
      </el-sub-menu>
      <el-sub-menu index="3">
        <template #title>水务计算</template>
        <el-menu-item index="3-2-1">水位库容关系（待修改）</el-menu-item>
        <el-menu-item index="3-2-2">厂址水位流量关系（待修改）</el-menu-item>
        <el-menu-item index="3-2-3">水库特征水位（待修改）</el-menu-item>
        <el-menu-item index="3-2-4">水电站参数（待修改）</el-menu-item>
        <el-menu-item index="3-2-5">水库特征水位（待修改）</el-menu-item>
      </el-sub-menu>
      <el-sub-menu index="4">
        <template #title>水位预报</template>
        <el-menu-item index="4-2-1">水位库容关系（待修改）</el-menu-item>
        <el-menu-item index="4-2-2">厂址水位流量关系（待修改）</el-menu-item>
        <el-menu-item index="4-2-3">水库特征水位（待修改）</el-menu-item>
        <el-menu-item index="4-2-4">水电站参数（待修改）</el-menu-item>
        <el-menu-item index="4-2-5">水库特征水位（待修改）</el-menu-item>
      </el-sub-menu>
      <el-menu-item index="5">计划调度</el-menu-item>
      <el-menu-item index="6">实时调度</el-menu-item>
      <el-menu-item index="7">评价指标</el-menu-item>

      <el-sub-menu index="8">
        <template #title>方案管理</template>
        <el-menu-item index="/swmm-edit">短期预报编辑管理</el-menu-item>
      </el-sub-menu>
    </el-menu>

    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.index-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

.menu {
  align-items: center;
  padding: 0 20px;
  border-bottom: 5px solid #e4e7ed;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border-radius: 4px 4px 0 0;
}
.content {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
}
</style>
