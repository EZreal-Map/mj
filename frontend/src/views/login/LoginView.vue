<template>
  <div class="login-center-container">
    <div class="login-box">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <h1 class="login-title">登录窗口</h1>
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="form.username"
            placeholder="请输入用户名"
            @keydown.enter="onSubmit(formRef)"
            :style="{ width: formInputWidth }"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            placeholder="请输入密码"
            type="password"
            @keydown.enter="onSubmit(formRef)"
            :style="{ width: formInputWidth }"
          />
        </el-form-item>
        <div class="button-group">
          <el-button type="primary" @click="onSubmit(formRef)">确定</el-button>
          <el-button class="right-btn" @click="logout()">退出</el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { loginAxios } from '@/apis/login/login.js'
import { ElMessage } from 'element-plus'

const router = useRouter()
// const goToAppView = () => {
//   router.push({
//     name: 'app',
//   })
// }

const formRef = ref()
const form = reactive({
  username: '',
  password: '',
})

const formInputWidth = '240px'

const rules = reactive({
  username: [{ required: true, message: '请输入用户名字', trigger: 'blur' }],
  password: [
    { required: true, message: '请选择密码', trigger: 'blur' },
    {
      pattern: /^[A-Za-z0-9]+$/, // 只允许数字和字母
      message: '密码只能包含数字和字母',
      trigger: 'blur',
    },
  ],
})
const onSubmit = async (formRef) => {
  // 如果 formRef 不存在，直接返回，防止下面代码报错
  if (!formRef) return
  // 校验表单
  formRef.validate(async (valid) => {
    if (valid) {
      const response = await loginAxios(form.username, form.password)
      if (response?.data?.success) {
        ElMessage.success('登录成功')
        // 这里可以添加跳转逻辑，例如使用 router.push() 方法
        router.push({ name: 'Show' })
      } else {
        ElMessage.error('登录失败')
      }
    } else {
      ElMessage.error('登录失败')
    }
    // router.push({
    //   name: 'app'
    // })
  })
}
</script>
<style scoped>
.login-center-container {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中 */
  height: 100vh;
  width: 100vw;
  background-color: #f5f5f5; /* 可选，设置背景色以美化页面 */
  margin: 0; /* 清除默认的外边距 */
}

.login-box {
  background-color: #ffffff; /* 登录框背景颜色 */
  padding: 10px 30px 20px 30px; /* 增加填充 */
  border-radius: 10px; /* 圆角边框 */
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); /* 增加阴影 */
  text-align: center; /* 文本居中 */
  width: 350px;
}

.login-title {
  font-size: 24px; /* 标题字体大小 */
  margin-bottom: 20px; /* 标题下方间距 */
}

/* 既是 <p> 元素又具有 login-content 类的元素 */
p.login-content {
  margin-bottom: 20px;
}

.el-form-item {
  margin-bottom: 20px; /* 表单项之间的间距 */
}

.el-button {
  padding: 0 25px;
}

.position-right {
  position: absolute;
  right: 0%;
}

.right-btn {
  background-color: #ff4d4f; /* 退出登录按钮颜色 */
  color: white; /* 按钮文字颜色 */
  border-color: #ff4d4f; /* 按钮边框颜色 */
}

.right-btn:hover {
  background-color: #ff7875; /* 按钮悬停颜色 */
  border-color: #ff7875; /* 按钮悬停边框颜色 */
}

.button-group {
  display: flex;
  justify-content: space-between;
  margin: 0 30px;
}
</style>
