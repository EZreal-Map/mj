import request from '@/utils/request'
import { formatDate } from '@/utils/format'

// 1.1 获取月蒸发量
export const getMonthEvaporationAxios = async (STCDT) => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getMonthE', 'STCDT', STCDT],
  }
  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let monthE = []
  try {
    // 用一个中间对象来获取 eval 执行后的 ret
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    monthE = retWrapper.ret.getMonthE
  } catch (e) {
    console.error('解析失败', e)
  }
  return monthE
}

// 1.2 保存月蒸发量
export const updateMonthEvaporationBatchAxios = async (STCDT, oldData, newData) => {
  const modifiedRows = []

  for (let i = 0; i < newData.length; i++) {
    const oldRow = oldData[i]
    const newRow = newData[i]

    // 数据校验（首先非空，非数字，其次判断非负）
    if (
      newRow.E_Day === '' ||
      newRow.E_Day === null ||
      isNaN(newRow.E_Day) ||
      parseFloat(newRow.E_Day) < 0
    ) {
      console.error('数据无效或为负数', newRow)
      ElMessage.warning('请输入有效的非负数字')
      return Promise.reject() // 标志业务失败
    }
    // 判断是否修改（注意要转成字符串或数字比较）
    if (oldRow.Month !== newRow.Month || parseFloat(oldRow.E_Day) !== parseFloat(newRow.E_Day)) {
      modifiedRows.push(
        `${STCDT}##${newRow.Month}##${newRow.E_Day}##${oldRow.Month}##${oldRow.E_Day}`,
      )
    }
  }
  // 如果没有数据需要更新，直接返回，并且提示
  if (modifiedRows.length === 0) {
    ElMessage.warning('没有数据需要更新')
    return Promise.reject() // 标志业务失败
  }

  const paramValues = `((${modifiedRows.join(')##(')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(updateMonthEvaporation)',
      '(STCDT##Month##E_Day##OldMonth##OldE_Day)',
      paramValues,
    ],
  }

  await request.post('Run', data)
  ElMessage.success('更新成功')
}

// 2.1 获取日流量数据
export const getDailyFlowAxios = async (stcdt, begintime, endtime) => {
  // 格式化时间 date对象 -> YYYY-MM-DD
  begintime = formatDate(begintime)
  endtime = formatDate(endtime)
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doreaddata/getdata',
      'getDayFlowData',
      'stcdt#begintime#endtime',
      `${stcdt}#${begintime}#${endtime}`,
    ],
  }

  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let dayFlowData = []

  try {
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    dayFlowData = retWrapper.ret.getDayFlowData
  } catch (e) {
    console.error('解析失败', e)
  }

  return dayFlowData
}

// 2.2 保存日均流量数据
export const updateDailyFlowBatchAxios = async (STCDT, oldData, newData) => {
  const modifiedRows = []

  for (let i = 0; i < newData.length; i++) {
    const oldRow = oldData[i]
    const newRow = newData[i]

    // 数据校验：非空、是数字 （此处可以不判断负数，因为流量万一可以为负数了）
    if (newRow.flowQ === '' || newRow.flowQ === null || isNaN(newRow.flowQ)) {
      console.error('数据无效', newRow)
      ElMessage.warning('请输入有效负数字')
      return Promise.reject() // 标志业务失败
    }

    // 判断是否修改
    if (parseFloat(newRow.flowQ) !== parseFloat(oldRow.flowQ)) {
      modifiedRows.push(`${STCDT}##${newRow.Date}##${newRow.flowQ}`)
    }
  }

  // 无变更数据时提示
  if (modifiedRows.length === 0) {
    ElMessage.warning('没有数据需要更新')
    return Promise.reject() // 标志业务失败
  }

  const paramValues = `((${modifiedRows.join(')##(')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(modifyQDay)',
      '(STCDT##Time##Value)',
      paramValues,
    ],
  }

  await request.post('Run', data)
  ElMessage.success('保存成功')
}

// 2.3 删除指定时间的日流量数据
export const deleteDailyFlowAxios = async (STCDT, deleteTime) => {
  if (!STCDT || !deleteTime) {
    ElMessage.warning('参数不完整，无法删除')
    return
  }

  const paramValues = `((${STCDT}##${deleteTime}##DD))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteQDay)',
      '(STCDT##Time##HQ)',
      paramValues,
    ],
  }

  await request.post('Run', data)
  ElMessage.success('删除成功')
}

