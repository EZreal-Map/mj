import axios from 'axios'

// 1.1 获取水位-库容-蓄能数据
export const getReservoirVAxios = async (stcdt) => {
  stcdt = stcdt.slice(0, 6) // 这里后端是 截取前六位作为电站编码，比如 10000200 -> 100002
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getReservoirV', 'stcdt', stcdt],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const responseStr = response.data[0]
    let reservoirData = []

    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    reservoirData = retWrapper.ret.getReservoirV
    return reservoirData
  } catch (error) {
    console.error('请求或解析失败:', error)
    return []
  }
}

// 1.2 删除水位-库容-蓄能数据
export const deleteReservoirVAxios = async (stcdt, zi, v) => {
  const ptcode = stcdt.slice(0, 6)

  const paramValues = `((${ptcode}##${zi}##${v}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteReservoirV)',
      '(PTCode##ZI##V)',
      paramValues,
    ],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const errorMessage = response?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage)) // 标志业务失败
    }
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 1.3 更新水位-库容-蓄能数据
export const updateReservoirVBatchAxios = async (stcdt, oldData, newData, selectCurveType) => {
  // 根据 selectCurveType 确定要更新的列 ZI 或 ES
  // 根据后端接口参数，ES为 0 修改 ZI 和 V ; ES为 1 修改 ES 和 V ;
  const ES = selectCurveType === 'ES' ? 1 : 0
  const ptcode = stcdt.slice(0, 6)
  const modifiedRows = []

  for (let i = 0; i < newData.length; i++) {
    const oldRow = oldData[i]
    const newRow = newData[i]

    // 基础校验
    const zi = parseFloat(newRow[selectCurveType])
    console.log('selectCurveType:', selectCurveType)
    const v = parseFloat(newRow.V)
    const oldZi = parseFloat(oldRow[selectCurveType])
    const oldV = parseFloat(oldRow.V)

    if (isNaN(zi) || zi < 0 || isNaN(v) || v < 0) {
      console.error('数据无效或为负数', newRow)
      ElMessage.warning('请输入有效的非负数字')
      return Promise.reject()
    }

    // 是否有修改
    if (zi !== oldZi || v !== oldV) {
      modifiedRows.push(`${ptcode}##${zi}##${v}##${oldZi}##${oldV}##${ES}`)
    }
  }

  if (modifiedRows.length === 0) {
    ElMessage.warning('没有数据需要更新')
    return Promise.reject()
  }

  const paramValues = `((${modifiedRows.join(')##(')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateReservoirV)',
      '(PTCode##ZI##V##OldZI##OldV##ES)',
      paramValues,
    ],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const errorMessage = response?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 2.1 获取水位-流量数据
export const getZdownQAxios = async (stcdt) => {
  stcdt = stcdt.slice(0, 6) // 同样截取前六位作为电站编码
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getZdownQBASE', 'stcdt', stcdt],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const responseStr = response.data[0]
    let curveData = []

    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    curveData = retWrapper.ret.getZdownQBASE
    return curveData
  } catch (error) {
    console.error('水位-流量请求或解析失败:', error)
    return []
  }
}

// 2.2 批量更新水位-流量曲线数据
export const updateZdownQBatchAxios = async (stcdt, oldData, newData) => {
  const ptcode = stcdt.slice(0, 6)
  const modifiedRows = []

  for (let i = 0; i < newData.length; i++) {
    const oldRow = oldData[i]
    const newRow = newData[i]

    const z = parseFloat(newRow.Z_down)
    const q = parseFloat(newRow.Q_down)
    const oldZ = parseFloat(oldRow.Z_down)
    const oldQ = parseFloat(oldRow.Q_down)

    if (isNaN(z) || z < 0 || isNaN(q) || q < 0) {
      console.error('数据无效或为负数', newRow)
      ElMessage.warning('请输入有效的非负数字')
      return Promise.reject()
    }

    if (z !== oldZ || q !== oldQ) {
      modifiedRows.push(`${ptcode}##${z}##${q}##${oldZ}##${oldQ}`)
    }
  }

  if (modifiedRows.length === 0) {
    ElMessage.warning('没有数据需要更新')
    return Promise.reject()
  }

  const paramValues = `((${modifiedRows.join(')##(')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateZdownQ)',
      '(PTCode##Z_down##Q_down##OldZ_down##OldQ_down)',
      paramValues,
    ],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const errorMessage = response?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    ElMessage.success('更新成功')
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 2.3 删除水位-流量数据
export const deleteZdownQAxios = async (stcdt, z_down, q_down) => {
  const ptcode = stcdt.slice(0, 6)

  const paramValues = `((${ptcode}##${z_down}##${q_down}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteZdownQ)',
      '(PTCode##Z_down##Q_down)',
      paramValues,
    ],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const errorMessage = response?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    ElMessage.success('删除成功')
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 2.4 增加一条水位-流量数据
export const addZdownQAxios = async (stcdt, z_down, q_down) => {
  const ptcode = stcdt.slice(0, 6)

  const paramValues = `((${ptcode}##${z_down}##${q_down}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(addZdownQ)',
      '(PTCode##Z_down##Q_down)',
      paramValues,
    ],
  }

  try {
    const response = await axios.post('http://10.243.171.83:7777/api/Action/Run', data)
    const errorMessage = response?.data?.[1] ?? null
    if (errorMessage) {
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
    ElMessage.success('新增成功')
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}
