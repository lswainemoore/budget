import Head from 'next/head'
import Quiz from '../components/quiz'
import styles from '../styles/Home.module.css'

export default function Home(props) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Budget Quiz</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          How well do you understand the federal budget?
        </h1>

        <p className={styles.description}>
          Take this quiz to find out:
        </p>

        <Quiz budgetData={props.budgetData}/>

      </main>

      <footer className={styles.footer}>

      </footer>
    </div>
  )
}


export async function getStaticProps(context) {
  const budgetData = (await import('../data/totals_by_subfunction.json')).data
  console.log(budgetData)
  return {
    props: {budgetData},
  }
}