// 2.4 添加指定时间的日流量数据
export const addDailyFlowAxios = async (STCDT, time, value) => {
  // PTcode 为 STCDT的前6位
  const PTCode = STCDT.slice(0, 6)
  // 格式化时间 date对象 -> YYYY-MM-DD
  time = formatDate(time)
  const paramValues = `((${PTCode}##${time}##${value}##${STCDT}##DD))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(AddDayFlowData)',
      '(PTCode##Time##Value##STCDT##HQ)',
      paramValues,
    ],
  }

  await request.post('Run', data)
  ElMessage.success('添加成功')
}

// 3.1 获取多年平均月流量数据 （左小表：多年平均）
export const getSelSeqflowDataAxios = async (ptcode, interval = 'MM') => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doreaddata/getdata',
      'getselSeqflowData',
      'ptcode#Sublocal#intSeq#interval#selyear',
      `${ptcode}#false#50#${interval}#-1`,
    ],
  }

  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let selSeqflowData = []
  try {
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    selSeqflowData = retWrapper.ret.getselSeqflowData
  } catch (e) {
    console.error('解析失败', e)
  }
  return selSeqflowData
}

// 3.2 获取年度平均月流量数据（左小表：去年同期/近3年平均）
export const getSelYearflowDataAxios = async (ptcode, year, interval = 'MM') => {
  if (!year) {
    // 如果year为空，就获取去年的字符串，代表查询去年同期数据
    const date = new Date()
    year = date.getFullYear() - 1
  }
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doreaddata/getdata',
      'getselYearflowData',
      'ptcode#Sublocal#year#interval',
      `${ptcode}#false#${year}#${interval}`,
    ],
  }

  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let yearFlowData = []
  try {
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    yearFlowData = retWrapper.ret.getselYearflowData
    const firstKey = Object.keys(yearFlowData[0])[0]
    // 如果第一个键是 FORETIME，则将其转换为小写 foretime
    // 这里是适配 “近3年平均” 后端返回的数据格式 全为大写 FORETIME 和 FOREDATA
    if (firstKey === 'FORETIME') {
      const lowerCasedyearFlowData = yearFlowData.map((item) => ({
        foretime: item.FORETIME,
        foredata: item.FOREDATA,
      }))
      return lowerCasedyearFlowData
    }
    return yearFlowData
  } catch (e) {
    console.error('解析失败', e)
  }
  return yearFlowData
}

// 3.3 获取n年月平均流量数据 （右大表）
export const getMonthlyOriginalHydroAxios = async (ptcode) => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'PTCode'],
    values: ['/pms/Base', '/DataGridQuery/GetOriginalHydro', ptcode],
  }

  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let originalHydroData = []
  try {
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    originalHydroData = retWrapper.ret.DGFlows
  } catch (e) {
    console.error('解析失败', e)
  }
  return originalHydroData
}

