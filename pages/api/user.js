import Cors from 'cors'
import initMiddleware from '../../lib/init-middleware'
const { Octokit } = require('@octokit/rest')

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
  auth: process.env.github_token,
})

export default async function handler(req, res) {
  // Run cors
  await cors(req, res)

  // Get pull requests from devtoberfest repos to identify some participants
  const owner = 'SAP-samples'
  const pullRequestsWeek2Challenge = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: 'devtoberfest-2021',
  })

  const pullRequestsWeek4Challenge = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: 'devtoberfest-2021-security-coding-challenge',
  })

  const pullRequestsWeek6Challenge = await octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner: owner,
    repo: 'devtoberfest-2021-frontend-coding-challenge',
  })

  const pullRequests = [...pullRequestsWeek2Challenge, ...pullRequestsWeek4Challenge, ...pullRequestsWeek6Challenge]

  const challengePullRequests = pullRequests.filter(
    (pr) =>
      pr.title.includes('WEEK2CHALLENGE') || pr.title.includes('WEEK4CHALLENGE') || pr.title.includes('WEEK6CHALLENGE')
  )

  let devtoberfestParticipants = challengePullRequests.map((pr) => {
    if (pr.title.includes('WEEK2CHALLENGE')) {
      return pr.title.split('WEEK2CHALLENGE ')[1]
    }
    if (pr.title.includes('WEEK4CHALLENGE')) {
      return pr.title.split('WEEK4CHALLENGE ')[1]
    }
    if (pr.title.includes('WEEK6CHALLENGE')) {
      return pr.title.split('WEEK6CHALLENGE ')[1]
    }
  })

  // remove duplicates, leading/trailing hyphens and whitespace
  devtoberfestParticipants = devtoberfestParticipants
    .filter((v, i, a) => a.findIndex((t) => t === v) === i)
    .map((participant) => participant.replace(/-\s/g, '').trim())

  const POINTS_REGEX = /POINTS: ([0-9,]{1,6})/
  const LEVEL_REGEX = /LEVEL: ([0-9]{1})/

  //FIXME: instead of the following ugly and kinda slow HTML parsing stuff
  // we could fetch all badges from SAP people api and compare to the ones needed for devtoberfest points
  let participantScores = await Promise.all(
    devtoberfestParticipants.map(async (participant) => {
      const user = { id: participant, level: 0, points: 0 }

      // fetch the plain HTML from gameboard
      const res = await fetch(
        `https://devrel-tools-prod-scn-badges-srv.cfapps.eu10.hana.ondemand.com/devtoberfestContest/${participant}`
      )
      const html = await res.text()

      // check if points value is there
      if (POINTS_REGEX.test(html)) {
        // and extract that value
        const points = html.match(POINTS_REGEX)[1].replace(/,/g, '')
        user.points = parseInt(points)
      }

      // check if level value is there
      if (LEVEL_REGEX.test(html)) {
        // and extract that value
        const level = html.match(LEVEL_REGEX)[1]
        user.level = parseInt(level)
      }

      return user
    })
  )

  // sort the scores from highest to lowest points
  participantScores = participantScores.sort((a, b) => (a.points < b.points ? 1 : -1))

  res.json({ participantScores: participantScores })
}
