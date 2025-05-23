import axios from 'axios'
import { formatDate } from '@/utils/format'

// 获取月蒸发量
export const getMonthEvaporationAxios = async (STCDT) => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getMonthE', 'STCDT', STCDT],
  }
  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
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

// 保存月蒸发量
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

  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
  const errorMessage = response.data[1]
  if (errorMessage === '') {
    ElMessage.success('更新成功')
  } else {
    ElMessage.error(errorMessage)
    return Promise.reject(new Error(errorMessage)) // 标志业务失败
  }
}

// 获取日流量数据
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

  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
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

// 保存日均流量数据
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

  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
  const errorMessage = response.data[1]
  if (errorMessage === '') {
    ElMessage.success('保存成功')
  } else {
    ElMessage.error(errorMessage)
    return Promise.reject(new Error(errorMessage)) // 标志业务失败
  }
}

// 删除指定时间的日流量数据
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

  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
  const errorMessage = response.data[1]
  if (errorMessage === '') {
    ElMessage.success('删除成功')
  } else {
    ElMessage.error(errorMessage)
    return Promise.reject(new Error(errorMessage)) // 标志业务失败
  }
}

// 添加指定时间的日流量数据
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

  const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
  const errorMessage = response.data[1]
  if (errorMessage === '') {
    ElMessage.success('添加成功')
  } else {
    ElMessage.error(errorMessage)
    return Promise.reject(new Error(errorMessage)) // 标志业务失败
  }
}
