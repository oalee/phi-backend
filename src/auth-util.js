const jwt = require("jsonwebtoken");

const bcrypt = require("bcryptjs")

const config = {
    secret: 'huPIPW812EWlUv0iuPxUZ5ukEqvp4IFZnWCCdNsrT7xLVMRPeSSwJYxGqBFRTQtru4s9Xtab0VkCwtEcjOybYbNMiiwsnhOFjwZfVkRl31RuLI/x6YXAIJGSCI3p2l9lusECUC+R6a/TvWjcZsTp8dDVHzQVyLa4VrAXEiRRdEAWVH2jJRQL+UVXR1plflKEJaOS8W/vN3hTcVq5arud6eWDsxC0eVjvLIGqrfQh7YDZ4ZExZV6S64sOdu8CGQrQEXvOACEFlr4X2FVxptEDiny6PMGWyv8vtnZ98B0PVCdXwVUW6qc38wOhE6QKS6Q3QBVxLIG5agW1XDcF5+zmZA=='
}

const encryptPassword = password => new Promise((resolve, reject) => {
	bcrypt.genSalt(10, (err, salt) => {
		if (err) {
			reject(err)
			return false
		}
		bcrypt.hash(password, salt, (err, hash) => {
			if (err) {
				reject(err)
				return false
			}
			resolve(hash)
			return true
		})
	})
})

const comparePassword = (password, hash) => new Promise(async (resolve, reject) => {
	try {
		const isMatch = await bcrypt.compare(password, hash)
		resolve(isMatch)
		return true
	} catch (err) {
		reject(err)
		return false
	}
})

const getToken = payload => {
    const token = jwt.sign(payload, config.secret, {
        expiresIn: 604800, // 1 Week
    })
    return token
}

const verifyToken = token => {
    try {
        const payload = jwt.verify(token, config.secret);
        return { loggedIn: true, payload };
    } catch (err) {
        // Add Err Message
        return { loggedIn: false }
    }
}

module.exports = {
    getToken,
    verifyToken,
    encryptPassword,
    comparePassword
}