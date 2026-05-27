const express = require('express')
const app = express()
const port = 3000

const db = require('./models')
const methodOverride = require('method-override')
const loginRoute = require('./routes/login.route')
const userRoute = require('./routes/user.route')
const jenisPekerjaanRoute = require('./routes/jenispekerjaan.route')
const submissionRoute = require('./routes/submission.route')
//! 
const rayonRoute = require('./routes/rayon.route')
const manageUsersRoute = require('./routes/manage-users.route')
const piketWcRoute = require('./routes/piket-wc.route')
//! untuk nyambungin fe - be
const cors = require('cors');

app.use(cors({
  origin: 'http://localhost:5173' // url fe
}));

db.sequelize.authenticate()
    .then(() => console.log("p(≧ O ≦)p ---- DATABASE SUDAH TERSAMBUNG! ---- q(≧ O ≦)q"))
    .catch(err => console.log(err))


// kelompok app.use disimpan diatas dari app.get atau listen
// app.use : memasang middleware atau menghubungkan route ke aplikasi
// express.json() : middleware umum, untuk mengakses json body pada payload (postman/input)
app.use(express.json())
app.use(methodOverride('_method'))
// membuat file yg tersimpan di folder uploads, bisa dimunculkan di browser nantinya
app.use('/uploads', express.static('uploads'))
app.use('/', loginRoute)
app.use('/users', userRoute)
app.use('/jenis-pekerjaan', jenisPekerjaanRoute)
app.use('/submissions', submissionRoute)
//!
app.use('/rayons', rayonRoute)
app.use('/manage-users', manageUsersRoute)
app.use('/piket-wc', piketWcRoute) 

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})