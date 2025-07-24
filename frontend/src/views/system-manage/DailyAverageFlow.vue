<template>
  <div class="container">
    <div class="right">
      <div ref="chartRef" class="chart-container"></div>
    </div>
    <div class="left">
      <div class="left-top">
        <div class="station-select-row">
          <div class="form-row">
            <span class="label">水文断面：</span>
            <el-select v-model="selectSTCDT" placeholder="请选择水文断面" class="form-input-flex">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
          <div class="form-row">
            <span class="label">开始时间：</span>
            <el-date-picker v-model="startTime" type="date" placeholder="请选择开始时间" />
          </div>
          <div class="form-row">
            <span class="label">结束时间：</span>
            <el-date-picker v-model="endTime" type="date" placeholder="请选择结束时间" />
          </div>
          <div class="button-group">
            <el-button type="primary" @click="getDailyAverageFlowData">查询</el-button>
            <el-button type="primary" @click="addDailyFlow">新增</el-button>
            <el-button type="primary" @click="deleteDailyFlow">删除</el-button>
            <el-button type="primary" @click="updateDailyFlowBatch">保存</el-button>
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
          <el-table-column prop="Date" label="日期" width="100px"> </el-table-column>
          <el-table-column prop="flowQ" label="流量(m³/s)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.flowQ"
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
        <p><strong>日期：</strong>{{ clickedRow.Date }}</p>
        <p><strong>流量：</strong>{{ clickedRow.flowQ }} m³/s</p>
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
          <el-input v-model="dayFlowForm.flowQ" type="number" style="width: 220px" min="0" />
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
  getDailyFlowAxios,
  updateDailyFlowBatchAxios,
  deleteDailyFlowAxios,
  addDailyFlowAxios,
} from '@/apis/system-manage/hydrologicalData.js'

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

const endTime = ref(new Date())
const startTime = ref(new Date(Date.now() - 24 * 60 * 60 * 1000))

const chartRef = ref(null)
let chartInstance = null

const clickedRow = ref({ Date: '', flowQ: '' }) // 用于保存选中的行数据
const deleteDialogVisible = ref(false)

const addDialogVisible = ref(false)
const dayFlowForm = ref({
  Date: '',
  flowQ: '',
})

const getDailyAverageFlowData = () => {
  getDailyFlowAxios(selectSTCDT.value, startTime.value, endTime.value).then((data) => {
    tableData.value = data
    oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝原始数据
    clickedRow.value = { Date: '', flowQ: '' } // 清空选中的行数据
    // // 更新表格数据
    updateChart(data)
  })
}

const init = () => {
  if (!selectSTCDT.value) {
    selectSTCDT.value = options[0].value // 默认选中第一个电站
  }
  getDailyAverageFlowData()
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
    const dates = data.map((item) => item.Date)
    const values = data.map((item) => parseFloat(item.flowQ))

    const option = {
      title: {
        text: '日平均流量过程线',
        left: 'center',
        top: '0px',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        name: '日期',
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '日平均流量 (m³/s)',
        axisLine: { show: true },
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
        },
      },
      series: [
        {
          data: values,
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

const updateDailyFlowBatch = () => {
  const STCDT = selectSTCDT.value
  const newData = tableData.value
  const oldData = oldTableData
  updateDailyFlowBatchAxios(STCDT, oldData, newData).then(() => {
    // 更新成功后，重新获取数据
    getDailyAverageFlowData()
  })
}

const rowClickCallback = (row) => {
  clickedRow.value = row
  console.log('点击的行数据:', row)
  // 这里可以添加点击行后的逻辑
}

const deleteDailyFlow = () => {
  if (!clickedRow.value.Date || !clickedRow.value.flowQ) {
    ElMessage.warning('请先在表格中选中你要删除的那一行数据')
    return
  }
  deleteDialogVisible.value = true
}

const deleteDialogCallback = () => {
  let deleteTime = ''
  // 通过clickedRow找到要删除的行的索引
  const index = tableData.value.findIndex(
    (item) => item.Date === clickedRow.value.Date && item.flowQ === clickedRow.value.flowQ,
  )
  if (index !== -1) {
    deleteTime = oldTableData[index].Date // 使用旧数据的日期，防止新数据的日期被修改，无法和数据库定位
  } else {
    ElMessage.error('删除失败，请刷新重试')
    return
  }
  deleteDailyFlowAxios(selectSTCDT.value, deleteTime).then(() => {
    deleteDialogVisible.value = false
    // 删除成功后，重新获取数据
    getDailyAverageFlowData()
    clickedRow.value = { Date: '', flowQ: '' } // 清空选中的行数据
  })
}

const addDailyFlow = () => {
  addDialogVisible.value = true
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
    getDailyAverageFlowData()
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
