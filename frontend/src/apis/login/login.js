import request from '@/utils/request'
// http://10.243.171.83:7777/api/Action/RunLogin
// {"usercode":"lsd","password":"lsd"}

export const loginAxios = (usercode, password) => {
  return request.post('RunLogin', {
    usercode: usercode,
    password: password,
  })
}
