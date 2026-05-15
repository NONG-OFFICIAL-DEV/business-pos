import http from './api'

export default {
  userLogin(email, password) {
    return http.post('/login', {
      email: email,
      password: password
    })
  },

  userLogout() {
    return http.post('/logout') 
  },

  me() {
    return http.get('/me', {
      meta: { loader: 'skeleton' }
    })
  },
     /** PIN login — branch_id is optional */
  loginByPin(pin_code, branch_id = null) {
    return http.post('/login-pin', { pin_code, branch_id })
  },
}
