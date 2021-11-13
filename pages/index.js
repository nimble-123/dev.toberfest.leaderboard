import useSWR from 'swr'
import Head from 'next/head'
import { Link } from '@chakra-ui/react'
import { ExternalLinkIcon } from '@chakra-ui/icons'
import { Spinner } from '@chakra-ui/react'
import { Image } from '@chakra-ui/react'
import { Text } from '@chakra-ui/react'
import { Divider } from '@chakra-ui/react'
import { Table, Thead, Tbody, Tfoot, Tr, Th, Td, TableCaption } from '@chakra-ui/react'
import { IconButton } from '@chakra-ui/react'
import { MoonIcon, SunIcon } from '@chakra-ui/icons'
import { useColorMode } from '@chakra-ui/react'
import styles from '../styles/Home.module.css'

const fetcher = (url) => fetch(url).then((res) => res.json())

export default function Home() {
  const { colorMode, toggleColorMode } = useColorMode()
  const { data, error } = useSWR('/api/user', fetcher)

  if (error) return <div>Failed to load</div>
  if (!data) {
    return (
      <div className={styles.loading}>
        <Spinner size="xl" />
        <Text as="h2">Fetching data...</Text>
        <Text as="h4">This can take up to 20 seconds</Text>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Devtoberfest 2021 Leaderboard</title>
        <meta name="description" content="Devtoberfest 2021 Leaderboard" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <IconButton onClick={toggleColorMode}>{colorMode === 'light' ? <MoonIcon /> : <SunIcon />}</IconButton>
        <Image
          boxSize="300px"
          src={colorMode === 'light' ? '/Devtoberfest-Logo-light.png' : '/Devtoberfest-Logo-dark.png'}
          alt="Devtoberfest logo"
        />
        <h1 className={styles.title}>Leaderboard</h1>
        <p className={styles.description}>Check the unofficial leaderboard right below 🐱‍💻</p>
        <Divider />
        <Table variant="striped" size="sm">
          <TableCaption placement="top">
            Kudos to all participants, organizers and supporters of this event 👾
          </TableCaption>
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Developer</Th>
              <Th>Level</Th>
              <Th isNumeric>Points</Th>
            </Tr>
          </Thead>
          <Tbody>
            {data.participantScores.map((user, index) => (
              <Tr key={user.id}>
                <Td>{++index}</Td>
                <Td>{user.id}</Td>
                <Td>{user.level}</Td>
                <Td isNumeric>{user.points}</Td>
              </Tr>
            ))}
          </Tbody>
          <Tfoot>
            <Tr>
              <Th>Rank</Th>
              <Th>Developer</Th>
              <Th>Level</Th>
              <Th isNumeric>Points</Th>
            </Tr>
          </Tfoot>
        </Table>
      </main>

      <footer className={styles.footer}>
        <Text>
          Made with ❤,{' '}
          <Link href="https://nextjs.org" isExternal>
            Next.JS
            <ExternalLinkIcon mx="2px" />
          </Link>
          ,{' '}
          <Link href="https://chakra-ui.com" isExternal>
            the Chakra Design system
            <ExternalLinkIcon mx="2px" />
          </Link>{' '}
          and a lot of ☕ coffee!
        </Text>
      </footer>
    </div>
  )
}
