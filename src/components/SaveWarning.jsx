import React from 'react';
import './navigation.css';

const SaveWarning = ({ onCloseWarning }) => {
  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">Warning to Save Text</h2>
          <button className="modal--close-button" onClick={onCloseWarning}>
            X
          </button>
        </div>
        <div className="select--body">
          <div className="select--container">
            <label className="config--label">
              You have not saved the AI-generated text yet.<br /><br />
              Close this window and press <strong>Save to Cloud</strong> to save your comment.<br /><br />
              Feel free to make updates before saving.<br /><br />
              If you'd like to try again, press <strong>Erase and Re-record</strong>.<br /><br />
              Or, you can ignore the AI feature and add comments manually by pressing <strong>Edit Comments</strong>.<br /><br />
            </label>

            <button className="syntax--button" onClick={onCloseWarning}>
                Exit
            </button>  
          </div>
        </div>
      </div>
    </div>
  );
};

export default SaveWarning;

