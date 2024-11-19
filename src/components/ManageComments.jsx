import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Mark } from '@tiptap/core';
import { doc, setDoc, getDoc } from 'firebase/firestore';

import { db } from '../utils/firebase';

import './mapPopup.css'

const colors = {
  Kurt: '#0000CC', // Blue
  Alexander: '008000', // Green
  PJ: '#956F2E', // Yellow
  Carin: '#D35400' // Orange
};

const CommentColor = Mark.create({
  name: 'commentColor',
  addOptions() {
    return {
      colors: colors,
    };
  },
  addAttributes() {
    return {
      color: {
        default: null,
      },
    };
  },
  parseHTML() {
    return [
      {
        tag: 'span',
        getAttrs: element => ({
          color: element.getAttribute('data-color'),
        }),
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', { ...HTMLAttributes, 'data-color': HTMLAttributes.color, style: `color: ${HTMLAttributes.color}` }, 0];
  },
});

// Main Function
const ManageComments = ({ user, currentMarker, tripID }) => {
  // Check if user is logged in
  if (!user) {
    return <p>This function requires a login. Press the Login button in the upper right corner of the screen.</p>;
  }

  const currentUser = user.displayName;
  const tripNameData = "MAP-" + tripID + "-DATA";
  const currentDocumentID = currentMarker.id;

  const editor = useEditor({
    extensions: [
      StarterKit,
      CommentColor.configure({
        colors: colors,
      }),
    ],  
    content: '',
    editorProps: {
      handlePaste(view, event) {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        const fragment = view.state.schema.text(text, [
          view.state.schema.marks.commentColor.create({
            color: user.hexColor,
          }),
        ]);
        const tr = view.state.tr.replaceSelectionWith(fragment);
        view.dispatch(tr);
        return true;
      },
    },
  });

  const [isNameAdded, setIsNameAdded] = useState(false);

  useEffect(() => {
    const handleChange = async () => {
      if (editor && currentDocumentID) {
        const htmlContent = editor.getHTML();
        if (currentDocumentID) {
          console.log(`Setting content for document: ${tripNameData}/${currentDocumentID}`);
          const locationRef = doc(db, tripNameData, currentDocumentID);
          await setDoc(locationRef, { content: htmlContent }, { merge: true });
        }
      }
    };

    if (editor) {
      editor.on('update', handleChange);
    }

    return () => {
      if (editor) {
        editor.off('update', handleChange);
      }
    };
  }, [editor, currentDocumentID]);

  useEffect(() => {
    const fetchComments = async () => {
      if (editor && currentDocumentID) {
        console.log(`Fetching document: ${tripNameData}/${currentDocumentID}`);
        const docRef = doc(db, tripNameData, currentDocumentID);
        const docSnap = await getDoc(docRef);

        let content = '';
        if (docSnap.exists()) {
          content = docSnap.data().content || '';
        }

        editor.commands.setContent(content);
        setIsNameAdded(false); // Reset the name added state for new location
      }
    };

    fetchComments();
  }, [currentDocumentID, editor, currentUser]);

  useEffect(() => {
    if (editor) {
      const handleFocus = () => {
        if (!isNameAdded) {
          const userName = `[${currentUser}] `;
          console.log("in handlefocus user.hexColor " + user.hexColor + " " + user.textColor);
          editor.chain().focus('end').insertContent({ type: 'text', text: userName, marks: [{ type: 'commentColor', attrs: { color: user.hexColor } }] }).run();
          setIsNameAdded(true); // Mark that the user's name has been added
        }
      };

      editor.on('focus', handleFocus);

      return () => {
        editor.off('focus', handleFocus);
      };
    }
  }, [currentUser, editor, isNameAdded]);

  useEffect(() => {
    setIsNameAdded(false); // Reset the name added state when the user changes
  }, [currentUser]);

  return (
    <div className='comments--editor-control-div'>
      <EditorContent editor={editor} spellCheck={true} />
    </div>
  );
};

export default ManageComments;
