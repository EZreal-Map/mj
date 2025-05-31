<template>
  <div class="container">
    <div class="left">
      <div class="left-top">
        <div class="station-select-row">
          <div class="form-row">
            <span class="label">电站：</span>
            <el-select
              v-model="selectSTCDT"
              placeholder="请选择水文断面"
              class="form-input-flex"
              @change="selectSTCDTCallback"
            >
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="form-row">
            <span class="label">关系曲线：</span>
            <el-select
              v-model="selectCurveType"
              placeholder="请选择水文断面"
              class="form-input-flex"
              @change="selectCurveTypeCallback"
            >
              <el-option
                v-for="item in curveOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="button-group">
            <el-button type="primary" @click="getReservoirV">查询</el-button>
            <el-button type="primary" @click="addDailyFlow">新增</el-button>
            <el-button type="primary" @click="deleteDailyFlow">删除</el-button>
            <el-button type="primary" @click="updateReservoirVBatch">保存</el-button>
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
          <!-- 这里2个 v-if 目的是根据 selectCurveType 交换或者调整列的顺序 -->
          <!-- 1、（ZI）是水位-库容 -->
          <!-- 2、（ES）是库容-蓄能 -->
          <el-table-column v-if="selectCurveType === 'ES'" prop="V" label="库容(万m³)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.V"
                placeholder="不能为空"
                type="number"
                min="0"
                @mousewheel.prevent
                @input="updateChart(tableData)"
              />
            </template>
          </el-table-column>
          <el-table-column
            :prop="selectCurveType"
            :label="selectCurveType === 'ZI' ? '水位(m)' : '蓄能(万KWh)'"
          >
            <template #default="scope">
              <el-input
                v-model.number="scope.row[selectCurveType]"
                placeholder="不能为空"
                type="number"
                min="0"
                @mousewheel.prevent
                @input="updateChart(tableData)"
              />
            </template>
          </el-table-column>
          <el-table-column v-if="selectCurveType === 'ZI'" prop="V" label="库容(万m³)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.V"
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
    <div class="right">
      <div ref="chartRef" class="chart-container"></div>
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
        <p>
          <strong>{{ selectCurveType === 'ZI' ? '水位' : '蓄能' }}：</strong>
          {{ clickedRow?.[selectCurveType] }} {{ selectCurveType === 'ZI' ? 'm' : '万KWh' }}
        </p>
        <p><strong>库容：</strong>{{ clickedRow?.V }} 万m³</p>
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
    <el-form :model="dayFlowForm">
      <el-form-item label="日期：" label-width="100">
        <el-date-picker v-model="dayFlowForm.Date" type="date" placeholder="请选择新增时间" />
      </el-form-item>
      <div>
        <el-form-item label="流量(m³/s)：" label-width="100">
          <el-input v-model="dayFlowForm.flowQ" type="number" style="width: 220px" />
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
import { addDailyFlowAxios } from '@/apis/system-manage/hydrologicalData.js'

import {
  getReservoirVAxios,
  deleteReservoirVAxios,
  updateReservoirVBatchAxios,
} from '@/apis/system-manage/hydropowerPlantData.js'
import { ElMessage } from 'element-plus'

// TODO: 这里需要根据接口实际情况获得
const options = [
  {
    value: '10000200',
    label: '老木孔',
  },
  {
    value: '10000201',
    label: '老木孔区间',
  },
  {
    value: '10000300',
    label: '东风岩',
  },
  {
    value: '10000301',
    label: '东风岩区间',
  },
  {
    value: '10000400',
    label: '犍为',
  },
  {
    value: '10000401',
    label: '犍为区间',
  },
]
const selectSTCDT = ref('')
const tableData = ref([])
let oldTableData = {} // 用于保存原始数据

const curveOptions = [
  { value: 'ZI', label: '水位-库容' },
  { value: 'ES', label: '库容-蓄能' },
]
const selectCurveType = ref('ZI') // 选择的曲线类型

