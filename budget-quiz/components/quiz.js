import React from 'react'
import {SortableContainer, SortableElement} from 'react-sortable-hoc'
import clone from 'clone';

import styles from '../styles/Quiz.module.scss'


class Quiz extends React.Component {
  constructor(props) {
    super(props);
    this.budgetData = props.budgetData;

    this.numQuestions = 10;
    this.numOptionsPerQuestion = 5;

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
          <div
            style={{
              textAlign: 'center',
            }}
          >
            {this.state.questions.map((q, i) =>
              <div
                key={`{question-${i}}`}
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
        <a
          onClick={() => this.start()}
          href="#"
        >
          $tart!
        </a>
      );
    }
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '800px',
        }}
      >
        {interior}
      </div>
    )
  }
}


class Option extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div>
        <div
          className={styles.optionsBox}
        >
          <div
            className={styles.ellipsize}
            style={{
              fontSize: '12px',
            }}
          >
            {this.props.bfTitle}
          </div>
          <div
            className={styles.ellipsize}
            style={{
              fontSize: '20px',
            }}
          >
            &#8627;{this.props.bsfTitle}
          </div>
        </div>
        {this.props.postSubmit &&
          <div
            style={{display: 'inline-block'}}
          >
            {Array.from(Array(Math.min(this.props.numDollarSigns, this.props.showingUpToXSigns))).map((j, index) => {
              return (
                <span
                  key={`moneybag-${index}`}
                  style={{
                    padding: '2px',
                    fontSize: '16px',
                  }}
                >
                  $
                </span>
              )
            })}
          </div>
        }
        {this.props.postSubmit && this.props.doneWithAnimation &&
          <div
            style={{display: 'inline-block'}}
          >
            <p>({this.props.prettyTotal})</p>
          </div>
        }
      </div>
    )
  }
}


const OptionWrapper = SortableElement(({value}) => value);

const OptionsList = SortableContainer(({items}) => {
  return (
    <div
      style={{
        listStyleType: 'none',
      }}
    >
      {items.map((value, index) => {
        let [optionId, option] = value;
        return (
          <OptionWrapper key={`item-${optionId}`} index={index} value={option} />
        )
      })}
    </div>
  );
});

class Question extends React.Component {
  constructor(props) {
    super(props);

    let choices = clone(props.choices);
    this.shuffle(choices);

    this.maxDollarSigns = 20;
    const totals = choices.map(c => c.total);
    const maxTotal = Math.max(...totals);
    choices.forEach((c, i) => {
      c.scaled = c.total / maxTotal;
      // should have at least one dollar sign even if it screws up the scale.
      c.numDollarSigns = Math.max(Math.round(this.maxDollarSigns * c.scaled), 1);
      c.optionIndex = i;
    })

    this.state = {
      choices: choices,
      submitted: false,
      correct: null,
      showingUpToXSigns: 0,
      doneWithAnimation: false,
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
    this.setState(({choices}) => {
      const newChoices = [...choices]
      // see https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
      newChoices.splice(newIndex, 0, newChoices.splice(oldIndex, 1)[0])
      return {choices: newChoices}
    });
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

    setTimeout(
      () => this.timerID = setInterval(
        () => this.tickDollarSigns(),
        30
      ),
      2000,
    );

    this.setState({
      correct: correct,
      submitted: true,
    });
  }

  componentWillUnmount() {
    if (this.timerID) {
      clearInterval(this.timerID);
    }
  }

  tickDollarSigns() {
    if (this.state.showingUpToXSigns > this.maxDollarSigns) {
      clearInterval(this.timerID);
      this.setState({doneWithAnimation: true});
      return;
    }
    this.setState((prevState) => ({
      showingUpToXSigns: prevState.showingUpToXSigns + 1,
    }));
  }

  next = () => {
    this.props.nextQuestion(this.state.correct);
  }

  render() {

    const options = this.state.choices.map(o => {
      return (
        [o.optionIndex, <Option
          optionIndex={o.optionIndex}
          bsfTitle={o.bsfTitle}
          bfTitle={o.bfTitle}
          numDollarSigns={o.numDollarSigns}
          prettyTotal={o.prettyTotal}
          total={o.total}
          postSubmit={this.state.submitted}
          showingUpToXSigns={this.state.showingUpToXSigns}
          doneWithAnimation={this.state.doneWithAnimation}
        />]
      )
    })

    return (
      <div>
        <div
          className={styles.options + (this.state.submitted ? ' ' + styles.post : '')}
        >
          <OptionsList items={options} onSortEnd={this.onSortEnd} />
        </div>
        <div
          style={{
            width: '300px',
            textAlign: 'center',
            padding: '20px 0px',
            margin: '0 auto',
          }}
        >
          {!this.state.submitted &&
            <div>
              <a
                onClick={this.submit}
                href="#"
                style={{
                  fontSize: '16px',
                }}
              >
                Submit
              </a>
            </div>
          }
          {this.state.submitted && this.state.doneWithAnimation &&
            <div
              style={{
                width: '300px',
                textAlign: 'center',
                padding: '20px 0px',
                margin: '0 auto',
              }}
            >
              <div>{ this.state.correct ? 'Right!' : 'Wrong!' }</div>
              <a
                href="#"

                onClick={this.next}
              >
                Next&gt;&gt;
              </a>

            </div>
          }
        </div>
      </div>
    )
  }
}

export default Quiz;