// 3.4 保存月流量数据
export const updateMonthlyFlowBatchAxios = async (ptcode, tableData, year) => {
  // 参数校验
  // 1. 判断year是否为空
  if (!year) {
    ElMessage.warning('无效保存，没有选中任何年份')
    return Promise.reject(new Error('无效保存，没有年份')) // 标志业务失败
  }
  // 2. 判断tableData是否为数组，且长度为12
  if (!Array.isArray(tableData) || tableData.length !== 12) {
    ElMessage.warning('请确保数据为12个月份')
    return Promise.reject(new Error('请确保数据为12个月份'))
  }
  // 3. 循环判断tableData中是否有空值或无效值
  for (let i = 0; i < tableData.length; i++) {
    const item = tableData[i]
    if (
      item.foredata === '' ||
      item.foredata === null ||
      typeof item.foredata === 'undefined' ||
      isNaN(Number(item.foredata))
    ) {
      ElMessage.warning(`第${i + 1}月数据为空或无效，请检查！`)
      return Promise.reject(new Error(`第${i + 1}月数据为空或无效`))
    }
  }

  const STCDT = ptcode
  // 取出 foredata，并转成数字，顺序为月份 1~12
  const monthlyValues = tableData.map((item) => {
    const val = Number(item.foredata)
    return isNaN(val) ? 0 : val // 避免非数字，默认为0
  })

  // 拼接参数字符串，格式：(PTCode##Year##M1##M2##...##M12##STCDT)
  const paramStr = `${[ptcode, year, ...monthlyValues, STCDT].join('##')}`
  const paramValues = `((${paramStr}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateQMonth)',
      '(PTCode##Year##M1##M2##M3##M4##M5##M6##M7##M8##M9##M10##M11##M12##STCDT)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
    ElMessage.success(`${year}年的月平均流量数据更新成功`)
  } catch (error) {
    ElMessage.error('请求失败')
    return Promise.reject(error)
  }
}

// 3.5 删除月流量数据
export const deleteMonthlyFlowAxios = async (ptcode, year) => {
  if (!ptcode || !year) {
    ElMessage.warning('参数不完整，无法删除')
    return
  }

  const paramValues = `((${ptcode}##${year}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteQMonth)',
      '(PTCode##Year)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 3.6 添加月流量数据
// 添加指定年份的月流量数据
export const addMonthlyFlowAxios = async (STCDT, params) => {
  const { Year, M1, M2, M3, M4, M5, M6, M7, M8, M9, M10, M11, M12 } = params
  // ptcode 为 STCDT的前6位
  const ptcode = STCDT.slice(0, 6)
  // 构造参数值字符串
  const paramValues = `((${ptcode}##${Year}##${M1 ?? 0}##${M2 ?? 0}##${M3 ?? 0}##${M4 ?? 0}##${M5 ?? 0}##${M6 ?? 0}##${M7 ?? 0}##${M8 ?? 0}##${M9 ?? 0}##${M10 ?? 0}##${M11 ?? 0}##${M12 ?? 0}##${Year}##${STCDT}##))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(AddQMonth)',
      '(PTCode##Year##M1##M2##M3##M4##M5##M6##M7##M8##M9##M10##M11##M12##QYear##STCDT)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 4.1 获取多年平均旬流量数据 （左小表：多年平均） （同 3.1）
// 4.2 获取年度平均旬流量数据（左小表：去年同期/近3年平均） （同 3.2）
// 4.3 获取旬流量数据 （右大表）
export const getAllTDFlowDataAxios = async (STCDT) => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getAllTDFlowData', 'stcdt', STCDT],
  }

  const response = await request.post('Run', data)
  const responseStr = response.data[0]
  let resultData = []
  try {
    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    // 按照你返回的数据结构设定提取字段
    resultData = retWrapper.ret.getAllTDFlowData
  } catch (e) {
    console.error('解析失败', e)
  }

  return resultData
}
// 4.4 保存旬流量数据
export const updateTendayFlowBatchAxios = async (STCDT, tableData, year) => {
  // ptcode 为 STCDT的前6位
  const ptcode = STCDT.slice(0, 6)
  // 1. 校验参数
  if (!year) {
    ElMessage.warning('无效保存，没有选中任何年份')
    return Promise.reject(new Error('无效保存，没有年份'))
  }
  if (!Array.isArray(tableData) || tableData.length !== 36) {
    ElMessage.warning('请确保数据为36个旬数据')
    return Promise.reject(new Error('请确保数据为36个旬数据'))
  }

  for (let i = 0; i < tableData.length; i++) {
    const item = tableData[i]
    if (
      item.foredata === '' ||
      item.foredata === null ||
      typeof item.foredata === 'undefined' ||
      isNaN(Number(item.foredata))
    ) {
      ElMessage.warning(`第${i + 1}旬数据为空或无效，请检查！`)
      return Promise.reject(new Error(`第${i + 1}旬数据为空或无效`))
    }
  }

  // 2. 取出 foredata，并转成数字，顺序为 TD1~TD36
  const tdValues = tableData.map((item) => {
    const val = Number(item.foredata)
    return isNaN(val) ? 0 : val
  })

  // 3. 拼接参数字符串
  const paramStr = `${[ptcode, STCDT, year, ...tdValues].join('##')}`
  const paramValues = `((${paramStr}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateQTenDays)',
      '(PTCode##STCDT##Year##TD1##TD2##TD3##TD4##TD5##TD6##TD7##TD8##TD9##TD10##TD11##TD12##TD13##TD14##TD15##TD16##TD17##TD18##TD19##TD20##TD21##TD22##TD23##TD24##TD25##TD26##TD27##TD28##TD29##TD30##TD31##TD32##TD33##TD34##TD35##TD36)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
    ElMessage.success(`${year}年的逐旬流量数据更新成功`)
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 4.5 删除旬流量数据
export const deleteTendayFlowAxios = async (STCDT, year) => {
  // ptcode 为 STCDT的前6位
  const ptcode = STCDT.slice(0, 6)
  const paramValues = `((${ptcode}##${STCDT}##${year}))`
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteQTenDays)',
      '(PTCode##STCDT##Year)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}
// 4.6 添加月流量数据
export const addTendayFlowAxios = async (STCDT, params) => {
  const Year = params.Year
  const ptcode = STCDT.slice(0, 6)

  // 构造 36 旬数据，默认 0
  const TDs = Array.from({ length: 36 }, (_, i) => params[`TD${i + 1}`] ?? 0)

  // 拼接 paramValues 字符串
  const paramValues = `((${ptcode}##${STCDT}##${Year}##${TDs.join('##')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(AddQTenDays)',
      '(PTCode##STCDT##Year##TD1##TD2##TD3##TD4##TD5##TD6##TD7##TD8##TD9##TD10##TD11##TD12##TD13##TD14##TD15##TD16##TD17##TD18##TD19##TD20##TD21##TD22##TD23##TD24##TD25##TD26##TD27##TD28##TD29##TD30##TD31##TD32##TD33##TD34##TD35##TD36)',
      paramValues,
    ],
  }

  try {
    await request.post('Run', data)
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}
