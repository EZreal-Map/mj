<template>
  <div class="container">
    <div class="left">
      <div class="left-top">
        <div class="station-select-row">
          <span>电站：</span>
          <el-select
            v-model="selectValue"
            placeholder="请选择电站"
            style="width: 180px"
            @change="getMonthEvaporation"
          >
            <el-option
              v-for="item in options"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <div class="button-group">
            <el-button type="primary" @click="updateMonthEvaporationBatch">保存</el-button>
          </div>
        </div>
      </div>

      <div class="left-bottom">
        <el-table :data="tableData" stripe style="width: 100%">
          <el-table-column prop="Month" label="月份" width="100px"> </el-table-column>
          <el-table-column prop="E_Day" label="多年平均日蒸发量(mm)">
            <template #default="scope">
              <el-input
                v-model.number="scope.row.E_Day"
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
</template>

<script setup>
import { ref, nextTick } from 'vue'
import * as echarts from 'echarts'
import {
  getMonthEvaporationAxios,
  updateMonthEvaporationBatchAxios,
} from '@/apis/system-manage/hydrologicalData.js'

// TODO: 这里需要根据接口实际情况获得
const options = [
  {
    value: '10000200E',
    label: '老木孔',
  },
  {
    value: '10000300E',
    label: '东风岩',
  },
  {
    value: '10000400E',
    label: '犍为',
  },
  {
    value: '10000500E',
    label: '龙溪口',
  },
]
const selectValue = ref('')
const tableData = ref([])
let oldTableData = {} // 用于保存原始数据

const chartRef = ref(null)
let chartInstance = null

const getMonthEvaporation = () => {
  getMonthEvaporationAxios(selectValue.value).then((data) => {
    tableData.value = data
    oldTableData = JSON.parse(JSON.stringify(data)) // 深拷贝原始数据
    // 更新表格数据
    updateChart(data)
    console.log('获取到的表格数据:', data)
  })
}

const init = () => {
  selectValue.value = options[0].value // 默认选中第一个电站
  getMonthEvaporation()
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
    const months = data.map((item) => item.Month + '月')
    const values = data.map((item) => parseFloat(item.E_Day))

    const option = {
      title: {
        text: '多年平均日蒸发量趋势',
        left: 'center',
      },
      tooltip: {
        trigger: 'axis',
      },
      xAxis: {
        type: 'category',
        name: '月份',
        data: months,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        name: '日蒸发量 (mm)',
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

const updateMonthEvaporationBatch = () => {
  const STCDT = selectValue.value
  const newData = tableData.value
  const oldData = oldTableData
  updateMonthEvaporationBatchAxios(STCDT, oldData, newData)
}
</script>

<style scoped>
.container {
  display: flex;
  height: 100%;
}

.left {
  width: 380px;
  border-right: 2px solid #e4e7ed;
  background-color: #fff;
  padding: 30px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.left-top {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.station-select-row {
  display: flex;
  align-items: center;
  justify-content: center; /* 让整行水平居中 */
  flex-wrap: wrap;
  gap: 8px;
}

.left-bottom {
  margin-top: 20px;
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
</style>
