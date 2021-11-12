import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
const { Octokit } = require('@octokit/rest')
require('dotenv').config()

// Initialize the cors middleware
const cors = initMiddleware(
  // You can read more about the available options here: https://github.com/expressjs/cors#configuration-options
  Cors({
    // Only allow requests with GET, POST and OPTIONS
    methods: ['GET', 'POST', 'OPTIONS'],
  })
)

// Initialize octokit github api
const octokit = new Octokit({
  auth: process.env.GH_TOKEN,
})

export default async function handler(req, res) {
  // Run cors
  await cors(req, res)

  const owner = 'SAP-samples'
  const repo = 'devtoberfest-2021'
  const repo2 = 'devtoberfest-2021-security-coding-challenge'

  const githubResponse = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: repo,
  })

  const githubResponse2 = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: repo2,
  })

  const array = githubResponse.concat(githubResponse2)

  const filteredPR = array.filter((pr) => pr.title.includes('WEEK2CHALLENGE') || pr.title.includes('WEEK4CHALLENGE'))
  const prusers = filteredPR.map((pr) => {
    if (pr.title.includes('WEEK2CHALLENGE')) {
      return pr.title.split('WEEK2CHALLENGE ')[1].trim()
    } else if (pr.title.includes('WEEK4CHALLENGE')) {
      return pr.title.split('WEEK4CHALLENGE ')[1].trim()
    }
  })

  const POINTS_REGEX = /POINTS: ([0-9,]{1,6})/
  const LEVEL_REGEX = /LEVEL: ([0-9]{1})/

  const gameboardResponses = prusers.map(async (users) => {
    const res = await fetch(
      `https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/devtoberfestContest/${users}`
    )

    let user = { id: users, level: 0, points: 0 }

    const body = await res.text()

    if (POINTS_REGEX.test(body)) {
      const points = body.match(POINTS_REGEX)[1].replace(/,/g, '')
      user.points = parseInt(points)
    }

    if (LEVEL_REGEX.test(body)) {
      const level = body.match(LEVEL_REGEX)[1]
      user.level = parseInt(level)
    }

    return user
  })

  const users = await Promise.all(gameboardResponses)

  const removedDuplicates = users.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i)

  const sorted = removedDuplicates.sort((a, b) => (a.points < b.points ? 1 : -1))

  res.json({ users: sorted })
}
