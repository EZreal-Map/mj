import request from '@/utils/request'

// 1.1 获取水位-库容-蓄能数据
export const getReservoirVAxios = async (stcdt) => {
  stcdt = stcdt.slice(0, 6) // 这里后端是 截取前六位作为电站编码，比如 10000200 -> 100002
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: ['/pms/Base', '/doreaddata/getdata', 'getReservoirV', 'stcdt', stcdt],
  }

  try {
    const response = await request.post('', data)
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
    await request.post('', data)
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
    await request.post('', data)
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
    const response = await request.post('', data)
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
    await request.post('', data)
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
    await request.post('', data)
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
    await request.post('', data)
    ElMessage.success('新增成功')
  } catch (error) {
    ElMessage.error('请求失败，请检查网络或服务器状态')
    return Promise.reject(error)
  }
}

// 3.1 获取电站特征水位数据
export const getReservoirInfoAxios = async () => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys'],
    values: ['/pms/Base', '/doreaddata/getdata', 'SelectSys_Reservoir_Info'],
  }

  try {
    const response = await request.post('', data)
    const responseStr = response.data[0]
    let resultData = []

    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    resultData = retWrapper.ret.SelectSys_Reservoir_Info
    return resultData
  } catch (error) {
    console.error('请求或解析失败:', error)
    return []
  }
}

// 3.2 批量更新（保存）电站特征水位数据
// 只比较6个字段，其它字段用旧数据拼接
export const updateReservoirInfoBatchAxios = async (oldTableDataList, newTableDataList) => {
  const checkFields = ['DTEL', 'CHFLZ', 'DSFLZ', 'NRFLZ', 'MNZ', 'HHZ']
  const allFields = [
    'PTCode',
    'STCDT',
    'DTEL',
    'CHFLZ',
    'DSFLZ',
    'NRFLZ',
    'MNZ',
    'HHZ',
    'HHZTM',
    'HMXQI',
    'HMXQITM',
    'HMXV',
    'HMXVTM',
    'HMXQO',
    'HMXQOTM',
    'BSDRA',
  ]

  const changedRowsParamStr = []

  for (let i = 0; i < newTableDataList.length; i++) {
    const newRow = newTableDataList[i]
    const oldRow = oldTableDataList[i]

    // 校验字段有效性
    const isInvalid = checkFields.some((field) => {
      const val = newRow[field]
      return val === '' || val === null || typeof val === 'undefined' || isNaN(Number(val))
    })
    if (isInvalid) {
      ElMessage.warning(`第 ${i + 1} 行字段存在空值或无效数字，请检查`)
      return Promise.reject(new Error(`第 ${i + 1} 行存在无效字段`))
    }

    // 判断是否有变化
    const isChanged = checkFields.some((field) => {
      const oldVal = Number(oldRow?.[field] ?? 0)
      const newVal = Number(newRow?.[field] ?? 0)
      return oldVal !== newVal
    })

    if (isChanged) {
      // 构造每一行的参数对象：6字段用新值，其它用旧值
      const finalRow = {}
      for (const field of allFields) {
        finalRow[field] = checkFields.includes(field) ? Number(newRow[field]) : oldRow[field]
      }

      const valueStr = allFields.map((key) => finalRow[key]).join('##')
      changedRowsParamStr.push(`(${valueStr})`)
    }
  }
  // 如果没有变化则不发请求
  if (changedRowsParamStr.length === 0) {
    ElMessage.info('无修改数据，无需保存')
    return Promise.reject('无变化')
  }

  const paramValues = `(${changedRowsParamStr.join('##')})`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateSys_Reservoir_Info)',
      '(PTCode##STCDT##DTEL##CHFLZ##DSFLZ##NRFLZ##MNZ##HHZ##HHZTM##HMXQI##HMXQITM##HMXV##HMXVTM##HMXQO##HMXQOTM##BSDRA)',
      paramValues,
    ],
  }
  await request.post('', data)
}

// 3.3 删除电站特征水位数据
// 删除水库特征水位数据
export const deleteReservoirInfoAxios = async (ptcode, stcdt) => {
  // PTCode : "100008"
  // STCDT : "0"
  const paramValues = `((${ptcode}##${stcdt}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(DeleteSys_Reservoir_Info)',
      '(PTCode##STCDT)',
      paramValues,
    ],
  }

  await request.post('', data)
}

// 4.1 获取水电站参数数据
export const getDispatchParameterAxios = async () => {
  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys'],
    values: ['/pms/Base', '/doreaddata/getdata', 'SelectSys_Dispatch_Parameter'],
  }

  try {
    const response = await request.post('', data)
    const responseStr = response.data[0]
    let resultData = []

    const retWrapper = {}
    eval(`
      (function() {
        ${responseStr}
        retWrapper.ret = ret;
      })()
    `)
    resultData = retWrapper.ret.SelectSys_Dispatch_Parameter
    return resultData
  } catch (error) {
    console.error('请求或解析失败:', error)
    return []
  }
}

// 4.2 批量更新（保存）水电站参数数据
export const updateDispatchParamsBatchAxios = async (oldTableList, tableDataList) => {
  const checkFields = ['HDesign', 'Capacity', 'minQ', 'minN', 'MaxQ', 'KN', 'KLost', 'Discrete']
  const allFields = ['PTCode', ...checkFields]

  // 要发送的变更记录
  const changedRowsParamStr = []

  for (let i = 0; i < tableDataList.length; i++) {
    const newRow = tableDataList[i]
    const oldRow = oldTableList.find((row) => row.PTCode === newRow.PTCode)

    if (!oldRow) continue

    const hasChanged = checkFields.some((field) => {
      const oldVal = Number(oldRow[field] ?? 0)
      const newVal = Number(newRow[field] ?? 0)
      return oldVal !== newVal
    })

    if (hasChanged) {
      const valueStr = allFields.map((field) => newRow[field]).join('##')
      changedRowsParamStr.push(valueStr)
    }
  }

  // 没有变更则不发请求
  if (changedRowsParamStr.length === 0) {
    ElMessage.info('无修改内容，无需保存')
    return Promise.reject('未变更')
  }

  const paramValues = `((${changedRowsParamStr.join(')##(')}))`

  const data = {
    language: 'js',
    names: ['action', 'dispatch', 'keys', 'paramNames', 'paramValues'],
    values: [
      '/pms/Base',
      '/doBaseQuery/InsertArrayDB',
      '(UpdateSys_Dispatch_Parameter)',
      '(PTCode##HDesign##Capacity##minQ##minN##MaxQ##KN##KLost##Discrete)',
      paramValues,
    ],
  }
  await request.post('', data)
}
