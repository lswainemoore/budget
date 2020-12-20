import React from 'react'

class Quiz extends React.Component {
  constructor(props) {
    super(props);
    this.budgetData = props.budgetData;

    this.numQuestions = 10;
    this.numOptionsPerQuestion = 3;

    this.state = {
      started: false,
      questions: null,
    };
  }

  start() {
    this.constructQuestions();
    this.setState({started: true});
  }

  prettifyMoney(amount) {
    // see: https://stackoverflow.com/a/23917134
    let order = Math.floor(Math.log10(amount));
    let suffix;
    let correctOrder;
    if (order >= 6) {
      [suffix, correctOrder] = {
        6: ['M', 6],
        7: ['M', 6],
        8: ['M', 6],
        9: ['B', 9],
        10: ['B', 9],
        11: ['B', 9],
        12: ['T', 12],
        13: ['T', 12],
        114: ['T', 12],
      }[order];
    }
    else {
      suffix = 'K';
      correctOrder = 3;
    }
    const divAmount = Math.round(amount / Math.pow(10, correctOrder));
    return `$${divAmount}${suffix}`;
  }

  constructQuestions() {
    // TODO:
    //  - don't pick from same budget function for a given question.
    //  - don't pick sums that are too close for a given question
    //  - i actually kind of a different form of question: order these X budget items

    // full list of the options
    let allOptions = {};
    this.budgetData.forEach((f) => {
      f.subfunctions.forEach((sf) => {
        if (sf.total === 0) {
          return;
        }
        allOptions[`${f.budget_function_title} - ${sf.budget_subfunction_title}`] = this.prettifyMoney(sf.total);
      })
    });
    let unusedOptions = Object.keys(allOptions);

    let usedAnswers = [];
    let questions = [];
    for (const x of Array(this.numQuestions).keys()) {

      // randomly select our options
      let choices = [];
      for (const y of Array(this.numOptionsPerQuestion).keys()) {
        const chosenIndex = Math.floor(Math.random() * unusedOptions.length);
        choices.push(unusedOptions[chosenIndex]);
        // no longer unused!
        unusedOptions.splice(chosenIndex, 1);
      }

      // choose answer
      const correctChoice = choices[Math.floor(Math.random() * choices.length)];
      const clue = allOptions[correctChoice];

      questions.push({
        choices: choices,
        correctChoice: correctChoice,
        clue: clue
      });
    }
    console.log(questions);
    this.setState({questions: questions});
  }

  render() {
    let interior;
    if (this.state.started) {
      interior = (
        <div>
          <p>we started</p>
          {this.state.questions.map((q) => {
            return (
              <Question clue={q.clue} choices={q.choices} correctChoice={q.correctChoice}/>
            )
          })}
        </div>
      );
    } else {
      interior = (
        <a href="#" onClick={() => this.start()}>
          start!
        </a>
      );
    }
    return (
      <div>
        {interior}
      </div>
    )
  }
}

class Question extends React.Component {
  constructor(props) {
    super(props);
    this.clue = this.props.clue;
    this.choices = this.props.choices;
    this.correctChoice = this.props.correctChoice;
  }

  render() {
    return (
      <div>
        <p>
          Which of the following costs {this.clue}?
        </p>
        <ul>
          {this.choices.map(c => {
            return (
              <li>{c}</li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default Quiz;