const chartRef = ref(null)
let chartInstance = null

const clickedRow = ref(null) // 用于保存选中的行数据
const deleteDialogVisible = ref(false)

const addDialogVisible = ref(false)
const dayFlowForm = ref(null)

const getReservoirV = async () => {
  const data = await getReservoirVAxios(selectSTCDT.value)
  tableData.value = data
  console.log('获取的水位库容数据:', data)
  oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝原始数据
  updateChart(data)
}

const init = () => {
  if (!selectSTCDT.value) {
    selectSTCDT.value = options[0].value // 默认选中第一个电站
  }
  getReservoirV()
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

    // 设置图表选项
    let xdatas
    let ydatas
    let titleText
    let xAxisText
    let yAxisText
    if (selectCurveType.value === 'ZI') {
      // 水位-库容关系曲线
      titleText = '水位-库容关系曲线'
      xAxisText = '水位 (m)'
      yAxisText = '库容 (万m³)'
      xdatas = data.map((item) => parseFloat(item[selectCurveType.value]))
      ydatas = data.map((item) => parseFloat(item['V']))
    } else if (selectCurveType.value === 'ES') {
      // 库容-蓄能关系曲线
      titleText = '库容-蓄能关系曲线'
      xAxisText = '库容 (万m³)'
      yAxisText = '蓄能 (万KWh)'
      xdatas = data.map((item) => parseFloat(item['V']))
      ydatas = data.map((item) => parseFloat(item[selectCurveType.value]))
    }

    // // 因为自动的y轴比例尺显示数据不行，所有手动设置 yMin 和 yMax
    // // 计算最大最小值并加减 10% padding
    // const minValue = Math.min(...ydatas)
    // const maxValue = Math.max(...ydatas)
    // const padding = (maxValue - minValue) * 0.1 // 10% 的 padding

    // const yMin = Math.floor(minValue - padding)
    // const yMax = Math.ceil(maxValue + padding)

    const option = {
      title: {
        text: titleText,
        left: 'center',
        top: '0px',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        name: xAxisText,
        data: xdatas,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: yAxisText,
        axisLine: { show: true },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      series: [
        {
          data: ydatas,
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

const updateReservoirVBatch = () => {
  const STCDT = selectSTCDT.value
  const newData = tableData.value
  const oldData = oldTableData
  updateReservoirVBatchAxios(STCDT, oldData, newData, selectCurveType.value).then(() => {
    // 更新成功后，重新获取数据
    // getDailyAverageFlowData()
    getReservoirV()
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
  deleteReservoirVAxios(selectSTCDT.value, clickedRow.value.ZI, clickedRow.value.V).then(() => {
    deleteDialogVisible.value = false
    // 删除成功后，重新获取数据
    // getDailyAverageFlowData()
    getReservoirV()
    clickedRow.value = null // 清空选中的行数据
    ElMessage.success('删除成功')
  })
}

// TODO: 这里“新增”的后端接口有问题，报错
const addDailyFlow = () => {
  ElMessage.warning('此功能未完成')

  // addDialogVisible.value = true
  dayFlowForm.value = {
    Date: '',
    flowQ: '',
  }
}

const addDialogCallback = () => {
  // 参数校验
  const addTime = dayFlowForm.value.Date
  const addFlow = dayFlowForm.value.flowQ
  if (!addTime || !addFlow) {
    ElMessage.warning('请填写完整的新增数据')
    return
  }
  addDailyFlowAxios(selectSTCDT.value, addTime, addFlow).then(() => {
    addDialogVisible.value = false
    // 新增成功后，重新获取数据
    // getDailyAverageFlowData()
    getReservoirV()
  })
}

const selectSTCDTCallback = () => {
  getReservoirV()
}

const selectCurveTypeCallback = () => {
  // 切换曲线类型时，更新图表
  updateChart(tableData.value)
  clickedRow.value = null // 清空选中的行数据
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

.form-row .label {
  display: inline-block;
  width: 100px;
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
