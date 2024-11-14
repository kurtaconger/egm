import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Typography, Avatar, Box, Divider } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import PropTypes from 'prop-types';
import { green } from '@mui/material/colors';
import { db, tripNameData } from '../utils/firebase';

// Define a simple color map for each user
const colors = {
  Kurt: '#0000FF',
  Jeff: '#FF0000',
  Carin: '#008000',
};

// Component for displaying each individual comment section
const NarrativeSection = ({ author, avatarColor, content, showAvatar }) => (
  <div style={{ marginBottom: '16px', wordBreak: 'break-word' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
      {showAvatar && (
        <Avatar sx={{ bgcolor: avatarColor, marginRight: 2, marginLeft: 1 }}>
          {author[0]}
        </Avatar>
      )}
      <Typography
        variant="h6"
        sx={{
          fontSize: '12px',
          fontFamily: 'Nunito',
          wordWrap: 'break-word',
          width: '100%',
          overflow: 'hidden',
          marginTop: 0
        }}
      >
        <span style={{ fontWeight: 'bold' }}>{author}</span> —{" "}
        <span dangerouslySetInnerHTML={{ __html: content }} />
      </Typography>
    </Box>
    <Divider sx={{ marginTop: 0.5, backgroundColor: '#956F2E' }} />
  </div>
);

NarrativeSection.propTypes = {
  author: PropTypes.string.isRequired,
  avatarColor: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  showAvatar: PropTypes.bool.isRequired,
};

// Main component for viewing comments
const ViewComments = ({ currentDocumentID }) => {
  const [collaborativeContent, setCollaborativeContent] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchComments = async () => {
      if (currentDocumentID) {
        console.log('Fetching for current document ID:', currentDocumentID);
        const docRef = doc(db, tripNameData, currentDocumentID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const content = docSnap.data().content || '';
          const parsedContent = parseForViewOnly(content);
          setCollaborativeContent(parsedContent);
        } else {
          console.log('No document found for this marker.');
        }
      }
    };

    fetchComments();
  }, [currentDocumentID]);

  function parseForViewOnly(content) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;

    const paragraphs = Array.from(tempDiv.querySelectorAll('p')).map(p => {
      const spanTexts = Array.from(p.querySelectorAll('span')).map(span => span.textContent || span.innerText);
      return `<p>${spanTexts.join(' ')}</p>`;
    });

    const contentSections = paragraphs.join('')
      .split(/(\[.*?\])/g)
      .filter(Boolean)
      .reduce((acc, curr, idx, arr) => {
        if (curr.startsWith('[') && curr.endsWith(']')) {
          acc.push({
            author: curr.slice(1, -1),
            content: arr[idx + 1] ? arr[idx + 1].trim() : '',
          });
        }
        return acc;
      }, []);

    return contentSections;
  }

  return (
    <Box
      sx={{
        height: '300px',
        overflowY: 'auto',
        padding: '10px',
        border: '1px solid #956F2E',
        fontFamily: 'Roboto',
        wordWrap: 'break-word',
        width: isMobile ? '90%' : '520px',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        wordBreak: 'break-word'
      }}
    >
      {collaborativeContent.map((section, index) => (
        <NarrativeSection
          key={index}
          author={section.author}
          avatarColor={colors[section.author] || green[500]}
          content={section.content.trim()}
          showAvatar={!isMobile}
        />
      ))}
    </Box>
  );
};

ViewComments.propTypes = {
  currentDocumentID: PropTypes.string.isRequired,
};

export default ViewComments;

