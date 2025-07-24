<template>
  <div class="container">
    <div class="right">
      <div ref="chartRef" class="chart-container"></div>
    </div>
    <div class="left">
      <div class="left-top">
        <div class="station-select-row">
          <div class="form-row">
            <span class="form-label">电站/水文站：</span>
            <el-select
              v-model="selectSTCDT"
              placeholder="请选择水文断面"
              class="form-input-flex"
              @change="getZdownQ"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="button-group">
            <el-button type="primary" @click="getZdownQ">查询</el-button>
            <el-button type="primary" @click="addDailyFlow">新增</el-button>
            <el-button type="primary" @click="deleteDailyFlow">删除</el-button>
            <el-button type="primary" @click="updateZdownQBatch">保存</el-button>
          </div>
        </div>
      </div>

      <div class="left-bottom">
        <el-table
          :data="tableData"
          style="width: 100%"
          height="100%"
          @row-click="rowClickCallback"
          highlight-current-row
        >
          <el-table-column prop="Z_down" label="水位(m)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.Z_down"
                placeholder="不能为空"
                type="number"
                min="0"
                @mousewheel.prevent
                @input="updateChart(tableData)"
              />
            </template>
          </el-table-column>
          <el-table-column prop="Q_down" label="流量(m³/s)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.Q_down"
                placeholder="不能为空"
                type="number"
                min="0"
                @mousewheel.prevent
                @input="updateChart(tableData)"
              />
            </template>
          </el-table-column>
        </el-table>
      </div>
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
        <p><strong>水位：</strong>{{ clickedRow?.Z_down }} m</p>
        <p><strong>流量：</strong>{{ clickedRow?.Q_down }} m³/s</p>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="deleteDialogVisible = false">取消</el-button>
        <el-button type="primary" danger @click="deleteDialogCallback">确定</el-button>
      </div>
    </template>
  </el-dialog>
  <!-- 新增输入弹窗 -->
  <el-dialog v-model="addDialogVisible" title="新增" width="400">
    <el-form :model="addDataForm">
      <el-form-item label="水位(m)：" label-width="100">
        <el-input
          v-model="addDataForm.Z_down"
          type="number"
          placeholder="请输入新增水位数据"
          style="width: 220px"
          min="0"
        />
      </el-form-item>
      <div>
        <el-form-item label="流量(m³/s)：" label-width="100">
          <el-input
            v-model="addDataForm.Q_down"
            type="number"
            placeholder="请输入新增流量数据"
            style="width: 220px"
            min="0"
          />
        </el-form-item>
      </div>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" danger @click="addDialogCallback">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import { WarningFilled } from '@element-plus/icons-vue'

import {
  getZdownQAxios,
  updateZdownQBatchAxios,
  deleteZdownQAxios,
  addZdownQAxios,
} from '@/apis/system-manage/hydropowerPlantData.js'

// TODO: 这里需要根据接口实际情况获得
const options = [
  {
    value: '10000000',
    label: '犍为水文站',
  },
  {
    value: '10000200',
    label: '老木孔',
  },

  {
    value: '10000300',
    label: '东风岩',
  },
  {
    value: '10000400',
    label: '犍为',
  },
]
const selectSTCDT = ref('')
const tableData = ref([])
let oldTableData = {} // 用于保存原始数据

const chartRef = ref(null)
let chartInstance = null

const clickedRow = ref(null) // 用于保存选中的行数据
const deleteDialogVisible = ref(false)

const addDialogVisible = ref(false)
const addDataForm = ref({
  Z_down: null,
  Q_down: null,
})

const getZdownQ = () => {
  getZdownQAxios(selectSTCDT.value).then((data) => {
    tableData.value = data
    oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝原始数据
    clickedRow.value = null // 清空选中的行数据
    // // 更新表格数据
    updateChart(data)
  })
}

const init = () => {
  if (!selectSTCDT.value) {
    selectSTCDT.value = options[0].value // 默认选中第一个电站
  }
  getZdownQ()
}
init()

