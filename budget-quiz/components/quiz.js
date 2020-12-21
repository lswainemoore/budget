import React from 'react'

class Quiz extends React.Component {
  constructor(props) {
    super(props);
    this.budgetData = props.budgetData;

    this.numQuestions = 10;
    this.numOptionsPerQuestion = 3;

    this.state = {
      started: false,
      finished: false,
      questions: null,
      currentQuestionNum: null,
      correctTotal: null,
    };

    // this.nextQuestion.bind(this);
    // this.onCorrect.bind(this);
    // this.onIncorrect.bind(this);
  }

  start() {
    this.constructQuestions();
    this.setState({
      started: true,
      currentQuestionNum: 1,
      correctTotal: 0,
    });
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

  nextQuestion() {
    if (this.state.currentQuestionNum < this.numQuestions) {
      this.setState((prevState) => ({
        currentQuestionNum: prevState.currentQuestionNum + 1
      }));
    } else {
      this.setState({finished: true})
    }
  }

  onCorrect() {
    this.setState((prevState) => ({
      correctTotal: prevState.correctTotal + 1
    }));
    this.nextQuestion();
  }

  onIncorrect() {
    this.nextQuestion();
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
    this.setState({questions: questions});
  }

  render() {
    let interior;
    if (this.state.started) {
      if (!this.state.finished) {
        interior = (
          <div>
            {this.state.questions.map((q) =>
              <Question
                clue={q.clue}
                choices={q.choices}
                correctChoice={q.correctChoice}
                onCorrect={() => this.onCorrect()}
                onIncorrect={() => this.onIncorrect()}
              />
            )[this.state.currentQuestionNum - 1]}
            <p>{this.state.currentQuestionNum} / {this.numQuestions}</p>
          </div>
        );
      }
      else {
        interior = (
          <p>you scored {this.state.correctTotal} out of {this.numQuestions}</p>
        )
      }
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
    this.state = {}
  }

  selectAnswer(choice) {
    if (choice == this.props.correctChoice) {
      this.props.onCorrect();
    } else {
      this.props.onIncorrect();
    }
  }

  render() {
    return (
      <div>
        <p>
          Which of the following costs {this.props.clue}?
        </p>
        <ul>
          {this.props.choices.map(c => {
            return (
              <button
                onClick={() => this.selectAnswer(c)}
              >
                {c}
              </button>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default Quiz;
