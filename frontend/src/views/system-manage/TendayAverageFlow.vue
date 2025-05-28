<template>
  <div class="container">
    <div class="left">
      <div class="left-top-space-between">
        <div class="left-top">
          <div class="station-select-row">
            <div class="form-row">
              <span class="label">水文断面：</span>
              <el-select
                v-model="selectSTCDT"
                placeholder="请选择水文断面"
                class="form-input-flex"
                @change="init"
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
              <el-button @click="getSelSeqflowData" :class="{ active: activeButtonNumber === 1 }"
                >多年平均</el-button
              >
              <el-button @click="getSelYearflowData()" :class="{ active: activeButtonNumber === 2 }"
                >去年同期</el-button
              >
              <el-button
                @click="getSelYearflowData(-3)"
                :class="{ active: activeButtonNumber === 3 }"
                >近3年平均</el-button
              >
            </div>
          </div>
        </div>

        <div class="left-table">
          <el-table :data="tableData" style="width: 100%" height="100%">
            <el-table-column prop="foretime" label="月" width="100px"> </el-table-column>
            <el-table-column prop="foredata" label="流量(m³/s)">
              <template #default="scope" v-if="activeButtonNumber > 3">
                <el-input
                  v-model.number="scope.row.foredata"
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

      <div class="button-group-bottom">
        <el-button type="primary" @click="init">查询</el-button>
        <el-button type="primary" @click="addTendayFlow">新增</el-button>
        <el-button type="primary" @click="deleteTendayFlow">删除</el-button>
        <el-button type="primary" @click="updateMonthlyFlowBatch">保存</el-button>
      </div>
    </div>
    <div class="right">
      <div class="right-table">
        <el-table
          ref="rightTableRef"
          :data="rightTableData"
          stripe
          style="width: 100%"
          height="100%"
          @row-click="rowClickCallback"
          highlight-current-row
        >
          <el-table-column prop="Year" label="年份"> </el-table-column>
          <el-table-column
            v-for="tendayIndex in 12 * 3"
            :key="tendayIndex"
            :prop="`TD${tendayIndex}`"
            :label="`${tendayIndex}旬`"
          />
        </el-table>
      </div>
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
        <p><strong>年份：</strong>{{ clickedRow?.Year }}</p>
        <p><strong>一月：</strong>{{ clickedRow?.flowQMonth1 }} m³/s</p>
        <p><strong>二月：</strong>{{ clickedRow?.flowQMonth2 }} m³/s</p>
        <p><strong>三月：</strong>{{ clickedRow?.flowQMonth3 }} m³/s</p>
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
  <!-- 新增输入弹窗 -->
  <el-dialog v-model="addDialogVisible" title="新增" width="400">
    <el-form :model="tendayFlowForm">
      <el-form-item label="年份：">
        <el-input v-model="tendayFlowForm.Year" placeholder="请输入年份" type="number" />
      </el-form-item>
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
  getSelSeqflowDataAxios,
  getAllTDFlowDataAxios,
  getSelYearflowDataAxios,
  updateTendayFlowBatchAxios,
  deleteTendayFlowAxios,
  addTendayFlowAxios,
} from '@/apis/system-manage/hydrologicalData.js'
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

const chartRef = ref(null) // 用于存储echarts实例DOM
let chartInstance = null

const clickedRow = ref(null) // 用于保存选中的行数据
const deleteDialogVisible = ref(false)

const addDialogVisible = ref(false)
const tendayFlowFormInit = {
  Year: new Date().getFullYear(), // 默认年份为当前年份
  // 其他：TD1, TD2, ..., TD36 都是空 （后端会自动填充默认值 0）
}
const tendayFlowForm = ref({ ...tendayFlowFormInit }) // 用于存储新增表单数据

const rightTableRef = ref(null) // 用于存储右侧表格的DOM
const rightTableData = ref([]) // 用于存储右侧表格数据

const activeStringOptions = { 1: '多年平均', 2: '去年同期', 3: '近3年平均' } // 用于存储当前选中的字符串
const activeButtonNumber = ref(1) // 用于存储当前选中的按钮

