import React, { Component } from 'react';
import { render } from 'react-dom';
import { CosmicService } from './cosmic.service';
import { ContentfulService } from './contentful.service';
import { ImporterService } from './importer.service';
import { cosmicImageUrl, contentfulImageUrl } from './images';
import ReactLoading from 'react-loading';
import './style.css';

/*
const slug = 'contentful';
const read_key = 'HhrcgEdgFQnsaZGgpDxShKwgVyly80LhgIR9SiWdfpvHqjQBlZ';
const write_key = 'DbV9GQNAPqU7hZBeZlz9uPht8LGAS9KuwvuF7Vg63O4kka03yl';
*/

class App extends Component {
  importerService;

  constructor() {
    super();

    this.state = {
      file: null,
      slug: 'contentful',
      read_key: 'HhrcgEdgFQnsaZGgpDxShKwgVyly80LhgIR9SiWdfpvHqjQBlZ',
      write_key: 'DbV9GQNAPqU7hZBeZlz9uPht8LGAS9KuwvuF7Vg63O4kka03yl',
      errorMessage: false,
      progress: false,
      loading: false,
      messages: []
    };
  }

  render() {
    const { errorMessage, loading, progress, messages } = this.state;

    return (
      <div>
       <div>
        <img src={contentfulImageUrl}/>
        <img src={cosmicImageUrl}/>
       </div>
       <div>
        <p>To import data from Contentful create an export file via the Contentful CLI then upload it here.</p>

        <p>For more information visit:&nbsp;
        <a href="https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/">https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/</a>
        </p>
       </div>
       {errorMessage ? <div className="error">{errorMessage}</div> : ''}
       {loading ? <ReactLoading type="bubbles" color="#000000" /> : ''}
       {progress ? <div className="progress">{progress}</div> : ''}
       {messages.length ? (
         <div>
          <h3>Messages:</h3>
          <ul>
            {messages.map((message, i) => <li key={i}>{message}</li>)}
          </ul>
         </div>
       ) : ''}
       {loading ? '' : 
        <div>

          <div>
            <input type="file" accept=".json" onChange={(e) => this.setFile(e)}/>
          </div>
          <button onClick={() => this.parseFile()}>Run import</button>
        </div>
       }
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
    
    if(!slug || !read_key || !write_key) {
      throw new Error('Set auth values');
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

      this.createService();

      const { file } = this.state;

      if(!file) {
        throw new Error('No file provided');
      }

      this.importerService.loadContentfulContent(
        file,
        m => this.progressCallback(m),
        e => this.errorCallback(e),
        () => this.completeCallback(),
        m => this.messageCallback(m)
      );
    } catch(e) {
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

    this.setState({...this.state, file});
  }
}

render(<App />, document.getElementById('root'));
