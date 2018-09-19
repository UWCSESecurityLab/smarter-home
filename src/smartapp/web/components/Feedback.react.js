import React from 'react';
import Button from '@material/react-button';
import PropTypes from 'prop-types';
import SmartAppClient from '../lib/SmartAppClient';
import { notify as toast } from 'react-notify-toast';
import { withRouter } from 'react-router-dom';
import toastError from '../lib/error-toaster';

const smartAppClient = new SmartAppClient();

const FeedbackType = {
  BUG: 'bug',
  EXPERIENCE: 'experience'
}

class Feedback extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      feedbackType: null,
      bugInput: '',
      experienceInput: ''
    }
    if (location.search.substring(1) === 'diary') {
      this.state.feedbackType = FeedbackType.EXPERIENCE;
    }

    this.changeType = this.changeType.bind(this);
    this.submitBugReport = this.submitBugReport.bind(this);
    this.submitExperienceSample = this.submitExperienceSample.bind(this);
  }

  changeType(type) {
    this.setState({ feedbackType: type });
  }

  submitBugReport() {
    smartAppClient.postUserReport(this.state.bugInput, FeedbackType.BUG)
      .then(() => {
        toast.show('Thanks for the bug report! We will get back to you ASAP', 'success');
        this.props.history.push('/home');
      }).catch(toastError);
  }

  submitExperienceSample() {
    smartAppClient.postUserReport(this.state.experienceInput, FeedbackType.EXPERIENCE)
      .then(() => {
        toast.show('Thanks for sharing!', 'success');
        this.props.history.push('/home');
      }).catch(toastError);
  }

  renderBugReport() {
    return (
      <div>
        <h4>Please describe the problem you are experiencing.</h4>
        <p>
          Sorry about the bug! If it's an urgent issue, you can contact Eric
          via email or text.
        </p>
        <textarea value={this.state.bugInput} placeholder="What's going on?"
        onChange={(e) => {
          this.setState({ bugInput: e.target.value})
        }}/>
        <Button className="mdc-button-blue" raised onClick={this.submitBugReport}>
          Submit
        </Button>
      </div>
    );
  }

  renderExperienceSample() {
    return (
      <div>
        <h4>Tell us what happened</h4>
        <ul>
          <li>What technology was being used? Was it a particular device, or a feature in the app?</li>
          <li>Which people were involved?</li>
          <li>How did it make you feel?</li>
        </ul>
        <textarea value={this.state.experienceInput} placeholder="What's going on?"
        onChange={(e) => {
          this.setState({ experienceInput: e.target.value})
        }}/>
        <Button className="mdc-button-blue" raised onClick={this.submitExperienceSample}>
          Submit
        </Button>
      </div>
    );
  }

  render() {
    return (
      <section className="home-item home-item-padded">
        <h3>Feedback</h3>
        <p>
          What kind of feedback do you have?
        </p>
        <div className="mdc-form-field">
          <div className="mdc-radio">
            <input className="mdc-radio__native-control"
                  type="radio" id="feedback-experience" name="feedback-type"
                  checked={this.state.feedbackType === FeedbackType.EXPERIENCE}
                  onChange={() => {
                      this.changeType(FeedbackType.EXPERIENCE)
                  }}/>
            <div className="mdc-radio__background">
              <div className="mdc-radio__outer-circle"></div>
              <div className="mdc-radio__inner-circle"></div>
            </div>
          </div>
          <label htmlFor="feedback-experience">
            Something interesting happened
          </label>
        </div>
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
        { this.state.feedbackType === FeedbackType.EXPERIENCE
          ? this.renderExperienceSample()
          : null
        }
        { this.state.feedbackType === FeedbackType.BUG
          ? this.renderBugReport()
          : null
        }
      </section>
    );
  }
}

Feedback.propTypes = {
  history: PropTypes.object
}

export default withRouter(Feedback);
