const User = require('../../models/user')
const bcrypt = require('bcrypt')
const passport = require('passport')
const session = require('express-session')


function authController() {
    const _getRedirectUrl = (req) => {
        return req.user.role === 'admin' ? '/admin/orders' : '/'
    }
    return {
        login(req, res) {
            res.render('auth/login')
        },
        postLogin(req, res, next) {
            // validating
            const { email, password } = req.body
            if (!email || !password) {
                req.flash('error', 'All fields are required')
                return res.redirect('/login')
            }

            // Login Logic
            passport.authenticate('local', (err, user, info) => {
                if (err) {
                    req.flash('error', info.message)
                    return next(err)
                }
                if (!user) {
                    req.flash('error', info.message)
                    return res.redirect('/login')
                }
                req.login(user, (err) => {
                    if (err) {
                        req.flash('error', info.message)
                        return next(err)
                    }
                    return res.redirect(_getRedirectUrl(req))
                })
            })(req, res, next)
        },
        register(req, res) {
            res.render('auth/register')
        },
        async postRegister(req, res) {
            const { name, email, password } = req.body
            // Validate Request
            if (!name || !email || !password) {
                req.flash('error', 'All fields are required')
                req.flash('name', name)
                req.flash('email', email)
                return res.redirect('/register')
            }
            // Check if email exists
            User.exists({ email: email }, (err, result) => {
                if (result) {
                    req.flash('error', 'Email already taken')
                    req.flash('name', name)
                    req.flash('email', email)
                    return res.redirect('/register')
                }
            })

            const hashedPassword = await bcrypt.hash(password, 10)

            // Creating user in DB if everything is alright
            const user = new User({
                name: name,
                email: email,
                password: hashedPassword
            })
            user.save().then((user) => {
                return res.redirect('/')
            }).catch(err => {
                req.flash('error', 'Something went wrong')
                return res.redirect('/')
            })
        },
        logout(req, res) {
            req.logout()
            // res.clearCookie(mongoStore)
            // req.session.destroy() // Destr0ing session after logout
            return res.redirect('/login')
        }
    }
}

module.exports = authController