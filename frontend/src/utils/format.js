// 把date对象格式化为YYYY-MM-DD的字符串
export const formatDate = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0') // 月份从0开始
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
