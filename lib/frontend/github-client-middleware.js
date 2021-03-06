const octokit = require('@octokit/rest')

module.exports = (getAppToken) => {
  return (req, res, next) => {
    res.locals.github = octokit()

    if (req.session.githubToken) {
      res.locals.github.authenticate({
        type: 'token',
        token: req.session.githubToken
      })
    }

    const isAdminFunction = isAdmin(res.locals.github)

    const appClient = octokit()
    appClient.authenticate({
      type: 'app',
      token: getAppToken()
    })

    res.locals.client = appClient
    res.locals.isAdmin = isAdminFunction

    next()
  }
}

/**
 * @returns true if the user is an admin of the Org or if the repo belongs to that user
 */
function isAdmin (githubClient) {
  return async function ({ org, username, type }) {
    // If this is a user installation, the "admin" is the user that owns the repo
    if (type === 'User') {
      return org === username
    }

    // Otherwise this is an Organization installation and we need to ask GitHub for role of the logged in user
    try {
      const {
        data: { role }
      } = await githubClient.orgs.getOrgMembership({ org, username })
      return role === 'admin'
    } catch (err) {
      console.log(err)
      console.log(`${org} has not accepted new permission for getOrgMembership`)
      console.log(`error=${err} org=${org}`)
      return false
    }
  }
}

module.exports.isAdminFunction = isAdmin
