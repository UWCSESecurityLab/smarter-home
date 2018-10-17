import React from 'react';
import ReactDOM from 'react-dom';
import Button from '@material/react-button';

class SelectLogUser extends React.Component {
  constructor(props) {
    super(props);
    this.state = { users: [] };
  }
  componentDidMount() {
    fetch('https://dev.kadara.cs.washington.edu/logviewer/users').then((response) => {
      response.json().then((users) => {
        this.setState({users: users});
      });
    }).catch((err) => {
      console.error(err);
    });
  }
  render() {
    return (
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Installed App Id</th>
          </tr>
        </thead>
        <tbody>
          { this.state.users.map((user) => {
            return (
              <tr key={user.displayName} onClick={() => {
                this.props.onUserClicked(user.installedAppId)
              }}>
                <td>{user.displayName}</td>
                <td>{user.installedAppId}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}

class Logs extends React.Component {
  constructor(props) {
    super(props);
    this.state = {logs: [], page: 0};
    this.updateLogs = this.updateLogs.bind(this);
  }

  updateLogs() {
    fetch('https://dev.kadara.cs.washington.edu/logviewer/logs/' + this.props.installedAppId).then((response) => {
      response.json().then((logs) => {
        this.setState({logs: logs});
      });
    }).catch((err) => {
      console.error(err);
    });
  }

  componentDidMount() {
    this.updateLogs();
  }

  next() {
    if (this.state.logs.length == 0) {
      return;
    }
    this.setState({ page: this.state.page + 1 });
    this.updateLogs();
  }

  prev() {
    if (this.state.logs.length == 0) {
      return;
    }
    this.setState({ page: this.state.page + 1 });
    this.updateLogs();
  }

  render() {
    return (
      <div>
        <div>
          <Button></Button>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Level</th>
              <th>Message</th>
              <th>Method</th>
              <th>URL</th>
              <th>Request Body</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            { this.state.logs.map((log) => {
              return (
                <tr key={log._id}>
                  <td>{log.timestamp}</td>
                  <td>{log.level}</td>
                  <td>{log.message}</td>
                  <td>{log.meta.method}</td>
                  <td>{log.meta.url}</td>
                  <td>{JSON.stringify(log.meta.body)}</td>
                  <td>{JSON.stringify(log.meta)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}

class LogViewer extends React.Component {
  constructor(props) {
    super(props);
    this.state = { view: 'USERS', installedAppId: null };
  }

  render() {
    switch (this.state.view) {
      case 'USERS':
        return <SelectLogUser onUserClicked={(id) => {
          this.setState({ installedAppId: id, view: 'LOGS'})
        }}/>
      case 'LOGS':
        return <Logs installedAppId={this.state.installedAppId}/>
      default:
        return null;
    }
  }

}


ReactDOM.render(<LogViewer/>, document.getElementById('react'));