import React from 'react';
import Button from '@material/react-button';

const FeedbackType = {
  BUG: 'BUG',
  ANECDOTE: 'ANECDOTE'
}

class Feedback extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      feedbackType: FeedbackType.BUG
    }
  }

  render() {
    return (
      <section className="home-item">
        <h3>Feedback</h3>
        <p>
          What kind of feedback do you have?
        </p>
        <div className="mdc-form-field">
          <div className="mdc-radio">
            <input className="mdc-radio__native-control"
                  type="radio" id="feedback-bug" name="feedback-type"
                  checked={this.state.feedbackType === FeedbackType.BUG}
                  onChange={() => {
                      this.changeType(FeedbackType.BUG)
                  }}/>
            <div className="mdc-radio__background">
              <div className="mdc-radio__outer-circle"></div>
              <div className="mdc-radio__inner-circle"></div>
            </div>
          </div>
          <label htmlFor="feedback-bug">Something isn't working</label>
        </div>
        <div className="mdc-form-field">
          <div className="mdc-radio">
            <input className="mdc-radio__native-control"
                  type="radio" id="feedback-anecdote" name="feedback-type"
                  checked={this.state.feedbackType === FeedbackType.ANECDOTE}
                  onChange={() => {
                      this.changeType(FeedbackType.ANECDOTE)
                  }}/>
            <div className="mdc-radio__background">
              <div className="mdc-radio__outer-circle"></div>
              <div className="mdc-radio__inner-circle"></div>
            </div>
          </div>
          <label htmlFor="feedback-anecdote">
            Something interesting happened
          </label>
        </div>
        <h4>Tell us what happened.</h4>
      </section>
    );
  }
}

export default Feedback;
