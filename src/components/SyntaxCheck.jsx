import React from 'react';
import './navigation.css';

const SyntaxCheck = ({ validDisplayNames, onClose, onRestore }) => {
  
  const tempDisplayNames = [
    "Kurt", "Carin", "PJ", "Jeff", "Rubo", "Ginger", "Pam", "Max", "Marc", 
    "Hal", "Lias", "Chris", "Greg H", "Grag W", "Bob", "Alexander"
  ];

  const uniqueSortedDisplayNames = [...new Set(validDisplayNames)].sort();

  // Split names into two columns
  const half = Math.ceil(uniqueSortedDisplayNames.length / 2);
  const column1 = uniqueSortedDisplayNames.slice(0, half);
  const column2 = uniqueSortedDisplayNames.slice(half);

  return (
    <div className="modal--overlay">
      <div className="modal--content">
        <div className="modal--header">
          <h2 className="modal--title">Syntax Check of Group Narrative</h2>
          <button className="modal--close-button" onClick={onClose}>
            X
          </button>
        </div>
        <div className="select--body">
          <div className="select--container">
            <label className="config--label">
              The joint narrative for this location contains <strong>invalid</strong> display names.<br /><br />
              Display names are names surrounded by square brackets.
              Only Display Names in the list below are valid. <br /><br />
              Exit this window and make corrections or press the "Restore" button below to restore the last valid Joint Narrative.
            </label>
            <div className="valid-names-table">
              <table>
                <tbody>
                  <tr>
                    <td>
                      {column1.map((name, index) => (
                        <div key={`col1-${index}`} className="table-row">{name}</div>
                      ))}
                    </td>
                    <td>
                      {column2.map((name, index) => (
                        <div key={`col2-${index}`} className="table-row">{name}</div>
                      ))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="syntax--button-container">
              <button className="syntax--button" onClick={(e) => { e.stopPropagation(); onRestore(); }}>
                Restore Valid Joint Narrative
              </button>
              <button className="syntax--button" onClick={onClose}>
                Exit Without Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SyntaxCheck;



