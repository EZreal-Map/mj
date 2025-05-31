<template>
  <div class="container">
    <el-table
      :data="tableData"
      style="width: 100%"
      height="100%"
      @row-click="rowClickCallback"
      highlight-current-row
    >
      <el-table-column prop="PTName" label="电站">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.PTName"
            placeholder="不能为空"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="PTCode" label="电站编码">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.PTCode"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="HDesign" label="额定水头(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.HDesign"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="Capacity" label="装机容量(MW)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.Capacity"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="minN" label="最小出力(MW)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.minN"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="MaxQ" label="最大过机流量(m³/s)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.MaxQ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="minQ" label="最小流量(m³/s)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.minQ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="KN" label="出力系数">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.KN"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
    </el-table>

    <div class="button-group">
      <el-button type="primary" @click="getReservoirInfo(true)">查询</el-button>
      <el-button type="primary" @click="notFinished">新增</el-button>
      <el-button type="primary" @click="notFinished">删除</el-button>
      <el-button type="primary" @click="updateDispatchParamsBatch">保存</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import {
  getDispatchParameterAxios,
  updateDispatchParamsBatchAxios,
} from '@/apis/system-manage/hydropowerPlantData.js'

const tableData = ref([])
let oldTableData = [] // 用于保存旧数据以便比较
const clickedRow = ref(null)

const rowClickCallback = (row) => {
  clickedRow.value = row
  console.log('点击的行数据:', row)
  // 这里可以添加点击行后的逻辑
}

const getReservoirInfo = async (message = false) => {
  const data = await getDispatchParameterAxios()
  tableData.value = data
  oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝旧数据
  console.log(data)
  if (message) ElMessage.success(`成功获取水电站参数数据`)
}

getReservoirInfo()

// 数据保存
const updateDispatchParamsBatch = async () => {
  console.log('旧数据:', oldTableData)
  await updateDispatchParamsBatchAxios(oldTableData, tableData.value)
  ElMessage.success('成功更新水电站参数数据')
  getReservoirInfo() // 重新获取数据以更新表格
}

// TODO: 数据添加未完成，因为特征水位的PTcode 不是在此创建的
// TODO：数据删除未完成，因为无法创建数据，不敢随便删除已有的数据，无法测试删除功能
const notFinished = () => {
  ElMessage.warning('此功能未完成')
}
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-content: space-between;
  height: 100%;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px;
  border-top: 1px solid #ebeef5;
  background-color: #fff;
}

.delete-dialog .dialog-body {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 0;
}

.delete-dialog .dialog-text p {
  margin: 4px 0;
}

.delete-dialog .dialog-footer {
  text-align: right;
}
</style>
