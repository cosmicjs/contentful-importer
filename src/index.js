import React, { Component } from "react";
import { render } from "react-dom";
import { CosmicService } from "./cosmic.service";
import { ContentfulService } from "./contentful.service";
import { ImporterService } from "./importer.service";
import ReactLoading from "react-loading";
import "./style.css";
import { Input, Button, Modal, Header, Icon, Message } from 'semantic-ui-react'

import cosmicLogo from "./img/cosmic.svg";
import contentfulLogo from "./img/contentful.png";

const getParam = param => {
  var urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

class App extends Component {
  importerService;

  constructor() {
    super();

    this.state = {
      file: null,
      slug: getParam("bucket_slug"),
      read_key: getParam("read_key"),
      write_key: getParam("write_key"),
      errorMessage: false,
      progress: false,
      loading: false,
      messages: []
    };

    this.createService();
    
    this.closeSuccessModal = () => {
      this.setState({
        ...this.state,
        progress: false
      });
    }
  }


  render() {
    const { errorMessage, loading, progress, messages, slug } = this.state;
    if (progress === 'Successfully created objects') {
      return (
        <Modal open={true} basic size='small'>
          <Header icon='check' color='green' content='Entries Imported' />
          <Modal.Content>
            <p style={{ fontSize: 16 }}>
              Your entries have been successfully imported!&nbsp;&nbsp;&nbsp;<a href={`https://app.cosmicjs.com/${slug}/dashboard`} target='_parent'>Go see them&nbsp;&nbsp;<Icon name='external' /></a>
            </p>
          </Modal.Content>
          <Modal.Actions>
            <Button inverted onClick={() => this.closeSuccessModal()}>
              <Icon name='times' /> Close
            </Button>
          </Modal.Actions>
        </Modal>
      )
    }
    return (
      <div className="root">
        <h1 style={{ marginBottom: 30 }}>Contentful Importer</h1>
        <div style={{ marginBottom: 30, position: 'relative' }}>
          <img style={{ height: 65, width: 'auto' }} src={cosmicLogo} alt="Cosmic JS Logo" />
          <div class="objects-import-wrapper">
            <svg className="objects-import" width="486" height="468" viewBox="0 0 486 418" fill="none">
              <path d="M225 6673V38" stroke="#00AFD7" stroke-opacity=".4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="5 15"></path>
            </svg>
          </div>
          <img style={{ height: 65, width: 'auto', position: 'relative', left: 100 }} src={contentfulLogo} alt="Contentful Logo" />
        </div>
        <div style={{ marginBottom: 30 }}>
          <p>
            To import data from Contentful create an export file via the
            Contentful CLI then upload it here.
          </p>
          Use the Contentful CLI to download a JSON file export of your space. Example:
          <Message>
            <code>
contentful space export --space-id YOUR_SPACE_ID --management-token YOUR_MANAGEMENT_TOKEN
            </code>
          </Message>
          <p>
            For more information <a target="_blank" href="https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/">follow the instructions here</a>.
          </p>
        </div>
        {errorMessage ? <div className="error">{errorMessage}</div> : ""}
        {loading ? <ReactLoading type="bubbles" color="#000000" /> : ""}
        {progress ? <div className="progress">{progress}</div> : ""}
        {messages.length ? (
          <div style={{ marginBottom: 30 }}>
            <h3>Messages:</h3>
            <ul>
              {messages.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          </div>
        ) : (
          ""
        )}
        {loading ? (
          ""
        ) : (
          <div style={{ marginBottom: 30 }}>
            <div style={{ marginBottom: 20 }}>
              <Input
                type="file"
                accept=".json"
                onChange={e => this.setFile(e)}
              />
            </div>
            <Button primary onClick={() => this.parseFile()}>Run import</Button>
          </div>
        )}
      </div>
    );
  }

  completeCallback() {
    this.setState({
      messages: this.state.messages,
      loading: false
    });
  }

  createService() {
    const { slug, read_key, write_key } = this.state;

    if (!slug) {
      throw new Error("Set slug value");
    }

    const cosmic = new CosmicService(slug, read_key, write_key);

    const contentful = new ContentfulService();

    this.importerService = new ImporterService(contentful, cosmic);
  }

  errorCallback(message) {
    this.setState({
      errorMessage: message.toString(),
      messages: this.state.messages,
      loading: false
    });
  }

  parseFile() {
    try {
      this.setState({
        messages: [],
        loading: true
      });

      const { file } = this.state;

      if (!file) {
        throw new Error("No file provided");
      }

      this.importerService.loadContentfulContent(
        file,
        m => this.progressCallback(m),
        e => this.errorCallback(e),
        () => this.completeCallback(),
        m => this.messageCallback(m)
      );
    } catch (e) {
      this.errorCallback(e);
    }
  }

  messageCallback(m) {
    const { messages } = this.state;

    this.setState({
      ...this.state,
      messages: [...messages, m]
    });
  }

  progressCallback(message) {
    this.setState({
      ...this.state,
      progress: message
    });
  }

  setFile(e) {
    const file = e.target.files[0];

    this.setState({ ...this.state, file });
  }
}

render(<App />, document.getElementById("root"));
