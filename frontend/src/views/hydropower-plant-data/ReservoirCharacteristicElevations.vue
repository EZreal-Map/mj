<template>
  <div class="container">
    <el-table
      :data="tableData"
      style="width: 100%"
      height="100%"
      @row-click="rowClickCallback"
      highlight-current-row
    >
      <el-table-column prop="PTName" label="电站"> </el-table-column>
      <el-table-column prop="PTCode" label="电站编码"> </el-table-column>
      <el-table-column prop="DTEL" label="坝顶高程(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.DTEL"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="CHFLZ" label="校核洪水位(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.CHFLZ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="DSFLZ" label="设计洪水位(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.DSFLZ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="NRFLZ" label="正常洪水位(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.NRFLZ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="MNZ" label="死水位(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.MNZ"
            placeholder="不能为空"
            type="number"
            min="0"
            @mousewheel.prevent
          />
        </template>
      </el-table-column>
      <el-table-column prop="HHZ" label="历史最高水位(m)">
        <template #default="scope">
          <el-input
            v-model.number="scope.row.HHZ"
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
      <el-button type="primary" @click="deleteReservoirInfo">删除</el-button>
      <el-button type="primary" @click="updateReservoirInfoBatch">保存</el-button>
    </div>
  </div>

  <!-- 删除确认弹窗 -->
  <el-dialog v-model="deleteDialogVisible" title="删除确认" width="400" class="delete-dialog">
    <div class="dialog-body">
      <el-icon style="font-size: 24px; color: #e6a23c">
        <WarningFilled />
      </el-icon>
      <div class="dialog-text">
        <p>确定要删除这条数据吗？此操作不可恢复。</p>
        <p><strong>电站：</strong>{{ clickedRow?.PTName }}</p>
        <p><strong>电站编码：</strong>{{ clickedRow?.PTCode }} m</p>
        <p><strong>坝顶高程：</strong>{{ clickedRow?.DTEL }} m</p>
        <p><strong>校核洪水位：</strong>{{ clickedRow?.CHFLZ }} m</p>
        <p>...</p>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="primary" danger @click="deleteDialogCallback">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import {
  getReservoirInfoAxios,
  updateReservoirInfoBatchAxios,
  deleteReservoirInfoAxios,
} from '@/apis/system-manage/hydropowerPlantData.js'

const tableData = ref([])
let oldTableData = [] // 用于保存原始数据

const clickedRow = ref(null)
const deleteDialogVisible = ref(false)

const rowClickCallback = (row) => {
  clickedRow.value = row
  console.log('点击的行数据:', row)
  // 这里可以添加点击行后的逻辑
}

const getReservoirInfo = async (message = false) => {
  const data = await getReservoirInfoAxios()
  tableData.value = data
  oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝原始数据
  console.log(data)
  if (message) ElMessage.success(`成功获取水库特征水位数据`)
}

getReservoirInfo()

// 数据保存
const updateReservoirInfoBatch = async () => {
  await updateReservoirInfoBatchAxios(oldTableData, tableData.value)
  ElMessage.success('成功更新水库特征水位数据')
  getReservoirInfo()
}

// 数据删除
const deleteReservoirInfo = () => {
  if (!clickedRow.value) {
    ElMessage.warning('请先选择一行数据')
    return
  }
  // 显示删除确认对话框
  deleteDialogVisible.value = true
}

const deleteDialogCallback = async () => {
  if (!clickedRow.value) {
    ElMessage.warning('请先选择一行数据')
    return
  }
  // 假设有一个删除接口
  await deleteReservoirInfoAxios(clickedRow.value.PTCode, clickedRow.value.STCDT)
  ElMessage.success('成功删除水库特征水位数据')
  deleteDialogVisible.value = false
  getReservoirInfo()
}

// TODO: 数据添加未完成，因为特征水位的PTcode 不是在此创建的
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