const updateChart = (data) => {
  nextTick(() => {
    if (!chartInstance) {
      chartInstance = echarts.init(chartRef.value)
    }

    window.onresize = () => {
      chartInstance.resize()
    }

    if (!data || data.length === 0) {
      chartInstance.clear()
      chartInstance.setOption({
        title: {
          text: '暂无流量数据',
          left: 'center',
          top: 'center',
          textStyle: { fontSize: 20, color: '#999' },
        },
      })
      return
    }

    const xydatas = data.map((item) => [Number(item.Z_down), Number(item.Q_down)])

    // // 因为自动的x轴比例尺显示数据不行，所有手动设置 xMin 和 xMax
    // // 计算最大最小值并加减 10% padding
    const xdatas = xydatas.map((item) => item[0]) // 提取出所有 y 值（Q_down）
    const minValue = Math.min(...xdatas)
    const maxValue = Math.max(...xdatas)

    const xMin = minValue
    const xMax = maxValue

    const option = {
      title: {
        text: '水位-流量关系曲线',
        left: 'center',
        top: '0px',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'value',
        name: '水位 (m)',
        axisLine: { show: true },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
        min: xMin,
        max: xMax,
      },
      yAxis: {
        type: 'value',
        name: '流量 (m³/s)',
        axisLine: { show: true },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      series: [
        {
          data: xydatas,
          type: 'line',
          lineStyle: {
            color: '#409EFF',
            width: 3,
          },
          itemStyle: {
            color: '#409EFF',
          },
          areaStyle: {
            color: 'rgba(64,158,255,0.2)',
          },
        },
      ],
    }
    chartInstance.setOption(option)
    chartInstance.resize()
  })
}

const updateZdownQBatch = () => {
  const STCDT = selectSTCDT.value
  const newData = tableData.value
  const oldData = oldTableData
  updateZdownQBatchAxios(STCDT, oldData, newData).then(() => {
    // 更新成功后，重新获取数据
    getZdownQ()
  })
}

const rowClickCallback = (row) => {
  clickedRow.value = row
  console.log('点击的行数据:', row)
  // 这里可以添加点击行后的逻辑
}

const deleteDailyFlow = () => {
  if (!clickedRow.value) {
    ElMessage.warning('请先在表格中选中你要删除的那一行数据')
    return
  }
  deleteDialogVisible.value = true
}

const deleteDialogCallback = () => {
  let oldClickedRow
  // 通过clickedRow找到要删除的行的索引
  const index = tableData.value.findIndex(
    (item) => item.Z_down === clickedRow.value.Z_down && item.Q_down === clickedRow.value.Q_down,
  )
  if (index !== -1) {
    oldClickedRow = oldTableData[index] // 使用旧数据table，防止新数据的日期被修改，无法和数据库定位
  } else {
    ElMessage.error('删除失败，请刷新重试')
    return
  }
  deleteZdownQAxios(selectSTCDT.value, oldClickedRow.Z_down, oldClickedRow.Q_down).then(() => {
    deleteDialogVisible.value = false
    // 删除成功后，重新获取数据
    getZdownQ()
    clickedRow.value = null // 清空选中的行数据
  })
}

const addDailyFlow = () => {
  addDialogVisible.value = true
  addDataForm.value = {
    Z_down: null,
    Q_down: null,
  }
}

const addDialogCallback = () => {
  // 参数校验
  const Z_down = addDataForm.value.Z_down
  const Q_down = addDataForm.value.Q_down
  if (!Z_down || !Q_down) {
    ElMessage.warning('请填写完整的新增数据')
    return
  }
  addZdownQAxios(selectSTCDT.value, Z_down, Q_down).then(() => {
    addDialogVisible.value = false
    // 新增成功后，重新获取数据
    getZdownQ()
  })
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100%;
}

.left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 380px;
  border-right: 2px solid #e4e7ed;
  background-color: #fff;
  padding: 30px;
  box-sizing: border-box;
}

.left-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.station-select-row {
  display: flex;
  flex-direction: column;
  justify-content: center; /* 让整行水平居中 */
  flex-wrap: wrap;
  gap: 8px;
}

.form-row {
  display: flex;
  align-items: center;
}

.form-row .form-label {
  display: inline-block;
  width: 110px;
}

.form-input-flex {
  flex: 1;
  min-width: 0;
}

.button-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 15px;
}

.left-bottom {
  overflow: auto;
}

.right {
  flex: 1;
  margin-top: 40px;
}

.chart-container {
  width: 100%;
  height: 100%;
  padding: 0;
  margin: 0;
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
