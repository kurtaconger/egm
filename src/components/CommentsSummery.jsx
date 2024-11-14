import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import PropTypes from 'prop-types'; 
import './mapPopup.css';





const CommentsSummery = ({ currentMarker, tripID }) => {
    const [collaborativeContent, setCollaborativeContent] = useState('');
    const [responseText, setResponseText] = useState('');
    const [hasRunChatGPT, setHasRunChatGPT] = useState(false);

    console.log ("COMMENTS SUMMERY " + currentMarker)
    const currentDocumentID = currentMarker.id;
    console.log ("COMMENTS SUMMERY ID " + currentMarker.id)
    const tripNameData = "MAP-" + tripID + "-DATA" 
    console.log ("COMMENTS SUMMERY TRIP ID " + tripNameData)

    const prefixQuestionText = `The following is a set of comments we had during a trip. Summarize the comments. 
                                If you add a fun fact,  seperate it into a seperate paragraph. 
                                correct grammer including adding paragraph breaks where appropriate. use this character as a paragraph break ~  
                                The audience includes individuals on the trip and friends who did not go on the trip.`;
    const postQuestionText = ` Limit the response to 600 characters.`;
    const roleOfResponder = `Helpful advisor who summarizes comments and adds interesting facts to engage the audience.`;
    const disclaimer = 'ChatGPT can make mistakes. Check important info.';

    // helper functoins
    const removeBrackets = (text) => {
      // Remove brackets around names without additional formatting
      return text.replace(/\[(\w+)\]/g, '$1');

    };
    function addParagraphBreaks(text) {
      return text.replace(/~/g, "<BR><BR>");
    }
    

    // get comments data from Firebase for the location
    useEffect(() => {
      const fetchComments = async () => {
        if (currentDocumentID) {
          console.log('Fetching for current document ID:', currentDocumentID);
          const docRef = doc(db, tripNameData, currentDocumentID);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const contentwithBrackets = docSnap.data().content || '';
            const content = removeBrackets(contentwithBrackets)

            console.log("CONTENT:    " + content);
            setCollaborativeContent(content);
          } else {
            console.log('No document found for this marker.');
          }
        }
      };

      fetchComments();
    }, [currentDocumentID]);

    // ask ChatGTP to summarice the comments
    useEffect(() => {
      if (collaborativeContent && !hasRunChatGPT) {
        callChatGPT();
        setHasRunChatGPT(true);
      }
    }, [collaborativeContent, hasRunChatGPT]);

    const callChatGPT = async () => {
      setResponseText('Loading . . .');

      try {
        const questionForChatGPT = `${prefixQuestionText} ${collaborativeContent} ${postQuestionText}`;
        const messages = [
          {
            role: 'system',
            content: roleOfResponder,
          },
          {
            role: 'user',
            content: questionForChatGPT,
          },
        ];

        const response = await fetch('https://openai-api.kurtconger.workers.dev', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });
        const data = await response.json();
        const responseText = addParagraphBreaks(data.content)
        console.log ("RESPONSE: " + responseText)
        setResponseText(`${responseText}<br><br>${disclaimer}`);
      } catch (err) {
        setResponseText(err.message);
      }
    };

    return (
      <div className="comments-summery-div">
        <p className="comments-summery-text" dangerouslySetInnerHTML={{ __html: responseText }}></p>
      </div>
    );
};

CommentsSummery.propTypes = {
  currentDocumentID: PropTypes.string.isRequired,
};

export default CommentsSummery;
