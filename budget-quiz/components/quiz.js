import React from 'react'
import {SortableContainer, SortableElement} from 'react-sortable-hoc';
import arrayMove from 'array-move';
import clone from 'clone'

class Quiz extends React.Component {
  constructor(props) {
    super(props);
    this.budgetData = props.budgetData;

    this.numQuestions = 10;
    this.numOptionsPerQuestion = 2;

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

  nextQuestion(correct) {
    this.setState((prevState) => ({
      currentQuestionNum: prevState.currentQuestionNum + 1,
      correctTotal: prevState.correctTotal + correct,
      finished: this.state.currentQuestionNum >= this.numQuestions
    }));
  }

  constructQuestions() {
    // TODO:
    //  - don't pick from same budget function for a given question.
    //  - don't pick sums that are too close for a given question
    //  - exclude "other" functions

    // full list of the options
    let allOptions = {};
    this.budgetData.forEach((f) => {
      f.subfunctions.forEach((sf) => {
        if (sf.total === 0) {
          return;
        }
        allOptions[`${f.budget_function_title} - ${sf.budget_subfunction_title}`] = {
          bfTitle: f.budget_function_title,
          bsfTitle: sf.budget_subfunction_title,
          total: sf.total,
          prettyTotal: this.prettifyMoney(sf.total),
        }
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
        choices.push(allOptions[unusedOptions[chosenIndex]]);
        // no longer unused!
        unusedOptions.splice(chosenIndex, 1);
      }

      questions.push(choices);
    }
    this.setState({
      questions: questions,
    });
  }

  render() {
    let interior;
    if (this.state.started) {
      if (!this.state.finished) {
        interior = (
          <div>
            {this.state.questions.map((q, i) =>
              <div
                key={i}
                style={{display: this.state.currentQuestionNum === (i + 1) ? 'unset': 'none'}}
              >
                <Question
                  choices={q}
                  nextQuestion={(correct) => this.nextQuestion(correct)}
                />
              </div>
            )}
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


const Option = SortableElement(({value}) => {
  return (
    <div
      style={{
        userSelect: 'none',
        border: '1px solid gray',
        borderRadius: '2px',
        margin: '4px 0px',
        padding: '5px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
        }}
      >
        {value.bfTitle}
      </div>
      <div
        style={{
          fontSize: '20px',
        }}
      >
        &#8627;{value.bsfTitle}
      </div>

    </div>
  )
});

const OptionsList = SortableContainer(({items}) => {
  return (
    <div
      style={{
        listStyleType: 'none',
      }}
    >
      {items.map((value, index) => (
        <Option key={`item-${value}`} index={index} value={value} />
      ))}
    </div>
  );
});

class Question extends React.Component {
  constructor(props) {
    super(props);

    let choices = clone(props.choices);
    this.shuffle(choices);
    this.state = {
      choices: choices,
      submitted: false,
      correct: null,
    };
  }

  shuffle(arr) {
    // shuffles arr in place.
    // from: https://medium.com/@nitinpatel_20236/how-to-shuffle-correctly-shuffle-an-array-in-javascript-15ea3f84bfb
    for(let i = arr.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * i)
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
    }
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    this.setState(({choices}) => ({
      choices: arrayMove(choices, oldIndex, newIndex),
    }));
  }

  submit = () => {
    let correct = true;
    let last = 0;
    // is this safe to do here? or does it need to be in setState?
    for (let c of this.state.choices) {
      if (c.total < last) {
        correct = false;
        break;
      }
      last = c.total;
    }
    this.setState({
      correct: correct,
      submitted: true,
    });
  }

  next = () => {
    this.props.nextQuestion(this.state.correct);
  }

  // selectAnswer(choice) {
  //   if (choice == this.props.correctChoice) {
  //     this.props.onCorrect();
  //   } else {
  //     this.props.onIncorrect();
  //   }
  // }

  render() {

    return (
      <div>
        <OptionsList items={this.state.choices} onSortEnd={this.onSortEnd} />
        {!this.state.submitted &&
          <button
            onClick={this.submit}
          >
            submit
          </button>
        }
        {this.state.submitted &&
          <div>
            <div>{ this.state.correct ? 'Right!' : 'Wrong!' }</div>
            <button
              onClick={this.next}
            >
              Next
            </button>
          </div>
        }
      </div>
    )
  }
}

export default Quiz;


// TODO
// functionality
// ~ change to being ordering instead of pick one
// - submit answer
// - immediate feedback on correctness
// - make a visualization after you select answer (i'm thinking bars drop down from buttons)
// - hints (e.g. 2B is X twinkies...oh you meant a helpful hint??)
// - stats (e.g. you scored better than X% of users, and 80% of Representatives*  *probably)
// - selection of questions to toss out really hard things
// - difficulty level to affect ratios used for ^
// styling
// - buttons
// - everything else
