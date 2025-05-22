import axios from 'axios'

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
      return
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
    return
  }

  const paramValues = `((${modifiedRows.join(')||(')}))`

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

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    if (response.status === 200) {
      ElMessage.success('更新成功')
    }
  } catch (err) {
    console.error('更新失败:', err)
    ElMessage.error('更新失败，请刷新数据后重试')
  }
}
