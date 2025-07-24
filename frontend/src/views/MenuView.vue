<template>
  <div class="top-banner">
    <img :src="topBg" alt="背景图" />
  </div>
  <div class="index-content">
    <div class="menu-wrapper">
      <el-menu :router="true" :default-active="route.path" class="menu">
        <el-menu-item index="/show">首页</el-menu-item>
        <el-sub-menu index="1">
          <template #title>数据管理</template>
          <el-sub-menu index="1-1">
            <template #title>水文数据</template>
            <el-menu-item index="/evaporation">月蒸发量</el-menu-item>
            <el-menu-item index="/flow/daily-average">日平均流量</el-menu-item>
            <el-menu-item index="/flow/monthly-average">月平均流量</el-menu-item>
            <el-menu-item index="/flow/tenday-average">旬平均流量</el-menu-item>
          </el-sub-menu>
          <el-sub-menu index="1-2">
            <template #title>电站数据</template>
            <el-menu-item index="/elevation-storage-curve">水位库容关系</el-menu-item>
            <el-menu-item index="/elevation-discharge-curve">水位流量关系</el-menu-item>
            <el-menu-item index="/reservoir-characteristic-elevations">水库特征水位</el-menu-item>
            <el-menu-item index="/hydropower-plant-parameters">水电站参数</el-menu-item>
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
        <el-sub-menu index="5">
          <template #title>计划调度</template>
        </el-sub-menu>
        <el-sub-menu index="6">
          <template #title>实时调度</template>
        </el-sub-menu>
        <el-sub-menu index="7">
          <template #title>评价指标</template>
        </el-sub-menu>

        <el-sub-menu index="8">
          <template #title>方案管理</template>
          <el-menu-item index="/swmm-edit">短期预报编辑管理</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </div>

    <div class="content">
      <router-view></router-view>
    </div>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router'
import topBg from '@/assets/images/top_bg.png'
const route = useRoute()
</script>

<style scoped>
.top-banner {
  background-color: #c3e4e8;
  height: 60px;
  display: flex; /* 垂直居中; */
  align-items: center;
}

.index-content {
  height: calc(100vh - 60px);
  display: flex;
  flex-direction: row;
}

.menu {
  height: 100%;
  width: 250px;
  overflow-y: auto;
}

.content {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  flex-direction: column;
}
</style>