// interval 用于定义后端请求的参数
const interval = 'TD' // TD: Tenday 旬 / MM: Month 月

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
    const dates = data.map((item) => item.foretime)
    const values = data.map((item) => parseFloat(item.foredata))

    const label = activeStringOptions[activeButtonNumber.value] ?? activeButtonNumber.value + '年'
    const text = `旬平均流量过程线 - ${label}`

    const option = {
      title: {
        text: text,
        left: 'center',
        top: '20px',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        name: '月份',
        data: dates,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '旬平均流量 (m³/s)',
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

const rowClickCallback = (row, message = true) => {
  clickedRow.value = row
  console.log('点击的行数据:', row)
  let tempArray = []
  for (let i = 1; i <= 12 * 3; i++) {
    let tempObject = {}
    tempObject['foretime'] = i // 设置月份
    tempObject['foredata'] = row[`TD${i}`] // 获取对应月份的流量数据
    tempArray.push(tempObject)
  }
  tableData.value = tempArray // 更新表格数据
  updateChart(tableData.value) // 更新图表
  activeButtonNumber.value = clickedRow.value.Year
  if (message) ElMessage.success(`已选中年份：${clickedRow.value.Year}对应的旬平均流量数据`)
}

// 3.1 获取多年平均流量数据 （左小表：多年平均）
const getSelSeqflowData = async (message = true) => {
  activeButtonNumber.value = 1 // 设置当前选中按钮为 “多年平均”
  getSelSeqflowDataAxios(selectSTCDT.value, interval).then((data) => {
    console.log('获取的水文断面数据（小表）:', data)
    tableData.value = data
    updateChart(data)
    rightTableRef.value.setCurrentRow() // 清除右侧表格的选中行（高亮）
    clickedRow.value = null // 清空选中的行数据

    if (message) {
      ElMessage.success(`获取水文断面数据成功：${activeStringOptions[activeButtonNumber.value]}`)
    }
  })
}

// 3.2 获取年度流量数据（左小表：去年同期/近3年平均）
const getSelYearflowData = (year) => {
  activeButtonNumber.value = year === -3 ? 3 : 2 // 设置当前选中按钮为 “近3年平均” 或 “去年同期”
  getSelYearflowDataAxios(selectSTCDT.value, year, interval).then((data) => {
    console.log('获取的水文断面数据（小表）:', data)
    tableData.value = data
    updateChart(data)
    rightTableRef.value.setCurrentRow() // 清除右侧表格的选中行（高亮）
    clickedRow.value = null // 清空选中的行数据
    ElMessage.success(`获取水文断面数据成功：${activeStringOptions[activeButtonNumber.value]}`)
  })
}

// 3.3 获取n年旬平均流量数据 （右大表）
const getOriginalHydro = async () => {
  const data = await getAllTDFlowDataAxios(selectSTCDT.value)
  rightTableData.value = data
  console.log('获取的水文断面数据（大表）:', data)
  if (clickedRow.value) {
    const matchRow = rightTableData.value.find((item) => item.Year === clickedRow.value.Year)
    if (matchRow) {
      rightTableRef.value.setCurrentRow(matchRow)
    }
  }
}

const init = (message = true) => {
  if (!selectSTCDT.value) {
    selectSTCDT.value = options[0].value // 默认选中第一个电站
  }
  getOriginalHydro() // 获取大表数据
  getSelSeqflowData(false) // 获取小表数据 （默认是第一个 “多年平均”）
  if (message) ElMessage.success(`获取水文断面数据成功`)
}
init(false) // 初始化时不显示提示信息

const updateMonthlyFlowBatch = () => {
  const STCDT = selectSTCDT.value
  const Year = clickedRow.value ? clickedRow.value.Year : ''

  updateTendayFlowBatchAxios(STCDT, tableData.value, Year).then(() => {
    // 更新成功后，重新获取数据
    getOriginalHydro() // 只更新大表
  })
}

const deleteTendayFlow = () => {
  if (!clickedRow.value?.Year) {
    ElMessage.warning('请先在表格中选中你要删除的那一行数据')
    return
  }
  deleteDialogVisible.value = true
}

const deleteDialogCallback = () => {
  deleteTendayFlowAxios(selectSTCDT.value, clickedRow.value.Year).then(() => {
    deleteDialogVisible.value = false
    // 删除成功后，重新获取数据
    init(false) // 重新初始化数据
    ElMessage.success(`${clickedRow.value.Year}年旬流量数据删除成功`)
    clickedRow.value = null // 清空选中的行数据
  })
}

const addTendayFlow = () => {
  // 故意不清空 tendayFlowForm，以便用户可以在已有数据的基础上新增
  // tendayFlowForm.value = { ...tendayFlowFormInit } // 重置表单
  addDialogVisible.value = true
}

const addDialogCallback = () => {
  // 参数校验
  // 校验 Year 格式是否正确（4位数字且在合理范围）
  let year = tendayFlowForm.value.Year
  const currentYear = new Date().getFullYear()
  if (!/^\d{4}$/.test(year) || year < 1900 || year > currentYear + 10) {
    ElMessage.warning(`请输入有效的年份(1900-${currentYear + 10})`)
    return
  }

  addTendayFlowAxios(selectSTCDT.value, tendayFlowForm.value).then(async () => {
    addDialogVisible.value = false
    // 新增成功后，重新获取数据
    await getOriginalHydro() // 重新初始化数据（仅仅初始化大表数据）
    // 选中新增的行
    // 从新数据中重新找到匹配行
    const matchRow = rightTableData.value.find((item) => item.Year === year)
    console.log('匹配到的行数据:', matchRow)
    if (matchRow) {
      rightTableRef.value.setCurrentRow(matchRow) // 选中新增的行保持高亮
      rowClickCallback(matchRow, false) // 更新左侧表格和图表
    }
    ElMessage.success(`${year}年旬流量数据添加成功，并全部填充默认值 0`)
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
  padding: 30px 30px 20px;
  box-sizing: border-box;
  justify-content: space-between;
}

.left-top-space-between {
  display: flex;
  flex-direction: column;
  flex: 1;
  /* 这里 100px 解决了因为想要space-between作用，加div包裹，但是导致bottom-table 撑开父亲高度。 */
  /* 玄学！ 不想搞清楚了 (*^_^*) */
  height: 100px;
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

.button-group .el-button.active {
  background-color: #ecf5ff;
  color: #409eff;
}

.left-table {
  overflow: auto;
}

.button-group-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}

.right {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.right-table {
  flex: 1;
  overflow: auto;
}

.chart-container {
  width: 100%;
  height: 300px;
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
